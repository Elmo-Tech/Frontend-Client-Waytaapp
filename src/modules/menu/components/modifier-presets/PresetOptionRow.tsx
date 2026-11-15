'use client';

import { useState } from 'react';
import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';

import { useStaffI18n } from '../../../../lib/i18n/client';

import type { RestaurantLocalesResponse } from '../../../settings/types';
import * as menuApi from '../../api';

import type {
  ModifierPresetOption,
  ModifierPresetOptionStatus,
} from '../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../lib/api/user-errors';

import { EditPresetOptionForm } from './EditPresetOptionForm';
export function PresetOptionRow({
  restaurantId,
  presetId,
  option,
  currencyCode,
  canManage,
  locales,
  onChanged,
  onRemoved,
}: {
  restaurantId: string;
  presetId: string;
  option: ModifierPresetOption;
  currencyCode: string;
  canManage: boolean;
  locales: RestaurantLocalesResponse | null;
  onChanged: (option: ModifierPresetOption) => void;
  onRemoved: (optionId: string) => void;
}) {
  const { t } = useStaffI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(t('mod.confirmDelete', { name: option.name }))) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await menuApi.deleteModifierPresetOption(
        restaurantId,
        presetId,
        option.id,
      );
      onRemoved(option.id);
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setError(describeError(err));
      setIsBusy(false);
    }
  }

  async function toggleStatus() {
    setIsBusy(true);
    setError(null);
    try {
      const nextStatus: ModifierPresetOptionStatus =
        option.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await menuApi.updateModifierPresetOption(
        restaurantId,
        presetId,
        option.id,
        {
          status: nextStatus,
        },
      );
      onChanged(updated);
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

  if (isEditing) {
    return (
      <EditPresetOptionForm
        restaurantId={restaurantId}
        presetId={presetId}
        option={option}
        locales={locales}
        onSaved={(updated) => {
          onChanged(updated);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-muted px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <span dir="auto">{option.name}</span>
        <bdi dir="ltr" className="text-muted-foreground">
          {option.priceAdjustment === '0.00'
            ? '+0.00'
            : `+${option.priceAdjustment}`}{' '}
          {currencyCode}
        </bdi>
        {option.status === 'INACTIVE' ? (
          <Badge variant="neutral">{t('common.inactive')}</Badge>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        {error ? <Alert variant="error">{error}</Alert> : null}
        <Button
          type="button"
          variant="secondary"
          disabled={!canManage}
          onClick={() => setIsEditing(true)}
        >
          {t('common.edit')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canManage || isBusy}
          onClick={() => void toggleStatus()}
        >
          {option.status === 'ACTIVE'
            ? t('common.deactivate')
            : t('common.activate')}
        </Button>
        {option.canDelete ? (
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
  );
}
