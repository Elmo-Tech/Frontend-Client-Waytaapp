'use client';
import { useRouter, useSearchParams } from 'next/navigation';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../../lib/api/errors';
import { useStaffI18n } from '../../../lib/i18n/client';
import { localeLabel } from '../../../lib/i18n/locale-labels';
import { toMinorUnits } from '../../guest-menu/money';
import * as settingsApi from '../../settings/api';
import type { RestaurantLocalesResponse } from '../../settings/types';
import * as menuApi from '../api';
import { useAddonsPreview } from '../components/products/use-addons-preview';
import { type SizeDraft } from '../components/products/VariantsSection';
import type {
  Category,
  Menu,
  ModifierGroup,
  Product,
  ProductVariant
} from '../types/index';
import { EMPTY_FORM, MONEY_DECIMAL_PATTERN, nextDisplayOrder, ProductEditorProps, ProductFormState, SecondaryDrafts, toDiscountInput, toFormState } from '../types/product-editor';
import {
  validateDiscountForm
} from '../utils/discount';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../lib/api/user-errors';
import { validateImageFile } from '../utils/image-validation';
import { useTranslationsEditor } from './use-translations-editor';

export function useProductEditor({
  restaurantId,
  mode,
  productId,
}: ProductEditorProps) {
  const { t } = useStaffI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategoryIdParam = searchParams.get('categoryId');
  const translationErrorParam = searchParams.get('translationError');
  const imageErrorParam = searchParams.get('imageError');
  const sizeErrorParam = searchParams.get('sizeError');
  const createdParam = searchParams.get('created');

  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locales, setLocales] = useState<RestaurantLocalesResponse | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [secondaryDrafts, setSecondaryDrafts] = useState<SecondaryDrafts>({});
  // The content language tab being edited: shared with the preview so it shows (in the right
  // language and direction) exactly what is being typed.
  const [activeLocale, setActiveLocale] = useState<string>('__default__');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // The product's add-ons (reported by the Add-ons section) and which preview view is open.
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[] | null>(null);
  const [previewView, setPreviewView] = useState<'card' | 'page'>('card');
  // The product's sizes (reported by the Sizes section) for the guest preview.
  const [variants, setVariants] = useState<ProductVariant[] | null>(null);
  // Each size's name in the secondary content language being edited (for the preview).
  const [variantNames, setVariantNames] = useState<{
    locale: string | null;
    names: Record<string, string>;
  }>({ locale: null, names: {} });
  const handleVariantNames = useCallback(
    (locale: string | null, names: Record<string, string>) => setVariantNames({ locale, names }),
    [],
  );
  // Create mode: sizes typed before the Product exists (saved right after it is created).
  const [sizeDrafts, setSizeDrafts] = useState<SizeDraft[]>([]);
  const handleDraftsChange = useCallback((drafts: SizeDraft[]) => {
    setSizeDrafts(drafts);
    if (drafts.length === 0) return;
    const cheapest = drafts.reduce((best, draft) =>
      toMinorUnits(draft.price) < toMinorUnits(best.price) ? draft : best,
    );
    setForm((prev) => (prev.basePrice === cheapest.price ? prev : { ...prev, basePrice: cheapest.price }));
  }, []);
  // While the Product has active sizes its price IS the cheapest size: keep the form's price in step.
  const handleVariantsChange = useCallback((list: ProductVariant[]) => {
    setVariants(list);
    const active = list.filter((variant) => variant.status === 'ACTIVE');
    if (active.length === 0) return;
    const cheapest = active.reduce((best, variant) =>
      toMinorUnits(variant.price) < toMinorUnits(best.price) ? variant : best,
    );
    setForm((prev) => (prev.basePrice === cheapest.price ? prev : { ...prev, basePrice: cheapest.price }));
  }, []);

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageUploadBusy, setImageUploadBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const secondaryLocales = useMemo(
    () =>
      locales?.locales.filter((row) => !row.isDefault && row.isActive).map((row) => row.locale) ?? [],
    [locales],
  );
  // Saved translations (edit mode). Lifted here so the preview can show the language being
  // edited; the editor section below only renders them.
  const translations = useTranslationsEditor({
    restaurantId,
    entityId: mode === 'edit' ? (productId ?? null) : null,
    locales: secondaryLocales,
    list: menuApi.getProductTranslations,
    put: menuApi.putProductTranslation,
    remove: menuApi.deleteProductTranslation,
  });

  const addonsPreview = useAddonsPreview({
    restaurantId,
    productId: mode === 'edit' ? (productId ?? null) : null,
    groups: modifierGroups,
    locale: activeLocale === '__default__' ? (locales?.defaultLocale ?? 'en') : activeLocale,
    defaultLocale: locales?.defaultLocale ?? 'en',
    enabled: previewView === 'page',
  });

  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setStatus('loading');
    setLoadError(null);
    try {
      const [menusData, categoriesData, localesData, productsData] = await Promise.all([
        menuApi.listMenus(restaurantId),
        menuApi.listCategories(restaurantId),
        settingsApi.getRestaurantLocales(restaurantId),
        menuApi.listProducts(restaurantId),
      ]);
      if (requestRef.current !== requestId) return; // superseded -- discard.

      setMenus(menusData);
      setCategories(categoriesData);
      setLocales(localesData);
      setAllProducts(productsData);

      if (mode === 'edit') {
        const found = productsData.find((candidate) => candidate.id === productId);
        if (!found) {
          setStatus('error');
          setLoadError(t('product.notFound'));
          return;
        }
        setProduct(found);
        setForm(toFormState(found));
        if (translationErrorParam || imageErrorParam || sizeErrorParam) {
          // Redirected here straight after Create because one or more
          // secondary-locale translations and/or the image upload failed
          // to save (FT-1 correction 2 / FT-2, Section 5/14) -- the
          // Product itself is real and already created, never
          // duplicate-create it; just surface the failure(s) so the User
          // can retry below.
          const failures: string[] = [];
          if (translationErrorParam) {
            const failedLabels = translationErrorParam.split(',').map(localeLabel).join(', ');
            failures.push(t('product.failTranslation', { languages: failedLabels }));
          }
          if (imageErrorParam) {
            failures.push(t('product.failImage'));
          }
          if (sizeErrorParam) {
            failures.push(t('product.failSizes'));
          }
          setFormError(
            t('product.createdPartial', { problems: failures.join(t('menu.form.and')) }),
          );
        } else if (createdParam) {
          // FT-6B, Section 8: a fully successful Create now lands here
          // directly (see `handleSubmit` below) rather than back on Menu
          // Management -- this explicit notice keeps that redirect from
          // feeling like a silent, unexplained screen switch (the original
          // FT-2 correction's concern), while letting Staff configure
          // Modifiers/Presets immediately without a second navigation.
          setSaveNotice(t('product.createdNotice'));
        }
      } else {
        const preselected =
          initialCategoryIdParam && categoriesData.some((category) => category.id === initialCategoryIdParam)
            ? initialCategoryIdParam
            : (categoriesData[0]?.id ?? '');
        setForm({
          ...EMPTY_FORM,
          categoryId: preselected,
          displayOrder: String(nextDisplayOrder(productsData, preselected)),
        });
      }
      setStatus('loaded');
    } catch (error) {
      if (requestRef.current !== requestId) return;
      if (isUnauthenticatedError(error)) {
        redirectToLogin();
        return;
      }
      setStatus('error');
      setLoadError(describeError(error));
    }
  }, [
    restaurantId,
    mode,
    productId,
    initialCategoryIdParam,
    translationErrorParam,
    imageErrorParam,
    sizeErrorParam,
    createdParam,
    t,
  ]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  // FT-2, Section 16: a local object-URL preview only ever exists for a
  // `pendingImageFile` (Create mode, before the Product exists). Computed
  // with `useMemo` rather than effect+state, so the URL is available on the
  // very same render as the file selection; the effect below only revokes
  // the previous URL once it's no longer used, never calls setState.
  const pendingImagePreviewUrl = useMemo(
    () => (pendingImageFile ? URL.createObjectURL(pendingImageFile) : null),
    [pendingImageFile],
  );
  useEffect(() => {
    return () => {
      if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl);
    };
  }, [pendingImagePreviewUrl]);

  function handleSelectImageFile(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setImageError(null);
    if (mode === 'create') {
      // No Product exists yet -- keep the file locally; `handleSubmit`
      // uploads it right after Create succeeds (Section 14).
      setPendingImageFile(file);
      return;
    }
    if (productId) {
      void uploadImageNow(productId, file);
    }
  }

  async function uploadImageNow(id: string, file: File) {
    setImageUploadBusy(true);
    setImageError(null);
    try {
      const result = await menuApi.uploadProductImage(restaurantId, id, file);
      setProduct((prev) =>
        prev ? { ...prev, primaryImageAssetPath: result.primaryImageAssetPath } : prev,
      );
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        redirectToLogin();
        return;
      }
      setImageError(describeError(error));
    } finally {
      setImageUploadBusy(false);
    }
  }

  async function handleRemoveImage() {
    if (mode === 'create') {
      // Nothing persisted yet -- just drop the local selection.
      setPendingImageFile(null);
      return;
    }
    if (!productId) return;
    setImageUploadBusy(true);
    setImageError(null);
    try {
      await menuApi.removeProductImage(restaurantId, productId);
      setProduct((prev) => (prev ? { ...prev, primaryImageAssetPath: null } : prev));
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        redirectToLogin();
        return;
      }
      setImageError(describeError(error));
    } finally {
      setImageUploadBusy(false);
    }
  }

  const categoryGroups = useMemo(() => {
    const byMenu = new Map<string, Category[]>();
    for (const category of categories) {
      const list = byMenu.get(category.menuId) ?? [];
      list.push(category);
      byMenu.set(category.menuId, list);
    }
    return menus
      .map((menu) => ({ menu, categories: byMenu.get(menu.id) ?? [] }))
      .filter((group) => group.categories.length > 0);
  }, [menus, categories]);

  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  // Suggestions are picked from the same menu as this product (the Guest cart only offers that menu's dishes).
  const menuCategoryIds = new Set(
    categories
      .filter((category) => category.menuId === selectedCategory?.menuId)
      .map((category) => category.id),
  );
  const sameMenuProducts = allProducts.filter((candidate) => menuCategoryIds.has(candidate.categoryId));
  const backHref = selectedCategory
    ? `/staff/restaurants/${restaurantId}/menu?menuId=${selectedCategory.menuId}&categoryId=${selectedCategory.id}`
    : `/staff/restaurants/${restaurantId}/menu`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (form.categoryId === '') {
      setFormError(t('product.categoryRequired'));
      return;
    }
    if (form.name.trim() === '') {
      setFormError(t('menu.tr.nameRequired'));
      return;
    }
    const displayOrder = Number(form.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setFormError(t('menu.form.displayOrderInvalid'));
      return;
    }
    if (!MONEY_DECIMAL_PATTERN.test(form.basePrice)) {
      setFormError(t('product.priceInvalid'));
      return;
    }
    if (form.discountMode !== 'NONE') {
      const discountError = validateDiscountForm({
        type: form.discountMode,
        value: form.discountValue,
        basePrice: form.basePrice,
        startsOn: form.discountStartsOn,
        endsOn: form.discountEndsOn,
      });
      if (discountError) {
        setFormError(t(`product.discount.error.${discountError}` as const));
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);
    setSaveNotice(null);
    try {
      if (mode === 'create') {
        const created = await menuApi.createProduct(restaurantId, {
          categoryId: form.categoryId,
          name: form.name,
          description: form.description.trim() === '' ? null : form.description,
          status: form.status,
          availability: form.availability,
          basePrice: form.basePrice,
          displayOrder,
          allowCustomerNotes: form.allowCustomerNotes,
          featured: form.featured,
          ...(form.discountMode === 'NONE' ? {} : { discount: toDiscountInput(form) }),
        });

        // Secondary-locale translations are only created once the Product
        // itself exists (FT-1 correction 2, Section 4): PUT each entered
        // draft now, using the Product id the create call just returned. A
        // blank draft is skipped entirely -- never PUT an empty translation
        // (Section 5).
        const translationFailures: string[] = [];
        for (const [locale, draft] of Object.entries(secondaryDrafts)) {
          if (draft.name.trim() === '') continue;
          try {
            await menuApi.putProductTranslation(restaurantId, created.id, locale, {
              name: draft.name.trim(),
              description: draft.description.trim() === '' ? null : draft.description.trim(),
            });
          } catch (translationError) {
            if (isUnauthenticatedError(translationError)) {
              redirectToLogin();
              return;
            }
            translationFailures.push(locale);
          }
        }

        // The selected image (if any) is only uploaded once the Product
        // exists, exactly like a secondary translation (FT-2, Section 14).
        let imageUploadFailed = false;
        if (pendingImageFile) {
          try {
            await menuApi.uploadProductImage(restaurantId, created.id, pendingImageFile);
          } catch (imageUploadError) {
            if (isUnauthenticatedError(imageUploadError)) {
              redirectToLogin();
              return;
            }
            imageUploadFailed = true;
          }
        }

        // Sizes typed in the Sizes section are created now (DEC-041); the Backend keeps the
        // Product price equal to the cheapest one. The first size is the default.
        let sizesFailed = false;
        for (const [index, draft] of sizeDrafts.entries()) {
          try {
            const createdSize = await menuApi.createProductVariant(restaurantId, created.id, {
              name: draft.name,
              status: 'ACTIVE',
              price: draft.price,
              displayOrder: index,
              isDefault: index === 0,
            });
            for (const [locale, text] of Object.entries(draft.translations)) {
              await menuApi.putProductVariantTranslation(restaurantId, created.id, createdSize.id, locale, {
                name: text,
              });
            }
          } catch (sizeError) {
            if (isUnauthenticatedError(sizeError)) {
              redirectToLogin();
              return;
            }
            sizesFailed = true;
            break;
          }
        }

        // The Product itself was created successfully either way -- never
        // duplicate-create it on retry (Section 5). A partial translation
        // and/or image failure sends the User to the Product Edit route
        // (with the failure carried over as query params) so they can
        // retry there without hiding that the Product is real and already
        // saved.
        //
        // FT-6B, Section 8: full success ALSO now lands on the Product
        // Edit route (revising the earlier FT-2 correction that returned
        // to Menu Management instead) -- Modifiers/Presets can only be
        // configured once the Product exists, so redirecting straight to
        // Edit lets Staff do that immediately without a second navigation.
        // The `created=1` param drives an explicit "Product created"
        // notice (above) so this still reads as an intentional landing,
        // never a silent, unexplained screen switch.
        const failureParams = new URLSearchParams();
        if (translationFailures.length > 0) {
          failureParams.set('translationError', translationFailures.join(','));
        }
        if (imageUploadFailed) {
          failureParams.set('imageError', '1');
        }
        if (sizesFailed) {
          failureParams.set('sizeError', '1');
        }
        if (failureParams.size === 0) {
          failureParams.set('created', '1');
        }
        router.replace(
          `/staff/restaurants/${restaurantId}/menu/products/${created.id}?categoryId=${created.categoryId}&${failureParams.toString()}`,
        );
        return;
      }

      if (!productId) return;
      const updated = await menuApi.updateProduct(restaurantId, productId, {
        categoryId: form.categoryId,
        name: form.name,
        description: form.description.trim() === '' ? null : form.description,
        status: form.status,
        basePrice: form.basePrice,
        displayOrder,
        allowCustomerNotes: form.allowCustomerNotes,
        featured: form.featured,
        discount: toDiscountInput(form),
      });

      let finalAvailability = updated.availability;
      let availabilityWarning: string | null = null;
      if (form.availability !== updated.availability) {
        try {
          const availabilityResult = await menuApi.updateProductAvailability(
            restaurantId,
            productId,
            form.availability,
          );
          finalAvailability = availabilityResult.availability;
        } catch (availabilityError) {
          if (isUnauthenticatedError(availabilityError)) {
            redirectToLogin();
            return;
          }
          availabilityWarning = describeError(availabilityError);
        }
      }

      const finalProduct: Product = { ...updated, availability: finalAvailability };
      setProduct(finalProduct);
      setForm(toFormState(finalProduct));
      setSaveNotice(
        availabilityWarning
          ? t('product.availabilityFailed', { reason: availabilityWarning })
          : t('product.saved'),
      );
    } catch (submitError) {
      if (isUnauthenticatedError(submitError)) {
        redirectToLogin();
        return;
      }
      if (submitError instanceof ApiError) {
        if (submitError.code === 'PRODUCT_NOT_FOUND') {
          setFormError(t('product.gone'));
          return;
        }
        if (submitError.code === 'CATEGORY_NOT_FOUND') {
          setFormError(t('product.categoryGone'));
          return;
        }
      }
      setFormError(describeError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }
  return {t,
          status, loadError, categories, locales, product, form,
  setForm, formError, isSubmitting, saveNotice,
  secondaryDrafts,
  setSecondaryDrafts,
  activeLocale, setActiveLocale, allProducts, modifierGroups, setModifierGroups, previewView, setPreviewView, variants, variantNames, handleVariantNames, sizeDrafts, handleDraftsChange, handleVariantsChange, pendingImageFile, imageUploadBusy, imageError, secondaryLocales,
  translations, addonsPreview, load, pendingImagePreviewUrl, handleSelectImageFile, handleRemoveImage, categoryGroups, sameMenuProducts, backHref, handleSubmit };
}
