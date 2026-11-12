'use client';

import { useState } from 'react';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { Button } from '../../../../../components/ui/Button';
import { useStaffI18n } from '../../../../../lib/i18n/client';
import type { RestaurantLocalesResponse } from '../../../../settings/types';
import * as menuApi from '../../../api';
import type {
  ModifierGroup,
  ModifierGroupStatus,
  ModifierOption
} from '../../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../../lib/api/user-errors';
import { EditModifierGroupForm } from './EditModifierGroupForm';
import { ModifierOptionRow } from './ModifierOptionRow';
import { NewModifierOptionForm } from './NewModifierOptionForm';

export function ModifierGroupCard({
  restaurantId,
  productId,
  currencyCode,
  group,
  canManage,
  locales,
  onGroupChanged,
  onOptionCreated,
  onOptionChanged,
  onGroupRemoved,
  onOptionRemoved,
}: {
  restaurantId: string;
  productId: string;
  currencyCode: string;
  group: ModifierGroup;
  canManage: boolean;
  locales: RestaurantLocalesResponse | null;
  onGroupChanged: (group: ModifierGroup) => void;
  onOptionCreated: (groupId: string, option: ModifierOption) => void;
  onOptionChanged: (groupId: string, option: ModifierOption) => void;
  onGroupRemoved: (groupId: string) => void;
  onOptionRemoved: (groupId: string, optionId: string) => void;
}) {
  const { t } = useStaffI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    setIsBusy(true);
    setError(null);
    try {
      const nextStatus: ModifierGroupStatus = group.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const updated = await menuApi.updateModifierGroup(restaurantId, productId, group.id, {
        status: nextStatus,
      });
      onGroupChanged(updated);
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
    if (!window.confirm(t('mod.confirmDelete', { name: group.name }))) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await menuApi.deleteModifierGroup(restaurantId, productId, group.id);
      onGroupRemoved(group.id);
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setError(describeError(err));
      setIsBusy(false);
    }
  }

  async function handleRemoveFromProduct() {
    if (!window.confirm(t('mod.confirmRemove', { name: group.name }))) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const result = await menuApi.removeModifierGroupFromProduct(restaurantId, productId, group.id);
      if (result === null) {
        onGroupRemoved(group.id);
      } else {
        onGroupChanged(result);
        setIsBusy(false);
      }
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
    <div className="rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 dir="auto" className="text-start text-sm font-semibold text-foreground">
              {group.name}
            </h3>
            {group.sourcePresetId ? <Badge variant="success">{t('mod.basedOnPreset')}</Badge> : null}
            {group.status === 'INACTIVE' ? <Badge variant="neutral">{t('common.inactive')}</Badge> : null}
          </div>
          {group.helperText ? (
            <p dir="auto" className="text-start text-xs text-muted-foreground">
              {group.helperText}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {t('mod.selectionRange', {
              kind: group.minimumSelections === 0 ? t('mod.optional') : t('mod.required'),
              min: group.minimumSelections,
              max: group.maximumSelections,
            })}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {group.sourcePresetId ? (
            // Preset-linked: name/helperText/min-max/translations sync from
            // the Modifier Library and are not locally editable, and
            // deactivating in place would be misleading -- "Remove from
            // Product" is the only V1 way to stop using the Preset here.
            <Button
              type="button"
              variant="danger"
              disabled={!canManage || isBusy}
              onClick={() => void handleRemoveFromProduct()}
            >
              {t('mod.removeFromProduct')}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={!canManage}
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? t('common.close') : t('common.edit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!canManage || isBusy}
                onClick={() => void toggleStatus()}
              >
                {group.status === 'ACTIVE' ? t('common.deactivate') : t('common.activate')}
              </Button>
              {group.canDelete ? (
                <Button
                  type="button"
                  variant="danger"
                  disabled={!canManage || isBusy}
                  onClick={() => void handleDelete()}
                >
                  {t('common.delete')}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-2">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {isEditing && !group.sourcePresetId ? (
        <div className="mt-3">
          <EditModifierGroupForm
            restaurantId={restaurantId}
            productId={productId}
            group={group}
            locales={locales}
            onSaved={(updated) => {
              onGroupChanged(updated);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        {group.options.map((option) => (
          <ModifierOptionRow
            key={option.id}
            restaurantId={restaurantId}
            productId={productId}
            groupId={group.id}
            option={option}
            currencyCode={currencyCode}
            canManage={canManage}
            locales={locales}
            onChanged={(updated) => onOptionChanged(group.id, updated)}
            onRemoved={(optionId) => onOptionRemoved(group.id, optionId)}
          />
        ))}
      </div>

      {isAddingOption ? (
        <div className="mt-3">
          <NewModifierOptionForm
            restaurantId={restaurantId}
            productId={productId}
            groupId={group.id}
            nextDisplayOrder={group.options.length}
            onCancel={() => setIsAddingOption(false)}
            onCreated={(option) => {
              onOptionCreated(group.id, option);
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
  );
}
