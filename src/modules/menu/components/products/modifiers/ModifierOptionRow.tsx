'use client';

import { useState } from 'react';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { Button } from '../../../../../components/ui/Button';
import { useStaffI18n } from '../../../../../lib/i18n/client';
import type { RestaurantLocalesResponse } from '../../../../settings/types';
import * as menuApi from '../../../api';
import type {
  ModifierOption,
  ModifierOptionStatus
} from '../../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../../lib/api/user-errors';
import { EditLinkedOptionPriceForm } from './EditLinkedOptionPriceForm';
import { EditModifierOptionForm } from './EditModifierOptionForm';

export function ModifierOptionRow({
  restaurantId,
  productId,
  groupId,
  option,
  currencyCode,
  canManage,
  locales,
  onChanged,
  onRemoved,
}: {
  restaurantId: string;
  productId: string;
  groupId: string;
  option: ModifierOption;
  currencyCode: string;
  canManage: boolean;
  locales: RestaurantLocalesResponse | null;
  onChanged: (option: ModifierOption) => void;
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
      await menuApi.deleteModifierOption(restaurantId, productId, groupId, option.id);
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
      const nextStatus: ModifierOptionStatus = option.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await menuApi.updateModifierOption(
        restaurantId,
        productId,
        groupId,
        option.id,
        { status: nextStatus },
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

  async function resetPrice() {
    setIsBusy(true);
    setError(null);
    try {
      const updated = await menuApi.resetModifierOptionPrice(restaurantId, productId, groupId, option.id);
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
    if (option.sourcePresetOptionId) {
      // Preset-linked: name and translations are owned by the Modifier
      // Library and must not be edited here -- only the Product-specific
      // price override is a legitimate local action for this Option.
      return (
        <EditLinkedOptionPriceForm
          restaurantId={restaurantId}
          productId={productId}
          groupId={groupId}
          option={option}
          onSaved={(updated) => {
            onChanged(updated);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      );
    }
    return (
      <EditModifierOptionForm
        restaurantId={restaurantId}
        productId={productId}
        groupId={groupId}
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
      <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
        <span dir="auto">{option.name}</span>
        <bdi dir="ltr" className="text-muted-foreground">
          {option.priceAdjustment === '0.00' ? '+0.00' : `+${option.priceAdjustment}`} {currencyCode}
        </bdi>
        {option.priceIsOverridden ? (
          <Badge variant="warning">{t('mod.overridden')}</Badge>
        ) : option.sourcePresetOptionId ? (
          <Badge variant="neutral" className="bg-card">{t('menu.content.default')}</Badge>
        ) : null}
        {option.status === 'INACTIVE' ? (
          <Badge variant="neutral" className="bg-card">{t('common.inactive')}</Badge>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {option.priceIsOverridden ? (
          <Button type="button" variant="secondary" disabled={!canManage || isBusy} onClick={() => void resetPrice()}>
            {t('mod.resetToPreset')}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled={!canManage} onClick={() => setIsEditing(true)}>
          {t('common.edit')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canManage || isBusy}
          onClick={() => void toggleStatus()}
        >
          {option.status === 'ACTIVE' ? t('common.deactivate') : t('common.activate')}
        </Button>
        {!option.sourcePresetOptionId && option.canDelete ? (
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
