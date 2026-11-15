'use client';

import { useCallback, useMemo, useState } from 'react';
import { Alert } from '../../../../components/ui/Alert';

import { Button } from '../../../../components/ui/Button';

import { FormField } from '../../../../components/ui/FormField';
import { Input } from '../../../../components/ui/Input';

import { useStaffI18n } from '../../../../lib/i18n/client';
import {
  localeDirection,
  localeLabel,
} from '../../../../lib/i18n/locale-labels';

import type { RestaurantLocalesResponse } from '../../../settings/types';
import * as menuApi from '../../api';
import { useTranslationsEditor } from '../../hooks/use-translations-editor';
import type { ModifierPresetOption } from '../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../lib/api/user-errors';
import { LanguageTabs, type LanguageTabOption } from '../LanguageTabs';

import { TranslationFields } from '../TranslationFields';

const MONEY_DECIMAL_PATTERN = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;

export function EditPresetOptionForm({
  restaurantId,
  presetId,
  option,
  locales,
  onSaved,
  onCancel,
}: {
  restaurantId: string;
  presetId: string;
  option: ModifierPresetOption;
  locales: RestaurantLocalesResponse | null;
  onSaved: (option: ModifierPresetOption) => void;
  onCancel: () => void;
}) {
  const { t } = useStaffI18n();
  const [name, setName] = useState(option.name);
  const [priceAdjustment, setPriceAdjustment] = useState(
    option.priceAdjustment,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<string>('__default__');

  const defaultLocale = locales?.defaultLocale ?? null;
  const secondaryLocales = useMemo(
    () =>
      locales?.locales
        .filter((row) => !row.isDefault && row.isActive)
        .map((row) => row.locale) ?? [],
    [locales],
  );

  const listOptionTranslations = useCallback(
    async (rid: string, oid: string) => {
      const rows = await menuApi.getModifierPresetOptionTranslations(
        rid,
        presetId,
        oid,
      );
      return rows.map((row) => ({
        locale: row.locale,
        name: row.name,
        description: null,
      }));
    },
    [presetId],
  );
  const putOptionTranslation = useCallback(
    async (
      rid: string,
      oid: string,
      locale: string,
      input: menuApi.TranslationInput,
    ) => {
      const saved = await menuApi.putModifierPresetOptionTranslation(
        rid,
        presetId,
        oid,
        locale,
        {
          name: input.name,
        },
      );
      return { locale: saved.locale, name: saved.name, description: null };
    },
    [presetId],
  );
  const removeOptionTranslation = useCallback(
    (rid: string, oid: string, locale: string) =>
      menuApi.deleteModifierPresetOptionTranslation(rid, presetId, oid, locale),
    [presetId],
  );

  const translations = useTranslationsEditor({
    restaurantId,
    entityId: option.id,
    locales: secondaryLocales,
    list: listOptionTranslations,
    put: putOptionTranslation,
    remove: removeOptionTranslation,
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

  async function handleSave() {
    if (name.trim() === '') {
      setError(t('menu.tr.nameRequired'));
      return;
    }
    if (!MONEY_DECIMAL_PATTERN.test(priceAdjustment)) {
      setError(t('mod.err.priceInvalid'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await menuApi.updateModifierPresetOption(
        restaurantId,
        presetId,
        option.id,
        {
          name: name.trim(),
          priceAdjustment,
        },
      );
      onSaved(updated);
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setError(describeError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md bg-card p-3">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <LanguageTabs
        options={tabOptions}
        activeLocale={activeLocale}
        onSelect={setActiveLocale}
      />
      <div className="grid grid-cols-2 gap-3">
        {isDefaultTab ? (
          <FormField
            label={t('menu.tr.name')}
            htmlFor={`preset-option-name-${option.id}`}
          >
            <Input
              id={`preset-option-name-${option.id}`}
              dir={dir}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
        ) : (
          <TranslationFields
            idPrefix={`preset-option-translation-${option.id}`}
            locale={activeLocale}
            dir={dir}
            draft={translations.drafts[activeLocale]}
            hideSecondField
            onChange={(patch) => translations.updateDraft(activeLocale, patch)}
            onSave={() => void translations.save(activeLocale)}
            onRemove={() => void translations.removeTranslation(activeLocale)}
          />
        )}
        <FormField
          label={t('mod.priceAdjustment')}
          htmlFor={`preset-option-price-${option.id}`}
        >
          <Input
            id={`preset-option-price-${option.id}`}
            inputMode="decimal"
            dir="ltr"
            value={priceAdjustment}
            onChange={(e) => setPriceAdjustment(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleSave()}
        >
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
