'use client';
import Link from 'next/link';
import { Alert } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { FormField } from '../../../../components/ui/FormField';
import { FormSection } from '../../../../components/ui/FormSection';
import { Input } from '../../../../components/ui/Input';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { Select } from '../../../../components/ui/Select';
import { resolveAssetUrl } from '../../../../lib/infrastructure/asset-url';
import type {
  PublicMenuVariant,
  PublicProductDiscount,
} from '../../../guest-menu/types';
import { useProductEditor } from '../../hooks/use-product-editor';
import type {
  ProductVariant
} from '../../types/index';
import { MONEY_DECIMAL_PATTERN, nextDisplayOrder, ProductEditorProps, ProductFormState } from '../../types/product-editor';
import {
  previewDiscount
} from '../../utils/discount';
import { ImageField } from '../ImageField';
import { ModifiersSection } from './ModifiersSection';
import { DiscountPreview, ProductCreateLanguages, ProductTranslationSection, SwitchRow } from './ProductEditorFields';
import { ProductPreview } from './ProductPreview';
import { SuggestionsSection } from './SuggestionsSection';
import { DraftSizes, VariantsSection } from './VariantsSection';

/**
 * Dedicated Product Editor (FT-1, Section 9/10) -- replaces the former
 * inline Create/Edit form that used to live beneath the Product list.
 * Sections: Basic information, Pricing, Availability, Menu placement,
 * Customer options, Languages. Deliberately does NOT render Variants,
 * Modifiers, Dietary/Allergens/Nutrition, or any image upload UI (Section
 * 9/11) -- those are out of scope for this batch entirely, not disabled
 * placeholders.
 *
 * `status`/`basePrice`/`displayOrder`/`allowCustomerNotes`/`featured`/
 * `categoryId`/default-locale `name`/`description` all save through the
 * existing generic `createProduct`/`updateProduct` contract, exactly as
 * before. `availability` is the one field with its own dedicated Backend
 * endpoint (Section 13): on Edit, a changed `availability` is saved via
 * `updateProductAvailability` as a second call after the generic Update
 * succeeds, and a failure there is surfaced without pretending the whole
 * Save failed (Section 18/19) -- the generic fields the first call
 * persisted stay persisted and reflected in the form.
 */
