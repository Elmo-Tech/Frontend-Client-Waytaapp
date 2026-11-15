'use client';

import {
  useMemo,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { Alert } from '../../../components/ui/Alert';

import { FormField } from '../../../components/ui/FormField';
import { FormSection } from '../../../components/ui/FormSection';

import { Input } from '../../../components/ui/Input';

import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';

import { useStaffI18n } from '../../../lib/i18n/client';
import { localeDirection, localeLabel } from '../../../lib/i18n/locale-labels';

import type { RestaurantLocalesResponse } from '../../settings/types';
import * as menuApi from '../api';
import { useTranslationsEditor } from '../hooks/use-translations-editor';
import type { CategoryStatus, Menu } from '../types/index';

import { ImageField } from './ImageField';
import { LanguageTabs, type LanguageTabOption } from './LanguageTabs';

import { TranslationFields } from './TranslationFields';
import {
  KEEP_CURRENT_MENU,
  type CategoryFormState,
  type SecondaryDraft,
  type SecondaryDrafts,
} from './category-form-model';
export function CategoryFormFields({
  mode,
  form,
  setForm,
  formError,
  isSubmitting,
  currentMenuName,
  moveTargets,
  nameRef,
  restaurantId,
  entityId,
  locales,
  secondaryDrafts,
  setSecondaryDrafts,
  imageUrl,
  hasRemovableImage,
  onSelectImageFile,
  onRemoveImage,
  imageBusy,
  imageError,
}: {
  mode: 'create' | 'edit';
  form: CategoryFormState;
  setForm: Dispatch<SetStateAction<CategoryFormState>>;
  formError: string | null;
  isSubmitting: boolean;
  currentMenuName: string;
  moveTargets: Menu[];
  nameRef: RefObject<HTMLInputElement | null>;
  restaurantId: string;
  entityId: string | null;
  locales: RestaurantLocalesResponse | null;
  secondaryDrafts: SecondaryDrafts;
  setSecondaryDrafts: Dispatch<SetStateAction<SecondaryDrafts>>;
  imageUrl: string | null;
  hasRemovableImage: boolean;
  onSelectImageFile: (file: File) => void;
  onRemoveImage: () => void;
  imageBusy: boolean;
  imageError: string | null;
}) {
  const { t } = useStaffI18n();
  return (
    <div className="flex flex-col gap-6">
      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <FormSection title={t('menu.form.image')}>
        <ImageField
          idPrefix="category"
          imageUrl={imageUrl}
          onSelectFile={onSelectImageFile}
          onRemove={hasRemovableImage ? onRemoveImage : undefined}
          isBusy={imageBusy || isSubmitting}
          error={imageError}
          selectLabel={
            imageUrl ? t('menu.form.replaceImage') : t('menu.form.chooseImage')
          }
          helperText={
            mode === 'create'
              ? t('menu.categories.imageHintCreate')
              : t('menu.form.imageHint')
          }
        />
      </FormSection>

      <FormSection title={t('menu.form.general')}>
        <FormField label={t('menu.form.status')} htmlFor="category-status">
          <Select
            id="category-status"
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                status: event.target.value as CategoryStatus,
              }))
            }
            disabled={isSubmitting}
          >
            <option value="ACTIVE">{t('common.active')}</option>
            <option value="INACTIVE">{t('common.inactive')}</option>
          </Select>
          {form.status === 'INACTIVE' ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('menu.form.inactiveHint')}
            </p>
          ) : null}
        </FormField>
      </FormSection>

      {entityId === null ? (
        <CategoryCreateLanguages
          form={form}
          setForm={setForm}
          isSubmitting={isSubmitting}
          locales={locales}
          nameRef={nameRef}
          secondaryDrafts={secondaryDrafts}
          setSecondaryDrafts={setSecondaryDrafts}
        />
      ) : (
        <CategoryTranslationSection
          restaurantId={restaurantId}
          entityId={entityId}
          locales={locales}
          form={form}
          setForm={setForm}
          isSubmitting={isSubmitting}
          nameRef={nameRef}
        />
      )}

      <FormSection title={t('menu.form.organization')}>
        {mode === 'edit' && moveTargets.length > 0 ? (
          <FormField label={t('menu.menus.label')} htmlFor="category-move">
            <Select
              id="category-move"
              value={form.targetMenuId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  targetMenuId: event.target.value,
                }))
              }
              disabled={isSubmitting}
            >
              <option value={KEEP_CURRENT_MENU}>
                {t('menu.categories.currentMenu', { name: currentMenuName })}
              </option>
              {moveTargets.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.translation.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary-foreground">
              {t('menu.menus.label')}
            </span>
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-secondary-foreground">
              {currentMenuName}
            </p>
          </div>
        )}
      </FormSection>

      <FormSection title={t('menu.form.advanced')}>
        <FormField
          label={t('menu.form.displayOrder')}
          htmlFor="category-displayOrder"
        >
          <Input
            id="category-displayOrder"
            type="number"
            min={0}
            step={1}
            required
            value={form.displayOrder}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, displayOrder: event.target.value }))
            }
            disabled={isSubmitting}
          />
        </FormField>
      </FormSection>
    </div>
  );
}

