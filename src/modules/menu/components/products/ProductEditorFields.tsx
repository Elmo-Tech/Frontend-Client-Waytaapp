'use client';

import { useMemo } from 'react';
import { FormField } from '../../../../components/ui/FormField';
import { FormSection } from '../../../../components/ui/FormSection';
import { Input } from '../../../../components/ui/Input';
import { Switch } from '../../../../components/ui/Switch';
import { Textarea } from '../../../../components/ui/Textarea';
import { useStaffI18n } from '../../../../lib/i18n/client';
import { localeDirection, localeLabel } from '../../../../lib/i18n/locale-labels';
import type { RestaurantLocalesResponse } from '../../../settings/types';
import { useTranslationsEditor } from '../../hooks/use-translations-editor';
import type {
  Product
} from '../../types/index';
import { ProductFormState, SecondaryDraft, SecondaryDrafts } from '../../types/product-editor';
import {
  previewDiscount
} from '../../utils/discount';
import { LanguageTabs, type LanguageTabOption } from '../LanguageTabs';
import { TranslationFields } from '../TranslationFields';
/** A labelled on/off row: the switch is the control, the text says what it does. */
export function SwitchRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} label={label} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * Create-mode Languages section (FT-1 correction 2, Section 1/4), mirroring
 * `MenuContextBar.MenuCreateLanguages`/`CategoryNavigation.CategoryCreateLanguages`
 * exactly: shows the same `[ English ] [ العربية ]` tabs as Edit for every
 * ACTIVE Restaurant locale, but keeps secondary-locale content in local
 * `secondaryDrafts` only -- no GET/PUT/DELETE happens until the parent's
 * `handleSubmit` PUTs each non-empty draft after the Product has actually
 * been created.
 */
export function ProductCreateLanguages({
  form,
  setForm,
  isBusy,
  locales,
  secondaryDrafts,
  setSecondaryDrafts,
  activeLocale,
  onActiveLocaleChange,
}: {
  form: ProductFormState;
  setForm: (updater: (prev: ProductFormState) => ProductFormState) => void;
  isBusy: boolean;
  locales: RestaurantLocalesResponse | null;
  secondaryDrafts: SecondaryDrafts;
  setSecondaryDrafts: (updater: (prev: SecondaryDrafts) => SecondaryDrafts) => void;
  activeLocale: string;
  onActiveLocaleChange: (locale: string) => void;
}) {
  const { t } = useStaffI18n();
  const defaultLocale = locales?.defaultLocale ?? null;
  const secondaryLocales = useMemo(
    () =>
      locales?.locales.filter((row) => !row.isDefault && row.isActive).map((row) => row.locale) ?? [],
    [locales],
  );

  const isDefaultTab = activeLocale === '__default__';
  const currentLocale = isDefaultTab ? defaultLocale : activeLocale;
  const dir = currentLocale ? localeDirection(currentLocale) : 'ltr';

  const tabOptions: LanguageTabOption[] = defaultLocale
    ? [
        { locale: '__default__', label: localeLabel(defaultLocale), stateLabel: t('menu.content.default') },
        ...secondaryLocales.map((locale) => ({
          locale,
          label: localeLabel(locale),
          stateLabel: secondaryDrafts[locale]?.name.trim() ? t('menu.content.draftEntered') : t('menu.content.notTranslated'),
        })),
      ]
    : [];

  function updateDraft(locale: string, patch: Partial<SecondaryDraft>) {
    setSecondaryDrafts((prev) => ({
      ...prev,
      [locale]: { ...(prev[locale] ?? { name: '', description: '' }), ...patch },
    }));
  }

  return (
    <FormSection title={t('menu.form.contentLanguages')}>
      <LanguageTabs options={tabOptions} activeLocale={activeLocale} onSelect={onActiveLocaleChange} />

      {isDefaultTab ? (
        <>
          <FormField label={t('menu.tr.name')} htmlFor="product-name">
            <Input
              id="product-name"
              dir={dir}
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={isBusy}
            />
          </FormField>
          <FormField label={t('menu.tr.description')} htmlFor="product-description">
            <Textarea
              id="product-description"
              dir={dir}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              disabled={isBusy}
            />
          </FormField>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t('menu.form.optionalLanguage')}</p>
          <FormField label={t('menu.tr.name')} htmlFor={`product-create-name-${activeLocale}`}>
            <Input
              id={`product-create-name-${activeLocale}`}
              dir={dir}
              value={secondaryDrafts[activeLocale]?.name ?? ''}
              onChange={(event) => updateDraft(activeLocale, { name: event.target.value })}
              disabled={isBusy}
            />
          </FormField>
          <FormField label={t('menu.tr.description')} htmlFor={`product-create-description-${activeLocale}`}>
            <Textarea
              id={`product-create-description-${activeLocale}`}
              dir={dir}
              value={secondaryDrafts[activeLocale]?.description ?? ''}
              onChange={(event) => updateDraft(activeLocale, { description: event.target.value })}
              disabled={isBusy}
            />
          </FormField>
        </>
      )}
    </FormSection>
  );
}

