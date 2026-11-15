'use client';
import { CategoryFormFields } from './CategoryFormFields';
import {
  KEEP_CURRENT_MENU,
  type CategoryFormState,
  type SecondaryDrafts,
} from './category-form-model';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { EmptyState } from '../../../components/ui/EmptyState';

import { IconImage, IconPencil, IconPlus } from '../../../components/ui/icons';

import { LoadingState } from '../../../components/ui/LoadingState';
import { SectionCard } from '../../../components/ui/SectionCard';

import { ApiError } from '../../../lib/api/errors';
import { useStaffI18n } from '../../../lib/i18n/client';
import { localeLabel } from '../../../lib/i18n/locale-labels';
import { resolveAssetUrl } from '../../../lib/infrastructure/asset-url';
import type { RestaurantLocalesResponse } from '../../settings/types';
import * as menuApi from '../api';

import type { Category, Menu } from '../types/index';
import { ALL_PRODUCTS } from '../utils/all-products';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../lib/api/user-errors';
import { validateImageFile } from '../utils/image-validation';

import { DragGrip, MoveArrows, useDragReorder } from './reorder';

interface CategoryNavigationProps {
  restaurantId: string;
  menuId: string | null;
  menus: Menu[];
  categories: Category[] | null;
  error: string | null;
  /** Restaurant Languages (FT-1, Section 4) -- sole authority for which secondary-locale tabs render. */
  locales: RestaurantLocalesResponse | null;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onRetry: () => void;
  canManage: boolean;
  onCreated: (category: Category) => void;
  onUpdated: (category: Category) => void;
  onMoved: (category: Category) => void;
  onCategoryNotFound: () => void;
  onMenuNotFound: () => void;
  /** Product count per Category id; `null` until loaded (counts are then simply not shown). */
  productCounts: Record<string, number> | null;
  /** Drag-and-drop / arrow ordering: gets the full new order of this Menu's Categories. */
  onReorder: (categoryIds: string[]) => void;
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  description: '',
  status: 'ACTIVE',
  displayOrder: '0',
  targetMenuId: KEEP_CURRENT_MENU,
};

function toFormState(category: Category): CategoryFormState {
  return {
    name: category.translation.name,
    description: category.translation.description ?? '',
    status: category.status,
    displayOrder: String(category.displayOrder),
    targetMenuId: KEEP_CURRENT_MENU,
  };
}

/** FT-2 correction, Section 2: a compact ~36px thumbnail in the Category nav itself -- reuses the existing `resolveAssetUrl` helper and the same clean placeholder icon as `ProductList`'s thumbnail, no larger redesign. */
function CategoryThumbnail({
  imageAssetPath,
}: {
  imageAssetPath: string | null;
}) {
  const imageUrl = resolveAssetUrl(imageAssetPath);
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a Staff-uploaded asset from a runtime-configured API origin, not a Next.js-optimizable static/local image.
      <img
        src={imageUrl}
        alt=""
        className="h-9 w-9 flex-shrink-0 rounded-md border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <IconImage className="h-4 w-4" />
    </span>
  );
}

/** One in-progress, not-yet-saved secondary-locale translation typed while creating (FT-1 correction 2, Section 3). */

/**
 * UX-3, Section 7: Categories become the navigation rail for the selected
 * Menu -- a vertical list on desktop, a horizontally scrollable row of
 * chips on mobile, using the same underlying markup with responsive flex
 * classes. Category selection still goes exclusively through the
 * caller-supplied `onSelectCategory` (`MenuWorkspace`'s race-safe
 * `selectCategory`).
 *
 * UX-4: Create/Edit Category moved from an inline form beneath the rail
 * into the shared `Dialog` (originally a right-side Drawer; replaced with
 * a centered Dialog per the Product Owner's presentation correction --
 * Section 2/9/10). All mutation logic (Create/Edit submit, including
 * Move-to-Menu) is unchanged from UX-3 -- only the surrounding
 * presentation and identity-safety around the editor changed. This
 * component is remounted whenever the selected Menu changes
 * (`MenuWorkspace`'s `key={"menu-"+selectedMenuId}`), which already resets
 * any open Dialog -- an Edit/Create form left open under the previous Menu
 * cannot survive underneath the new one.
 */