/**
 * Create-mode Languages section (FT-1 correction 2, Section 1/3), mirroring
 * `MenuContextBar.MenuCreateLanguages` exactly: shows the same
 * `[ English ] [ العربية ]` tabs as Edit for every ACTIVE Restaurant
 * locale, but keeps secondary-locale content in local `secondaryDrafts`
 * only -- no GET/PUT/DELETE happens until the parent's `handleSubmit` PUTs
 * each non-empty draft after the Category has actually been created.
 */
function CategoryCreateLanguages({
  form,
  setForm,
  isSubmitting,
  locales,
  nameRef,
  secondaryDrafts,
  setSecondaryDrafts,
}: {
  form: CategoryFormState;
  setForm: Dispatch<SetStateAction<CategoryFormState>>;
  isSubmitting: boolean;
  locales: RestaurantLocalesResponse | null;
  nameRef: RefObject<HTMLInputElement | null>;
  secondaryDrafts: SecondaryDrafts;
  setSecondaryDrafts: Dispatch<SetStateAction<SecondaryDrafts>>;
}) {
  const { t } = useStaffI18n();
  const defaultLocale = locales?.defaultLocale ?? null;
  const secondaryLocales = useMemo(
    () =>
      locales?.locales
        .filter((row) => !row.isDefault && row.isActive)
        .map((row) => row.locale) ?? [],
    [locales],
  );

  const [activeLocale, setActiveLocale] = useState<string>('__default__');
  const isDefaultTab = activeLocale === '__default__';
  const currentLocale = isDefaultTab ? defaultLocale : activeLocale;
  const dir = currentLocale ? localeDirection(currentLocale) : 'ltr';

  const tabOptions: LanguageTabOption[] = defaultLocale
    ? [
        {
          locale: '__default__',
          label: localeLabel(defaultLocale),
          stateLabel: t('menu.content.default'),
        },
        ...secondaryLocales.map((locale) => ({
          locale,
          label: localeLabel(locale),
          stateLabel: secondaryDrafts[locale]?.name.trim()
            ? t('menu.content.draftEntered')
            : t('menu.content.notTranslated'),
        })),
      ]
    : [];

  function updateDraft(locale: string, patch: Partial<SecondaryDraft>) {
    setSecondaryDrafts((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] ?? { name: '', description: '' }),
        ...patch,
      },
    }));
  }

  return (
    <FormSection title={t('menu.form.contentLanguages')}>
      <LanguageTabs
        options={tabOptions}
        activeLocale={activeLocale}
        onSelect={setActiveLocale}
      />

      {isDefaultTab ? (
        <>
          <FormField label={t('menu.tr.name')} htmlFor="category-name">
            <Input
              id="category-name"
              ref={nameRef}
              dir={dir}
              required
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            label={t('menu.tr.description')}
            htmlFor="category-description"
          >
            <Textarea
              id="category-description"
              dir={dir}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              disabled={isSubmitting}
            />
          </FormField>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t('menu.form.optionalLanguage')}
          </p>
          <FormField
            label={t('menu.tr.name')}
            htmlFor={`category-create-name-${activeLocale}`}
          >
            <Input
              id={`category-create-name-${activeLocale}`}
              dir={dir}
              value={secondaryDrafts[activeLocale]?.name ?? ''}
              onChange={(event) =>
                updateDraft(activeLocale, { name: event.target.value })
              }
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            label={t('menu.tr.description')}
            htmlFor={`category-create-description-${activeLocale}`}
          >
            <Textarea
              id={`category-create-description-${activeLocale}`}
              dir={dir}
              value={secondaryDrafts[activeLocale]?.description ?? ''}
              onChange={(event) =>
                updateDraft(activeLocale, { description: event.target.value })
              }
              disabled={isSubmitting}
            />
          </FormField>
        </>
      )}
    </FormSection>
  );
}

