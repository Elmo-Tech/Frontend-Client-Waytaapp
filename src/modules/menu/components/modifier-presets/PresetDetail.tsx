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
import type {
  ModifierPreset,
  ModifierPresetOption,
  ModifierPresetStatus,
} from '../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../lib/api/user-errors';
import { LanguageTabs, type LanguageTabOption } from '../LanguageTabs';

import { TranslationFields } from '../TranslationFields';

import { PresetOptionRow } from './PresetOptionRow';
import { NewPresetOptionForm } from './NewPresetOptionForm';
export function PresetDetail({
  restaurantId,
  currencyCode,
  canManage,
  locales,
  preset,
  onPresetChanged,
  onOptionCreated,
  onOptionChanged,
  onPresetRemoved,
  onOptionRemoved,
}: {
  restaurantId: string;
  currencyCode: string;
  canManage: boolean;
  locales: RestaurantLocalesResponse | null;
  preset: ModifierPreset;
  onPresetChanged: (preset: ModifierPreset) => void;
  onOptionCreated: (option: ModifierPresetOption) => void;
  onOptionChanged: (option: ModifierPresetOption) => void;
  onPresetRemoved: (presetId: string) => void;
  onOptionRemoved: (optionId: string) => void;
}) {
  const { t } = useStaffI18n();
  const [name, setName] = useState(preset.name);
  const [helperText, setHelperText] = useState(preset.helperText ?? '');
  const [minimumSelections, setMinimumSelections] = useState(
    String(preset.minimumSelections),
  );
  const [maximumSelections, setMaximumSelections] = useState(
    String(preset.maximumSelections),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [activeLocale, setActiveLocale] = useState<string>('__default__');

  const defaultLocale = locales?.defaultLocale ?? null;
  const secondaryLocales = useMemo(
    () =>
      locales?.locales
        .filter((row) => !row.isDefault && row.isActive)
        .map((row) => row.locale) ?? [],
    [locales],
  );

  const listPresetTranslations = useCallback(
    async (rid: string, pid: string) => {
      const rows = await menuApi.getModifierPresetTranslations(rid, pid);
      return rows.map((row) => ({
        locale: row.locale,
        name: row.name,
        description: row.helperText,
      }));
    },
    [],
  );
  const putPresetTranslation = useCallback(
    async (
      rid: string,
      pid: string,
      locale: string,
      input: menuApi.TranslationInput,
    ) => {
      const saved = await menuApi.putModifierPresetTranslation(
        rid,
        pid,
        locale,
        {
          name: input.name,
          helperText: input.description ?? null,
        },
      );
      return {
        locale: saved.locale,
        name: saved.name,
        description: saved.helperText,
      };
    },
    [],
  );
  const removePresetTranslation = useCallback(
    (rid: string, pid: string, locale: string) =>
      menuApi.deleteModifierPresetTranslation(rid, pid, locale),
    [],
  );

  const translations = useTranslationsEditor({
    restaurantId,
    entityId: preset.id,
    locales: secondaryLocales,
    list: listPresetTranslations,
    put: putPresetTranslation,
    remove: removePresetTranslation,
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
      const updated = await menuApi.updateModifierPreset(
        restaurantId,
        preset.id,
        {
          name: name.trim(),
          helperText: helperText.trim() === '' ? null : helperText.trim(),
          minimumSelections: minimum,
          maximumSelections: maximum,
        },
      );
      onPresetChanged(updated);
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

  async function toggleStatus() {
    setIsBusy(true);
    setError(null);
    try {
      const nextStatus: ModifierPresetStatus =
        preset.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await menuApi.updateModifierPreset(
        restaurantId,
        preset.id,
        { status: nextStatus },
      );
      onPresetChanged(updated);
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setError(describeError(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('presets.confirmDelete', { name: preset.name }))) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await menuApi.deleteModifierPreset(restaurantId, preset.id);
      onPresetRemoved(preset.id);
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setError(describeError(err));
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2
          dir="auto"
          className="text-start text-sm font-semibold text-foreground"
        >
          {preset.name}
        </h2>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!canManage || isBusy}
            onClick={() => void toggleStatus()}
          >
            {preset.status === 'ACTIVE'
              ? t('common.deactivate')
              : t('common.activate')}
          </Button>
          {preset.canDelete ? (
            <Button
              type="button"
              variant="danger"
              disabled={!canManage || isBusy}
              onClick={() => void handleDelete()}
            >
              {t('common.delete')}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <LanguageTabs
        options={tabOptions}
        activeLocale={activeLocale}
        onSelect={setActiveLocale}
      />

      {isDefaultTab ? (
        <>
          <FormField
            label={t('menu.tr.name')}
            htmlFor={`preset-name-${preset.id}`}
          >
            <Input
              id={`preset-name-${preset.id}`}
              dir={dir}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting || !canManage}
            />
          </FormField>
          <FormField
            label={t('mod.helperOptional')}
            htmlFor={`preset-helper-${preset.id}`}
          >
            <Input
              id={`preset-helper-${preset.id}`}
              dir={dir}
              value={helperText}
              onChange={(e) => setHelperText(e.target.value)}
              disabled={isSubmitting || !canManage}
            />
          </FormField>
        </>
      ) : (
        <TranslationFields
          idPrefix={`preset-translation-${preset.id}`}
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
        <FormField
          label={t('mod.minSelections')}
          htmlFor={`preset-min-${preset.id}`}
        >
          <Input
            id={`preset-min-${preset.id}`}
            type="number"
            min={0}
            step={1}
            value={minimumSelections}
            onChange={(e) => setMinimumSelections(e.target.value)}
            disabled={isSubmitting || !canManage}
          />
        </FormField>
        <FormField
          label={t('mod.maxSelections')}
          htmlFor={`preset-max-${preset.id}`}
        >
          <Input
            id={`preset-max-${preset.id}`}
            type="number"
            min={1}
            step={1}
            value={maximumSelections}
            onChange={(e) => setMaximumSelections(e.target.value)}
            disabled={isSubmitting || !canManage}
          />
        </FormField>
      </div>
      <div>
        <Button
          type="button"
          disabled={isSubmitting || !canManage}
          onClick={() => void handleSave()}
        >
          {isSubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          {t('presets.options')}
        </h3>
        <div className="flex flex-col gap-2">
          {preset.options.map((option) => (
            <PresetOptionRow
              key={option.id}
              restaurantId={restaurantId}
              presetId={preset.id}
              option={option}
              currencyCode={currencyCode}
              canManage={canManage}
              locales={locales}
              onChanged={onOptionChanged}
              onRemoved={onOptionRemoved}
            />
          ))}
        </div>

        {isAddingOption ? (
          <div className="mt-3">
            <NewPresetOptionForm
              restaurantId={restaurantId}
              presetId={preset.id}
              nextDisplayOrder={preset.options.length}
              onCancel={() => setIsAddingOption(false)}
              onCreated={(option) => {
                onOptionCreated(option);
                setIsAddingOption(false);
              }}
            />
          </div>
        ) : (
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              disabled={!canManage}
              onClick={() => setIsAddingOption(true)}
            >
              {t('mod.addOption')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
