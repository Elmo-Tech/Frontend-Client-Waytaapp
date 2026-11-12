'use client';

import { useEffect, useState } from 'react';
import { Alert } from '../../../../../components/ui/Alert';
import { Button } from '../../../../../components/ui/Button';
import { FormField } from '../../../../../components/ui/FormField';
import { LoadingState } from '../../../../../components/ui/LoadingState';
import { Select } from '../../../../../components/ui/Select';
import { ApiError } from '../../../../../lib/api/errors';
import { useStaffI18n } from '../../../../../lib/i18n/client';
import * as menuApi from '../../../api';
import type {
  ModifierGroup,
  ModifierPreset
} from '../../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../../lib/api/user-errors';

/**
 * FT-6B, Section 2/4 "Use Preset": lists the Restaurant's own active
 * Presets, letting Staff attach one to this Product. A Preset already
 * attached to this Product is disabled in the list rather than hidden --
 * Staff can see AT A GLANCE which presets are already in use here (Section
 * 4: "Prevent accidentally attaching the same Preset twice").
 */
export function UsePresetPicker({
  restaurantId,
  productId,
  alreadyAppliedPresetIds,
  onCancel,
  onApplied,
}: {
  restaurantId: string;
  productId: string;
  alreadyAppliedPresetIds: Set<string>;
  onCancel: () => void;
  onApplied: (group: ModifierGroup) => void;
}) {
  const { t } = useStaffI18n();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<ModifierPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        setStatus('loading');
        setError(null);
        try {
          const data = await menuApi.listModifierPresets(restaurantId);
          setPresets(data);
          const firstAvailable = data.find((preset) => !alreadyAppliedPresetIds.has(preset.id));
          setSelectedPresetId(firstAvailable?.id ?? '');
          setStatus('loaded');
        } catch (err) {
          if (isUnauthenticatedError(err)) {
            redirectToLogin();
            return;
          }
          setStatus('error');
          setError(describeError(err));
        }
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on mount; alreadyAppliedPresetIds identity changes every parent render.
  }, [restaurantId]);

  async function handleApply() {
    if (selectedPresetId === '') return;
    setIsApplying(true);
    setError(null);
    try {
      const group = await menuApi.applyModifierPreset(restaurantId, productId, selectedPresetId);
      onApplied(group);
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      if (err instanceof ApiError && err.code === 'MODIFIER_PRESET_ALREADY_APPLIED') {
        setError(t('mod.preset.alreadyAttached'));
        return;
      }
      setError(describeError(err));
    } finally {
      setIsApplying(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="rounded-md border border-border p-4">
        <LoadingState label={t('mod.preset.loading')} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-md border border-border p-4">
        <Alert variant="error">{error}</Alert>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.close')}
        </Button>
      </div>
    );
  }

  if (presets.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-border p-4">
        <p className="text-sm text-muted-foreground">{t('mod.preset.none')}</p>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.close')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label={t('mod.preset.label')} htmlFor="use-preset-select">
        <Select
          id="use-preset-select"
          value={selectedPresetId}
          onChange={(e) => setSelectedPresetId(e.target.value)}
          disabled={isApplying}
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id} disabled={alreadyAppliedPresetIds.has(preset.id)}>
              {preset.name}
              {alreadyAppliedPresetIds.has(preset.id) ? t('mod.preset.attachedSuffix') : ''}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={isApplying || selectedPresetId === '' || alreadyAppliedPresetIds.has(selectedPresetId)}
          onClick={() => void handleApply()}
        >
          {isApplying ? t('mod.preset.applying') : t('mod.preset.apply')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isApplying}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