/**
 * Edit-only Languages section (FT-1 correction, Section 3): only ever
 * rendered once `entityId` is non-null, mirroring
 * `MenuContextBar.MenuTranslationSection` exactly. Create shows the same
 * tabs via `CategoryCreateLanguages` above, backed by local drafts instead
 * of the translation hook.
 */
function CategoryTranslationSection({
  restaurantId,
  entityId,
  locales,
  form,
  setForm,
  isSubmitting,
  nameRef,
}: {
  restaurantId: string;
  entityId: string;
  locales: RestaurantLocalesResponse | null;
  form: CategoryFormState;
  setForm: Dispatch<SetStateAction<CategoryFormState>>;
  isSubmitting: boolean;
  nameRef: RefObject<HTMLInputElement | null>;
}) {
  const { t } = useStaffI18n();
  const defaultLocale = locales?.defaultLocale ?? null;
  // Memoized: see MenuContextBar's identical note -- an unstable array
  // identity here would make useTranslationsEditor re-fetch (and wipe
  // in-progress edits) on every keystroke in a translation field.
  const secondaryLocales = useMemo(
    () =>
      locales?.locales
        .filter((row) => !row.isDefault && row.isActive)
        .map((row) => row.locale) ?? [],
    [locales],
  );

  const [activeLocale, setActiveLocale] = useState<string>('__default__');

  const translations = useTranslationsEditor({
    restaurantId,
    entityId,
    locales: secondaryLocales,
    list: menuApi.getCategoryTranslations,
    put: menuApi.putCategoryTranslation,
    remove: menuApi.deleteCategoryTranslation,
  });

  const isDefaultTab = activeLocale === '__default__';
  const currentLocale = isDefaultTab ? defaultLocale : activeLocale;
  const dir = currentLocale ? localeDirection(currentLocale) : 'ltr';

  const tabOptions: LanguageTabOption[] = defaultLocale
    ? [
        {
          locale: '__default__',
          label: localeLabel(defaultLocale),
          stateLabel: t('menu.content.default'),
        },
        ...secondaryLocales.map((locale) => ({
          locale,
          label: localeLabel(locale),
          stateLabel: translations.drafts[locale]?.exists
            ? t('menu.content.translated')
            : t('menu.content.notTranslated'),
        })),
      ]
    : [];

  return (
    <FormSection title={t('menu.form.contentLanguages')}>
      <LanguageTabs
        options={tabOptions}
        activeLocale={activeLocale}
        onSelect={setActiveLocale}
      />

      {isDefaultTab ? (
        <>
          <FormField label={t('menu.tr.name')} htmlFor="category-name">
            <Input
              id="category-name"
              ref={nameRef}
              dir={dir}
              required
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              disabled={isSubmitting}
            />
          </FormField>
          <FormField
            label={t('menu.tr.description')}
            htmlFor="category-description"
          >
            <Textarea
              id="category-description"
              dir={dir}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              disabled={isSubmitting}
            />
          </FormField>
        </>
      ) : (
        <TranslationFields
          idPrefix="category-translation"
          locale={activeLocale}
          dir={dir}
          draft={translations.drafts[activeLocale]}
          onChange={(patch) => translations.updateDraft(activeLocale, patch)}
          onSave={() => void translations.save(activeLocale)}
          onRemove={() => void translations.removeTranslation(activeLocale)}
        />
      )}
    </FormSection>
  );
}
