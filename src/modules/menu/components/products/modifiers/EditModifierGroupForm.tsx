'use client';

import { useCallback, useMemo, useState } from 'react';
import { Alert } from '../../../../../components/ui/Alert';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { Input } from '../../../../../components/ui/Input';
import { useStaffI18n } from '../../../../../lib/i18n/client';
import { localeDirection, localeLabel } from '../../../../../lib/i18n/locale-labels';
import type { RestaurantLocalesResponse } from '../../../../settings/types';
import * as menuApi from '../../../api';
import { useTranslationsEditor } from '../../../hooks/use-translations-editor';
import type {
  ModifierGroup
} from '../../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../../lib/api/user-errors';
import { LanguageTabs, type LanguageTabOption } from '../../LanguageTabs';
import { TranslationFields } from '../../TranslationFields';

export function EditModifierGroupForm({
  restaurantId,
  productId,
  group,
  locales,
  onSaved,
  onCancel,
}: {
  restaurantId: string;
  productId: string;
  group: ModifierGroup;
  locales: RestaurantLocalesResponse | null;
  onSaved: (group: ModifierGroup) => void;
  onCancel: () => void;
}) {
  const { t } = useStaffI18n();
  const [name, setName] = useState(group.name);
  const [helperText, setHelperText] = useState(group.helperText ?? '');
  const [minimumSelections, setMinimumSelections] = useState(String(group.minimumSelections));
  const [maximumSelections, setMaximumSelections] = useState(String(group.maximumSelections));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLocale, setActiveLocale] = useState<string>('__default__');

  const defaultLocale = locales?.defaultLocale ?? null;
  // Memoized: an unstable array identity here would make useTranslationsEditor
  // re-fetch (and wipe in-progress edits) on every keystroke, mirroring
  // `ProductTranslationSection`'s identical note.
  const secondaryLocales = useMemo(
    () => locales?.locales.filter((row) => !row.isDefault && row.isActive).map((row) => row.locale) ?? [],
    [locales],
  );

  const listGroupTranslations = useCallback(
    async (rid: string, gid: string) => {
      const rows = await menuApi.getModifierGroupTranslations(rid, productId, gid);
      return rows.map((row) => ({ locale: row.locale, name: row.name, description: row.helperText }));
    },
    [productId],
  );
  const putGroupTranslation = useCallback(
    async (rid: string, gid: string, locale: string, input: menuApi.TranslationInput) => {
      const saved = await menuApi.putModifierGroupTranslation(rid, productId, gid, locale, {
        name: input.name,
        helperText: input.description ?? null,
      });
      return { locale: saved.locale, name: saved.name, description: saved.helperText };
    },
    [productId],
  );
  const removeGroupTranslation = useCallback(
    (rid: string, gid: string, locale: string) =>
      menuApi.deleteModifierGroupTranslation(rid, productId, gid, locale),
    [productId],
  );

  const translations = useTranslationsEditor({
    restaurantId,
    entityId: group.id,
    locales: secondaryLocales,
    list: listGroupTranslations,
    put: putGroupTranslation,
    remove: removeGroupTranslation,
  });

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

  async function handleSave() {
    if (name.trim() === '') {
      setError(t('menu.tr.nameRequired'));
      return;
    }
    const minimum = Number(minimumSelections);
    const maximum = Number(maximumSelections);
    if (!Number.isInteger(minimum) || minimum < 0) {
      setError(t('mod.err.minInvalid'));
      return;
    }
    if (!Number.isInteger(maximum) || maximum < 1) {
      setError(t('mod.err.maxInvalid'));
      return;
    }
    if (maximum < minimum) {
      setError(t('mod.err.maxLessThanMin'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await menuApi.updateModifierGroup(restaurantId, productId, group.id, {
        name: name.trim(),
        helperText: helperText.trim() === '' ? null : helperText.trim(),
        minimumSelections: minimum,
        maximumSelections: maximum,
      });
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
    <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
      {error ? <Alert variant="error">{error}</Alert> : null}

      <LanguageTabs options={tabOptions} activeLocale={activeLocale} onSelect={setActiveLocale} />

      {isDefaultTab ? (
        <>
          <FormField label={t('menu.tr.name')} htmlFor={`edit-group-name-${group.id}`}>
            <Input
              id={`edit-group-name-${group.id}`}
              dir={dir}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
          <FormField label={t('mod.helperOptional')} htmlFor={`edit-group-helper-${group.id}`}>
            <Input
              id={`edit-group-helper-${group.id}`}
              dir={dir}
              value={helperText}
              onChange={(e) => setHelperText(e.target.value)}
              disabled={isSubmitting}
            />
          </FormField>
        </>
      ) : (
        <TranslationFields
          idPrefix={`modifier-group-translation-${group.id}`}
          locale={activeLocale}
          dir={dir}
          draft={translations.drafts[activeLocale]}
          secondFieldLabel={t('mod.helperText')}
          onChange={(patch) => translations.updateDraft(activeLocale, patch)}
          onSave={() => void translations.save(activeLocale)}
          onRemove={() => void translations.removeTranslation(activeLocale)}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('mod.minSelections')} htmlFor={`edit-group-min-${group.id}`}>
          <Input
            id={`edit-group-min-${group.id}`}
            type="number"
            min={0}
            step={1}
            value={minimumSelections}
            onChange={(e) => setMinimumSelections(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label={t('mod.maxSelections')} htmlFor={`edit-group-max-${group.id}`}>
          <Input
            id={`edit-group-max-${group.id}`}
            type="number"
            min={1}
            step={1}
            value={maximumSelections}
            onChange={(e) => setMaximumSelections(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
      </div>
      <div className="flex gap-2">
        <Button type="button" disabled={isSubmitting} onClick={() => void handleSave()}>
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