export function CategoryNavigation({
  restaurantId,
  menuId,
  menus,
  categories,
  error,
  locales,
  selectedCategoryId,
  onSelectCategory,
  onRetry,
  canManage,
  onCreated,
  onUpdated,
  onMoved,
  onCategoryNotFound,
  onMenuNotFound,
  productCounts,
  onReorder,
}: CategoryNavigationProps) {
  const { t } = useStaffI18n();
  // Touch / small screens: ordering is an explicit mode (arrows), because a row of
  // chips has no room for per-item controls. Desktop uses the drag grip directly.
  const [reorderMode, setReorderMode] = useState(false);
  const categoryIds = useMemo(
    () => (categories ?? []).map((category) => category.id),
    [categories],
  );
  const canReorder = canManage && categoryIds.length > 1;
  const reorder = useDragReorder({
    ids: categoryIds,
    enabled: canReorder,
    onReorder,
  });
  const [mode, setMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondaryDrafts, setSecondaryDrafts] = useState<SecondaryDrafts>({});
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [editingImageAssetPath, setEditingImageAssetPath] = useState<
    string | null
  >(null);
  const [imageUploadBusy, setImageUploadBusy] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function startCreate() {
    setMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setSecondaryDrafts({});
    setPendingImageFile(null);
    setEditingImageAssetPath(null);
    setImageError(null);
  }

  function startEdit(category: Category) {
    setMode('edit');
    setEditingId(category.id);
    setForm(toFormState(category));
    setFormError(null);
    setPendingImageFile(null);
    setEditingImageAssetPath(category.imageAssetPath);
    setImageError(null);
  }

  function cancelForm() {
    setMode('idle');
    setEditingId(null);
    setFormError(null);
    setImageError(null);
  }

  // FT-2, Section 16: a local object-URL preview only ever exists for a
  // `pendingImageFile` (Create mode, before the Category exists). Computed
  // with `useMemo` rather than effect+state (same reasoning as
  // `ProductEditor`'s identical pattern) -- the effect below only revokes,
  // never calls setState.
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
      // No Category exists yet -- keep the file locally; `handleSubmit`
      // uploads it right after Create succeeds (Section 15).
      setPendingImageFile(file);
      return;
    }
    if (editingId) {
      void uploadImageNow(editingId, file);
    }
  }

  async function uploadImageNow(categoryId: string, file: File) {
    setImageUploadBusy(true);
    setImageError(null);
    try {
      const result = await menuApi.uploadCategoryImage(
        restaurantId,
        categoryId,
        file,
      );
      setEditingImageAssetPath(result.imageAssetPath);
      // FT-2 code review blocker: the Dialog's own `editingImageAssetPath`
      // is only local preview state -- the Menu Management nav renders
      // `category.imageAssetPath` straight from the parent's `categories`
      // list, which never otherwise learns about a replace-image done
      // entirely inside this Dialog. Reuse the existing `onUpdated` callback
      // (already wired to `MenuWorkspace`'s narrow `loadCategories` refetch)
      // so the thumbnail updates immediately, with no page refresh.
      const original = categories?.find(
        (category) => category.id === categoryId,
      );
      if (original) {
        onUpdated({ ...original, imageAssetPath: result.imageAssetPath });
      }
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
      setPendingImageFile(null);
      return;
    }
    if (!editingId) return;
    setImageUploadBusy(true);
    setImageError(null);
    try {
      await menuApi.removeCategoryImage(restaurantId, editingId);
      setEditingImageAssetPath(null);
      // Same reasoning as `uploadImageNow` above -- the nav thumbnail must
      // fall back to the placeholder immediately, not only after some
      // unrelated later refetch.
      const original = categories?.find(
        (category) => category.id === editingId,
      );
      if (original) {
        onUpdated({ ...original, imageAssetPath: null });
      }
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

  /**
   * UX-4, Section 12/22: the Category being edited is pinned to
   * `editingId` when the Dialog opens and never re-derived from
   * `selectedCategoryId`. The backdrop already blocks the User from
   * switching Category (or Menu, which would remount this whole
   * component) while the Dialog is open; this effect only guards the
   * remaining edge case where the edited Category disappears from a
   * refreshed `categories` list out from under an open Dialog, closing
   * it safely rather than risking a submit against a stale target. This
   * never changes `selectCategory` or any request-generation guard in
   * `MenuWorkspace`.
   */
  useEffect(() => {
    // `queueMicrotask` here is purely to satisfy eslint-plugin-react-hooks'
    // `set-state-in-effect` rule (same established pattern as
    // MenuWorkspace's own mount effect) -- it has nothing to do with the
    // safety guarantee itself, which is simply "close the Dialog once the
    // Category it is editing is no longer in the loaded list."
    if (
      mode === 'edit' &&
      editingId &&
      categories &&
      !categories.some((category) => category.id === editingId)
    ) {
      queueMicrotask(() => {
        cancelForm();
      });
    }
  }, [categories, mode, editingId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !menuId) return;

    const displayOrder = Number(form.displayOrder);
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setFormError(t('menu.form.displayOrderInvalid'));
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (mode === 'create') {
        const created = await menuApi.createCategory(restaurantId, {
          menuId,
          name: form.name,
          description: form.description.trim() === '' ? null : form.description,
          status: form.status,
          displayOrder,
        });

        // Secondary-locale translations are only created once the Category
        // itself exists (FT-1 correction 2, Section 3): PUT each entered
        // draft now, using the Category id the create call just returned.
        // A blank draft is skipped entirely -- never PUT an empty
        // translation (Section 5).
        const translationFailures: string[] = [];
        for (const [locale, draft] of Object.entries(secondaryDrafts)) {
          if (draft.name.trim() === '') continue;
          try {
            await menuApi.putCategoryTranslation(
              restaurantId,
              created.id,
              locale,
              {
                name: draft.name.trim(),
                description:
                  draft.description.trim() === ''
                    ? null
                    : draft.description.trim(),
              },
            );
          } catch (translationError) {
            if (isUnauthenticatedError(translationError)) {
              redirectToLogin();
              return;
            }
            translationFailures.push(localeLabel(locale));
          }
        }

        // The selected image (if any) is only uploaded once the Category
        // exists, exactly like a secondary translation (FT-2, Section 15).
        let uploadedImageAssetPath: string | null = null;
        let imageUploadFailed = false;
        if (pendingImageFile) {
          try {
            const imageResult = await menuApi.uploadCategoryImage(
              restaurantId,
              created.id,
              pendingImageFile,
            );
            uploadedImageAssetPath = imageResult.imageAssetPath;
          } catch (imageUploadError) {
            if (isUnauthenticatedError(imageUploadError)) {
              redirectToLogin();
              return;
            }
            imageUploadFailed = true;
          }
        }

        onCreated(created);

        if (translationFailures.length > 0 || imageUploadFailed) {
          // The Category itself was created successfully -- never
          // duplicate-create it on retry (Section 5). Drop into Edit mode
          // for the Category that now exists so the User can retry the
          // failed translation(s)/image through their normal independent
          // Save/Upload flows.
          const failures: string[] = [];
          if (translationFailures.length > 0) {
            failures.push(
              t('menu.categories.failTranslation', {
                languages: translationFailures.join(', '),
              }),
            );
          }
          if (imageUploadFailed) {
            failures.push(t('menu.categories.failImage'));
          }
          setMode('edit');
          setEditingId(created.id);
          setForm(toFormState(created));
          setEditingImageAssetPath(uploadedImageAssetPath);
          setPendingImageFile(null);
          setFormError(
            t('menu.categories.createdPartial', {
              problems: failures.join(t('menu.form.and')),
            }),
          );
          return;
        }

        setMode('idle');
        setEditingId(null);
      } else if (mode === 'edit' && editingId) {
        const isMoving = form.targetMenuId !== KEEP_CURRENT_MENU;
        const updated = await menuApi.updateCategory(restaurantId, editingId, {
          ...(isMoving ? { menuId: form.targetMenuId } : {}),
          name: form.name,
          description: form.description.trim() === '' ? null : form.description,
          status: form.status,
          displayOrder,
        });
        setMode('idle');
        setEditingId(null);
        if (isMoving) {
          onMoved(updated);
        } else {
          onUpdated(updated);
        }
      }
    } catch (submitError) {
      if (isUnauthenticatedError(submitError)) {
        redirectToLogin();
        return;
      }
      if (submitError instanceof ApiError) {
        if (submitError.code === 'CATEGORY_NOT_FOUND') {
          onCategoryNotFound();
          setMode('idle');
          setEditingId(null);
          return;
        }
        if (submitError.code === 'MENU_NOT_FOUND') {
          onMenuNotFound();
          setMode('idle');
          setEditingId(null);
          return;
        }
      }
      setFormError(describeError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const moveTargets = menus.filter((menu) => menu.id !== menuId);
  const currentMenuName =
    menus.find((menu) => menu.id === menuId)?.translation.name ?? '';

  const dialog = (
    <Dialog
      open={mode !== 'idle'}
      title={
        mode === 'create'
          ? t('menu.categories.create')
          : t('menu.categories.edit')
      }
      subtitle={currentMenuName || undefined}
      isSubmitting={isSubmitting || imageUploadBusy}
      submitLabel={
        isSubmitting
          ? t('common.saving')
          : mode === 'create'
            ? t('menu.categories.create')
            : t('menu.form.saveChanges')
      }
      onSubmit={handleSubmit}
      onClose={cancelForm}
      initialFocusRef={nameRef}
    >
      <CategoryFormFields
        mode={mode === 'idle' ? 'create' : mode}
        form={form}
        setForm={setForm}
        formError={formError}
        isSubmitting={isSubmitting}
        currentMenuName={currentMenuName}
        moveTargets={moveTargets}
        nameRef={nameRef}
        restaurantId={restaurantId}
        entityId={mode === 'edit' ? editingId : null}
        locales={locales}
        secondaryDrafts={secondaryDrafts}
        setSecondaryDrafts={setSecondaryDrafts}
        imageUrl={
          mode === 'create'
            ? pendingImagePreviewUrl
            : resolveAssetUrl(editingImageAssetPath)
        }
        hasRemovableImage={
          mode === 'create'
            ? pendingImageFile !== null
            : editingImageAssetPath !== null
        }
        onSelectImageFile={handleSelectImageFile}
        onRemoveImage={() => void handleRemoveImage()}
        imageBusy={imageUploadBusy}
        imageError={imageError}
      />
    </Dialog>
  );

  return (
    <SectionCard
      className="min-w-0 xl:h-fit"
      bodyClassName="flex flex-col gap-3"
      title={t('menu.categories.title')}
      actions={
        canManage && menuId ? (
          <>
            {canReorder ? (
              <Button
                type="button"
                variant={reorderMode ? 'primary' : 'secondary'}
                size="sm"
                className="xl:hidden"
                onClick={() => setReorderMode((value) => !value)}
              >
                {reorderMode ? t('menu.reorder.done') : t('menu.reorder.start')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={startCreate}
              aria-label={t('menu.categories.add')}
            >
              <IconPlus className="h-4 w-4" />
            </Button>
          </>
        ) : undefined
      }
    >
      {!menuId ? (
        <EmptyState compact title={t('menu.categories.selectMenu')} />
      ) : (
        <>
          {error ? (
            <Alert variant="error">
              <div className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  {t('common.retry')}
                </Button>
              </div>
            </Alert>
          ) : null}

          {categories === null && !error ? (
            <LoadingState label={t('menu.categories.loading')} />
          ) : null}

          {categories !== null && categories.length === 0 ? (
            <EmptyState
              compact
              icon={<IconImage />}
              title={t('menu.categories.emptyTitle')}
              description={t('menu.categories.emptyHint')}
              action={
                canManage ? (
                  <Button variant="secondary" size="sm" onClick={startCreate}>
                    <IconPlus className="h-3.5 w-3.5" />{' '}
                    {t('menu.categories.add')}
                  </Button>
                ) : undefined
              }
            />
          ) : null}

          {categories !== null && categories.length > 0 ? (
            <ul
              className={`flex gap-2 pb-1 xl:flex-col xl:gap-1 xl:overflow-visible xl:pb-0 ${
                reorderMode ? 'flex-col' : 'overflow-x-auto'
              }`}
            >
              <li className="shrink-0 xl:shrink">
                <div
                  className={`relative flex items-center gap-1 rounded-md border px-1 transition-colors xl:px-1.5 ${
                    selectedCategoryId === ALL_PRODUCTS
                      ? 'border-primary/30 bg-accent'
                      : 'border-border bg-card hover:bg-muted xl:border-transparent'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCategory(ALL_PRODUCTS)}
                    aria-current={
                      selectedCategoryId === ALL_PRODUCTS ? 'true' : undefined
                    }
                    className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-md py-2 ps-2 pe-1 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring xl:w-full ${
                      selectedCategoryId === ALL_PRODUCTS
                        ? 'font-semibold text-primary'
                        : 'text-secondary-foreground'
                    }`}
                  >
                    <span dir="auto" className="truncate">
                      {t('menu.products.all')}
                    </span>
                    {productCounts ? (
                      <span
                        className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                          selectedCategoryId === ALL_PRODUCTS
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {categories.reduce(
                          (sum, category) =>
                            sum + (productCounts[category.id] ?? 0),
                          0,
                        )}
                      </span>
                    ) : null}
                  </button>
                </div>
              </li>
              {categories.map((category, index) => {
                const isSelected = category.id === selectedCategoryId;
                const count = productCounts
                  ? (productCounts[category.id] ?? 0)
                  : null;
                const isDragging = reorder.draggingId === category.id;
                const isOver = reorder.overId === category.id;
                return (
                  <li
                    key={category.id}
                    data-reorder-row
                    {...reorder.rowProps(category.id)}
                    className={`shrink-0 xl:shrink ${isDragging ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`group relative flex items-center gap-1 rounded-md border px-1 transition-colors xl:px-1.5 ${
                        isSelected
                          ? 'border-primary/30 bg-accent'
                          : 'border-border bg-card hover:bg-muted xl:border-transparent'
                      } ${isOver ? 'outline outline-2 -outline-offset-2 outline-primary' : ''}`}
                    >
                      {canReorder ? (
                        <DragGrip
                          name={category.translation.name}
                          handleProps={reorder.handleProps(category.id)}
                          className="hidden xl:inline-flex"
                        />
                      ) : null}
                      {isSelected ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 start-0 hidden w-[3px] rounded-full bg-primary xl:block"
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onSelectCategory(category.id)}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-md py-1.5 ps-1.5 pe-1 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring xl:w-full xl:whitespace-normal ${
                          isSelected
                            ? 'font-semibold text-primary'
                            : 'text-secondary-foreground'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <CategoryThumbnail
                            imageAssetPath={category.imageAssetPath}
                          />
                          <span dir="auto" className="truncate">
                            {category.translation.name}
                          </span>
                        </span>
                        <span className="flex flex-shrink-0 items-center gap-1.5">
                          {category.status === 'INACTIVE' ? (
                            <span className="text-xs text-muted-foreground">
                              {t('common.inactive')}
                            </span>
                          ) : null}
                          {count !== null ? (
                            <span
                              title={t('menu.categories.productCount', {
                                count,
                              })}
                              className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {count}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      {reorderMode && canReorder ? (
                        <MoveArrows
                          name={category.translation.name}
                          index={index}
                          count={categoryIds.length}
                          onMove={(delta) => reorder.moveBy(category.id, delta)}
                          className="xl:hidden"
                        />
                      ) : null}
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          aria-label={t('menu.products.editAria', {
                            name: category.translation.name,
                          })}
                          className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground outline-none transition-colors hover:bg-card hover:text-primary focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring xl:opacity-0 xl:group-hover:opacity-100"
                        >
                          <IconPencil className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </>
      )}

      {dialog}
    </SectionCard>
  );
}

/**
 * Category Dialog form fields (UX-4, Section 9/10/14/15/16/17): the exact
 * same Backend contract as before (`name`, `description`, `status`,
 * `displayOrder`, and on Edit `menuId` for the existing Move feature).
 * On Create, Menu is shown as read-only context (Section 9 -- "Do not
 * provide a raw UUID field"); on Edit, it is a real Select built only from
 * the Restaurant's already-loaded Menu list (Section 10/11), identical to
 * the previous inline form's Move-to-Menu control.
 */