export function ProductEditor({
  restaurantId,
  currencyCode,
  canManage,
  mode,
  productId,
}: ProductEditorProps) {
  const { t, status, loadError, locales, product, form, setForm, formError, isSubmitting, saveNotice, secondaryDrafts, setSecondaryDrafts, activeLocale, setActiveLocale, allProducts, setModifierGroups, previewView, setPreviewView, variants, variantNames, handleVariantNames, sizeDrafts, handleDraftsChange, handleVariantsChange, pendingImageFile, imageUploadBusy, imageError, secondaryLocales, translations, addonsPreview, load, pendingImagePreviewUrl, handleSelectImageFile, handleRemoveImage, categoryGroups, sameMenuProducts, backHref, handleSubmit } = useProductEditor({
    restaurantId, currencyCode, canManage,
    mode,
    productId });


  if (status === 'loading') {
    return (
      <Card>
        <LoadingState label={t('product.loading')} />
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="flex flex-col gap-3">
        <Alert variant="error">{loadError}</Alert>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void load()}>
            {t('common.retry')}
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/staff/restaurants/${restaurantId}/menu`}>
              {t('product.backToMenu')}
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const isBusy = isSubmitting || !canManage || imageUploadBusy;
  const displayImageUrl = pendingImagePreviewUrl ?? resolveAssetUrl(product?.primaryImageAssetPath);
  const hasRemovableImage = mode === 'create' ? pendingImageFile !== null : product?.primaryImageAssetPath != null;

  // ---- live preview: the form as guests would see it, in the language being edited ----
  const defaultLocaleCode = locales?.defaultLocale ?? 'en';
  const previewLocale = activeLocale === '__default__' ? defaultLocaleCode : activeLocale;
  const secondaryDraftText =
    activeLocale === '__default__'
      ? null
      : mode === 'create'
        ? (secondaryDrafts[activeLocale] ?? null)
        : (translations.drafts[activeLocale] ?? null);
  const secondaryHasName = secondaryDraftText !== null && secondaryDraftText.name.trim() !== '';
  const previewName = secondaryHasName ? secondaryDraftText.name : form.name;
  const previewDescription = secondaryHasName ? secondaryDraftText.description : form.description;
  const previewDiscountResult =
    form.discountMode !== 'NONE' && form.discountEnabled
      ? previewDiscount(form.basePrice, form.discountMode, form.discountValue)
      : null;
  const discountIsOn = form.discountMode !== 'NONE' && form.discountEnabled;
  // Saved sizes in edit mode; the not-yet-saved drafts in create mode.
  const sizeSource: ProductVariant[] =
    mode === 'create'
      ? sizeDrafts.map((draft, index) => ({
          id: draft.key,
          status: 'ACTIVE' as const,
          name: draft.name,
          price: draft.price,
          displayOrder: index,
          isDefault: index === 0,
          discountApplies: true,
          canDelete: true,
        }))
      : (variants ?? []);
  const hasActiveSizes = sizeSource.some((variant) => variant.status === 'ACTIVE');
  // The sizes as a guest sees them: each size's own price, discounted only where the discount applies.
  const previewVariants: PublicMenuVariant[] = sizeSource
    .filter((variant) => variant.status === 'ACTIVE')
    .map((variant) => {
      const discount =
        discountIsOn && variant.discountApplies && form.discountMode !== 'NONE'
          ? previewDiscount(variant.price, form.discountMode, form.discountValue)
          : null;
      const localized =
        variantNames.locale !== null && variantNames.locale === previewLocale
          ? (variantNames.names[variant.id] ?? '')
          : '';
      return {
        id: variant.id,
        name: localized.trim() !== '' ? localized : variant.name,
        price: variant.price,
        discountedPrice: discount ? discount.discountedPrice : null,
        isDefault: variant.isDefault,
      };
    });
  const previewGuestDiscount: PublicProductDiscount | null = previewDiscountResult
    ? {
        type: form.discountMode === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
        value: form.discountValue.trim(),
        amountOff: previewDiscountResult.unitDiscount,
        discountedPrice: previewDiscountResult.discountedPrice,
        endsOn: form.discountEndsOn === '' ? null : form.discountEndsOn,
      }
    : null;

  const sections: { id: string; label: string }[] = [
    { id: 'product-section-basics', label: t('product.nav.basics') },
    { id: 'product-section-pricing', label: t('product.nav.pricing') },
    { id: 'product-section-sizes', label: t('product.nav.sizes') },
    { id: 'product-section-visibility', label: t('product.nav.visibility') },
    { id: 'product-section-addons', label: t('product.nav.addons') },
    { id: 'product-section-suggestions', label: t('suggestions.product.title') },
  ];
  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function changeCategory(categoryId: string) {
    setForm((prev) => ({
      ...prev,
      categoryId,
      // Moving a product to another Category puts it at the end of that Category.
      displayOrder:
        categoryId === (product?.categoryId ?? '')
          ? String(product?.displayOrder ?? 0)
          : String(nextDisplayOrder(allProducts, categoryId)),
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Always-visible header: where you are, what you can jump to, and Save. */}
      <div className="sticky top-2 z-20 flex flex-col gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={backHref}
              className="group inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
                  strokeLinejoin="round" className="size-4 rtl:rotate-180">
                  <path d="M19 12H5m7 7-7-7 7-7" />
                </svg>
              </span>
              {t('product.backToMenu')}
            </Link>
            <h1 className="mt-0.5 truncate text-lg font-semibold text-foreground">
              {mode === 'create'
                ? t('product.createTitle')
                : t('product.editTitle', {
                    name: `\u2068${product?.translation.name ?? t('product.fallbackName')}\u2069`,
                  })}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {saveNotice ? (
              <span role="status" className="text-sm text-success">
                {saveNotice}
              </span>
            ) : null}
            <Button type="submit" disabled={isBusy}>
              {isSubmitting
                ? t('common.saving')
                : mode === 'create'
                  ? t('product.createContinue')
                  : t('menu.form.saveChanges')}
            </Button>
          </div>
        </div>
        <nav aria-label={t('product.nav.label')} className="flex flex-wrap gap-1.5">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-secondary-foreground outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {!canManage ? (
        <Alert variant="info">{t('guard.noPermission.menuManage')}</Alert>
      ) : null}

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* 1. Basics: image, then the name and description per language. */}
          <Card id="product-section-basics" className="scroll-mt-40 flex flex-col gap-6">
            <FormSection title={t('menu.form.image')}>
              <ImageField
                idPrefix="product"
                imageUrl={displayImageUrl}
                onSelectFile={handleSelectImageFile}
                onRemove={hasRemovableImage ? () => void handleRemoveImage() : undefined}
                isBusy={imageUploadBusy}
                error={imageError}
                selectLabel={displayImageUrl ? t('menu.form.replaceImage') : t('menu.form.chooseImage')}
                helperText={
                  mode === 'create'
                    ? t('product.imageHintCreate')
                    : t('menu.form.imageHint')
                }
              />
            </FormSection>

            {mode === 'create' ? (
              <ProductCreateLanguages
                form={form}
                setForm={setForm}
                isBusy={isBusy}
                locales={locales}
                secondaryDrafts={secondaryDrafts}
                setSecondaryDrafts={setSecondaryDrafts}
                activeLocale={activeLocale}
                onActiveLocaleChange={setActiveLocale}
              />
            ) : (
              <ProductTranslationSection
                locales={locales}
                form={form}
                setForm={setForm}
                isBusy={isBusy}
                translations={translations}
                secondaryLocales={secondaryLocales}
                activeLocale={activeLocale}
                onActiveLocaleChange={setActiveLocale}
              />
            )}
          </Card>

          {/* 2. Pricing and discount. */}
          <Card id="product-section-pricing" className="scroll-mt-40">
            <FormSection title={t('product.section.pricing')}>
              <FormField label={t('product.price', { currency: currencyCode })} htmlFor="product-basePrice">
                <Input
                  id="product-basePrice"
                  inputMode="decimal"
                  dir="ltr"
                  required
                  value={form.basePrice}
                  onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
                  disabled={isBusy || hasActiveSizes}
                />
                {hasActiveSizes ? (
                  <p className="text-xs text-muted-foreground">{t('product.priceFromSizes')}</p>
                ) : null}
              </FormField>

              <div className="mt-1 flex flex-col gap-4 border-t border-border pt-4">
                <FormField label={t('product.discount.type')} htmlFor="product-discount-type">
                  <Select
                    id="product-discount-type"
                    value={form.discountMode}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        discountMode: event.target.value as ProductFormState['discountMode'],
                      }))
                    }
                    disabled={isBusy}
                  >
                    <option value="NONE">{t('product.discount.none')}</option>
                    <option value="PERCENTAGE">{t('product.discount.percentage')}</option>
                    <option value="FIXED_AMOUNT">{t('product.discount.fixed')}</option>
                  </Select>
                </FormField>

                {form.discountMode !== 'NONE' ? (
                  <>
                    <FormField
                      label={
                        form.discountMode === 'PERCENTAGE'
                          ? t('product.discount.valuePercent')
                          : t('product.discount.valueFixed', { currency: currencyCode })
                      }
                      htmlFor="product-discount-value"
                    >
                      <Input
                        id="product-discount-value"
                        inputMode="decimal"
                        dir="ltr"
                        value={form.discountValue}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, discountValue: event.target.value }))
                        }
                        disabled={isBusy}
                      />
                    </FormField>

                    <SwitchRow
                      label={t('product.discount.enabled')}
                      hint={t('product.discount.enabledHint')}
                      checked={form.discountEnabled}
                      disabled={isBusy}
                      onChange={(next) => setForm((prev) => ({ ...prev, discountEnabled: next }))}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField label={t('product.discount.startsOn')} htmlFor="product-discount-starts">
                        <Input
                          id="product-discount-starts"
                          type="date"
                          dir="ltr"
                          value={form.discountStartsOn}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, discountStartsOn: event.target.value }))
                          }
                          disabled={isBusy}
                        />
                      </FormField>
                      <FormField label={t('product.discount.endsOn')} htmlFor="product-discount-ends">
                        <Input
                          id="product-discount-ends"
                          type="date"
                          dir="ltr"
                          value={form.discountEndsOn}
                          onChange={(event) =>
                            setForm((prev) => ({ ...prev, discountEndsOn: event.target.value }))
                          }
                          disabled={isBusy}
                        />
                      </FormField>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('product.discount.datesHint')}</p>

                    <DiscountPreview
                      currencyCode={currencyCode}
                      basePrice={form.basePrice}
                      type={form.discountMode}
                      value={form.discountValue}
                      savedDiscount={product?.discount ?? null}
                    />
                  </>
                ) : null}
              </div>
            </FormSection>
          </Card>

          {/* 3. Sizes: configured on the saved product, in this same page (DEC-041). */}
          <Card id="product-section-sizes" className="scroll-mt-40 flex flex-col gap-6">
            {mode === 'edit' && productId ? (
              <VariantsSection
                restaurantId={restaurantId}
                productId={productId}
                currencyCode={currencyCode}
                canManage={canManage}
                discountConfigured={form.discountMode !== 'NONE'}
                locales={locales}
                contentLocale={activeLocale}
                onVariantsChange={handleVariantsChange}
                onNamesChange={handleVariantNames}
              />
            ) : (
              <DraftSizes
                currencyCode={currencyCode}
                locales={locales}
                contentLocale={activeLocale}
                drafts={sizeDrafts}
                onChange={handleDraftsChange}
              />
            )}
          </Card>

          {/* 4. Where it lives and who sees it: one place, switches for the on/off facts. */}
          <Card id="product-section-visibility" className="scroll-mt-40">
            <FormSection title={t('product.section.visibility')}>
              <FormField label={t('product.category')} htmlFor="product-category">
                <Select
                  id="product-category"
                  required
                  value={form.categoryId}
                  onChange={(event) => changeCategory(event.target.value)}
                  disabled={isBusy}
                >
                  {form.categoryId === '' ? <option value="">{t('product.selectCategory')}</option> : null}
                  {categoryGroups.map((group) => (
                    <optgroup key={group.menu.id} label={group.menu.translation.name}>
                      {group.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.translation.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </FormField>

              <div className="flex flex-col divide-y divide-border rounded-lg border border-border px-4">
                <SwitchRow
                  label={t('product.switch.active')}
                  hint={form.status === 'INACTIVE' ? t('product.inactiveHint') : t('product.switch.activeHint')}
                  checked={form.status === 'ACTIVE'}
                  disabled={isBusy}
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, status: next ? 'ACTIVE' : 'INACTIVE' }))
                  }
                />
                <SwitchRow
                  label={t('product.switch.available')}
                  hint={t('product.switch.availableHint')}
                  checked={form.availability === 'AVAILABLE'}
                  disabled={isBusy}
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, availability: next ? 'AVAILABLE' : 'SOLD_OUT' }))
                  }
                />
                <SwitchRow
                  label={t('menu.badge.featured')}
                  hint={t('product.switch.featuredHint')}
                  checked={form.featured}
                  disabled={isBusy}
                  onChange={(next) => setForm((prev) => ({ ...prev, featured: next }))}
                />
                <SwitchRow
                  label={t('product.allowNotes')}
                  hint={t('product.switch.notesHint')}
                  checked={form.allowCustomerNotes}
                  disabled={isBusy}
                  onChange={(next) => setForm((prev) => ({ ...prev, allowCustomerNotes: next }))}
                />
              </div>
            </FormSection>
          </Card>

          {/* 5. Add-ons: configured on the saved product, in this same page. */}
          <Card id="product-section-addons" className="scroll-mt-40 flex flex-col gap-6">
            {mode === 'edit' && productId ? (
              <ModifiersSection
                restaurantId={restaurantId}
                productId={productId}
                currencyCode={currencyCode}
                locales={locales}
                canManage={canManage}
                onGroupsChange={setModifierGroups}
              />
            ) : (
              <FormSection title={t('mod.title')}>
                <p className="text-sm text-muted-foreground">{t('product.modifiersCreateFirst')}</p>
              </FormSection>
            )}
          </Card>

          {/* 6. Suggestions: which dishes the Guest cart suggests with this product (saved on its own). */}
          <Card id="product-section-suggestions" className="scroll-mt-40 flex flex-col gap-6">
            {mode === 'edit' && productId ? (
              <SuggestionsSection
                restaurantId={restaurantId}
                productId={productId}
                allProducts={sameMenuProducts}
                canManage={canManage}
              />
            ) : (
              <FormSection title={t('suggestions.product.title')}>
                <p className="text-sm text-muted-foreground">{t('suggestions.product.createFirst')}</p>
              </FormSection>
            )}
          </Card>
        </div>

        {/* The preview stays in view while the form scrolls (desktop); below the form on small screens. */}
        <aside className="min-w-0 xl:sticky xl:top-32">
          <ProductPreview
            values={{
              name: previewName,
              description: previewDescription,
              basePrice: MONEY_DECIMAL_PATTERN.test(form.basePrice) ? form.basePrice : '0.00',
              discount: previewGuestDiscount,
              imageUrl: displayImageUrl,
              soldOut: form.availability === 'SOLD_OUT',
              featured: form.featured,
              active: form.status === 'ACTIVE',
            }}
            locale={previewLocale}
            usingFallback={activeLocale !== '__default__' && !secondaryHasName}
            currencyCode={currencyCode}
            modifierGroups={addonsPreview}
            variants={previewVariants}
            addonsAvailable={mode === 'edit'}
            view={previewView}
            onViewChange={setPreviewView}
          />
        </aside>
      </div>
    </form>
  );
}
