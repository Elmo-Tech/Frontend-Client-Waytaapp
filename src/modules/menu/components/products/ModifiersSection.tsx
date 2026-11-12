'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../../components/ui/Alert';
import { Button } from '../../../../components/ui/Button';
import { FormSection } from '../../../../components/ui/FormSection';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { useStaffI18n } from '../../../../lib/i18n/client';
import * as menuApi from '../../api';
import type {
  ModifierGroup
} from '../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../lib/api/user-errors';
import { ModifiersSectionProps } from './modifiers/model';
import { ModifierGroupCard } from './modifiers/ModifierGroupCard';
import { NewModifierGroupForm } from './modifiers/NewModifierGroupForm';
import { UsePresetPicker } from './modifiers/UsePresetPicker';
/**
 * FT-6A (closeout: full EN/AR localization added); FT-6B (Preset library +
 * per-Product price override, nested-<form> bug fixed): a clean "Modifiers"
 * section on the Product Editor -- create/edit Modifier Groups and their
 * Options, deactivate rather than hard-delete (DATABASE_SPEC.md #58:
 * history must never break). Only rendered in Edit mode (Groups nest under
 * an existing `productId`, exactly like `ProductTranslationSection`).
 *
 * IMPORTANT: this whole section renders INSIDE `ProductEditor`'s own outer
 * `<form onSubmit={handleSubmit}>` (Section 1) -- every interactive element
 * here MUST be `type="button"` with an explicit `onClick`, never a nested
 * `<form>`/`type="submit"` of its own (invalid HTML: "<form> cannot be a
 * descendant of <form>", and Chrome/React would otherwise submit/reload the
 * WHOLE Product Editor on a Modifier action).
 */
export function ModifiersSection({
  restaurantId,
  productId,
  currencyCode,
  canManage,
  locales,
  onGroupsChange,
}: ModifiersSectionProps) {
  const { t } = useStaffI18n();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [addMode, setAddMode] = useState<'none' | 'choose' | 'preset' | 'custom'>('none');

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await menuApi.listModifierGroups(restaurantId, productId);
      setGroups(data);
      setStatus('loaded');
    } catch (err) {
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setStatus('error');
      setError(describeError(err));
    }
  }, [restaurantId, productId]);

  useEffect(() => {
    // `queueMicrotask` satisfies eslint-plugin-react-hooks'
    // `set-state-in-effect` rule (same pattern as `ProductEditor`'s own
    // mount effect) -- it has nothing to do with the load itself.
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (status === 'loaded') onGroupsChange?.(groups);
  }, [groups, status, onGroupsChange]);

  if (status === 'loading') {
    return (
      <FormSection title={t('mod.title')}>
        <LoadingState label={t('mod.loading')} />
      </FormSection>
    );
  }

  if (status === 'error') {
    return (
      <FormSection title={t('mod.title')}>
        <Alert variant="error">{error}</Alert>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          {t('common.retry')}
        </Button>
      </FormSection>
    );
  }

  const alreadyAppliedPresetIds = new Set(
    groups.map((group) => group.sourcePresetId).filter((id): id is string => id !== null),
  );

  return (
    <FormSection title={t('mod.title')}>
      <p className="text-xs text-muted-foreground">{t('mod.intro')}</p>

      {groups.length === 0 && addMode === 'none' ? (
        <p className="text-sm text-muted-foreground">{t('mod.noGroups')}</p>
      ) : null}

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <ModifierGroupCard
            key={group.id}
            restaurantId={restaurantId}
            productId={productId}
            currencyCode={currencyCode}
            group={group}
            canManage={canManage}
            locales={locales}
            onGroupChanged={(updated) =>
              setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...updated, options: g.options } : g)))
            }
            onOptionCreated={(groupId, option) =>
              setGroups((prev) =>
                prev.map((g) => (g.id === groupId ? { ...g, options: [...g.options, option] } : g)),
              )
            }
            onOptionChanged={(groupId, option) =>
              setGroups((prev) =>
                prev.map((g) =>
                  g.id === groupId
                    ? { ...g, options: g.options.map((o) => (o.id === option.id ? option : o)) }
                    : g,
                ),
              )
            }
            onGroupRemoved={(groupId) => setGroups((prev) => prev.filter((g) => g.id !== groupId))}
            onOptionRemoved={(groupId, optionId) =>
              setGroups((prev) =>
                prev.map((g) =>
                  g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g,
                ),
              )
            }
          />
        ))}
      </div>

      {addMode === 'none' ? (
        <Button type="button" variant="secondary" disabled={!canManage} onClick={() => setAddMode('choose')}>
          {t('mod.add')}
        </Button>
      ) : null}

      {addMode === 'choose' ? (
        <div className="flex flex-wrap gap-2 rounded-md border border-border p-3">
          <Button type="button" variant="secondary" onClick={() => setAddMode('preset')}>
            {t('mod.usePreset')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setAddMode('custom')}>
            {t('mod.createCustom')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setAddMode('none')}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : null}

      {addMode === 'preset' ? (
        <UsePresetPicker
          restaurantId={restaurantId}
          productId={productId}
          alreadyAppliedPresetIds={alreadyAppliedPresetIds}
          onCancel={() => setAddMode('none')}
          onApplied={(group) => {
            setGroups((prev) => [...prev, group]);
            setAddMode('none');
          }}
        />
      ) : null}

      {addMode === 'custom' ? (
        <NewModifierGroupForm
          restaurantId={restaurantId}
          productId={productId}
          nextDisplayOrder={groups.length}
          onCancel={() => setAddMode('none')}
          onCreated={(group) => {
            setGroups((prev) => [...prev, group]);
            setAddMode('none');
          }}
        />
      ) : null}
    </FormSection>
  );
}