/**
 * Edit-only Languages section (FT-1 correction, Section 3): only ever
 * rendered once the Product exists (`mode === 'edit'`), mirroring
 * `MenuContextBar.MenuTranslationSection`/`CategoryNavigation.CategoryTranslationSection`
 * exactly. Create shows the same tabs via `ProductCreateLanguages` above,
 * backed by local drafts instead of the translation hook.
 */
export function ProductTranslationSection({
  locales,
  form,
  setForm,
  isBusy,
  translations,
  secondaryLocales,
  activeLocale,
  onActiveLocaleChange,
}: {
  locales: RestaurantLocalesResponse | null;
  form: ProductFormState;
  setForm: (updater: (prev: ProductFormState) => ProductFormState) => void;
  isBusy: boolean;
  /** The saved-translations editor state (owned by the Product Editor so the preview can read it). */
  translations: ReturnType<typeof useTranslationsEditor>;
  secondaryLocales: string[];
  activeLocale: string;
  onActiveLocaleChange: (locale: string) => void;
}) {
  const { t } = useStaffI18n();
  const defaultLocale = locales?.defaultLocale ?? null;

  const isDefaultTab = activeLocale === '__default__';
  const currentLocale = isDefaultTab ? defaultLocale : activeLocale;
  const dir = currentLocale ? localeDirection(currentLocale) : 'ltr';

  const tabOptions: LanguageTabOption[] = defaultLocale
    ? [
        { locale: '__default__', label: localeLabel(defaultLocale), stateLabel: t('menu.content.default') },
        ...secondaryLocales.map((locale) => ({
          locale,
          label: localeLabel(locale),
          stateLabel: translations.drafts[locale]?.exists ? t('menu.content.translated') : t('menu.content.notTranslated'),
        })),
      ]
    : [];

  return (
    <FormSection title={t('menu.form.contentLanguages')}>
      <LanguageTabs options={tabOptions} activeLocale={activeLocale} onSelect={onActiveLocaleChange} />

      {isDefaultTab ? (
        <>
          <FormField label={t('menu.tr.name')} htmlFor="product-name">
            <Input
              id="product-name"
              dir={dir}
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={isBusy}
            />
          </FormField>
          <FormField label={t('menu.tr.description')} htmlFor="product-description">
            <Textarea
              id="product-description"
              dir={dir}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              disabled={isBusy}
            />
          </FormField>
        </>
      ) : (
        <TranslationFields
          idPrefix="product-translation"
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

/**
 * The guest price preview inside the Pricing & discount section: the original
 * price crossed out, the discounted price prominently, and -- when this product
 * already has a saved discount -- its current state. Display only; the Backend
 * calculates every real price.
 */
export function DiscountPreview({
  currencyCode,
  basePrice,
  type,
  value,
  savedDiscount,
}: {
  currencyCode: string;
  basePrice: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  savedDiscount: Product['discount'];
}) {
  const { t } = useStaffI18n();
  const preview = previewDiscount(basePrice, type, value);
  const isActiveNow = savedDiscount?.state === 'ACTIVE';

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t('product.discount.previewTitle')}</p>
        {savedDiscount ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isActiveNow ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t(`product.discount.state.${savedDiscount.state}` as const)}
          </span>
        ) : null}
      </div>
      {preview ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="sr-only">{t('product.discount.original')}</span>
            <bdi dir="ltr" className="text-sm text-muted-foreground line-through">
              {basePrice} {currencyCode}
            </bdi>
            <span className="sr-only">{t('product.discount.discounted')}</span>
            <bdi dir="ltr" className="text-xl font-bold text-foreground">
              {preview.discountedPrice} {currencyCode}
            </bdi>
            {preview.percentLabel ? (
              <span className="rounded-md bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                <bdi dir="ltr">-{preview.percentLabel}</bdi>
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('product.discount.saving', { amount: preview.unitDiscount, currency: currencyCode })}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{t('product.discount.error.valueRequired')}</p>
      )}
      {savedDiscount && !isActiveNow ? (
        <p className="text-xs text-muted-foreground">{t('product.discount.previewInactive')}</p>
      ) : null}
      {savedDiscount?.discountedPrice ? (
        <p className="text-xs font-medium text-foreground">
          {t('product.discount.currentPrice', {
            price: savedDiscount.discountedPrice,
            currency: currencyCode,
          })}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{t('product.discount.previewNote')}</p>
    </div>
  );
}
