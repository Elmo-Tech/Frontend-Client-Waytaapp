'use client';
import { createRequestSequence } from '../../../../lib/utils/async-control';
import { NewPresetForm } from './NewPresetForm';
import { PresetDetail } from './PresetDetail';

import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../../../components/ui/Alert';

import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

import { LoadingState } from '../../../../components/ui/LoadingState';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { useStaffI18n } from '../../../../lib/i18n/client';

import * as settingsApi from '../../../settings/api';
import type { RestaurantLocalesResponse } from '../../../settings/types';
import * as menuApi from '../../api';

import type { ModifierPreset } from '../../types/index';
import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../lib/api/user-errors';

import { MenuHubBackLink } from '../MenuHubBackLink';
import { MenuSectionTabs } from '../MenuSectionTabs';

export interface ModifierPresetsWorkspaceProps {
  restaurantId: string;
  currencyCode: string;
  canManage: boolean;
  hasMenuManagePermission: boolean;
  /** The package includes Offers (DEC-069): the "Offers" tab is shown. */
  offersEnabled?: boolean;
}

/**
 * FT-6B, Section 7: a minimal Restaurant-wide Modifier Preset library
 * screen -- list, create, edit a Preset's name/helperText/min-max (every
 * active locale), add/edit its Options (name/price, every active locale).
 * Saving a Preset's field here syncs it into every linked Product-local
 * Modifier Group/Option (`ModifiersSection.tsx`'s "Based on preset" rows)
 * via the Backend's own sync logic -- this page never touches a Product
 * directly. No nested `<form>` anywhere (same discipline as
 * `ModifiersSection.tsx`, Section 1) even though this page is not itself
 * inside another form -- consistency avoids the same class of bug
 * resurfacing here later.
 */
export function ModifierPresetsWorkspace({
  restaurantId,
  currencyCode,
  canManage,
  hasMenuManagePermission,
  offersEnabled = false,
}: ModifierPresetsWorkspaceProps) {
  const { t } = useStaffI18n();
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<ModifierPreset[]>([]);
  const [locales, setLocales] = useState<RestaurantLocalesResponse | null>(
    null,
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [reads] = useState(createRequestSequence);
  const load = useCallback(async () => {
    const isCurrent = reads.next();
    setStatus('loading');
    setError(null);
    try {
      const [presetsData, localesData] = await Promise.all([
        menuApi.listModifierPresets(restaurantId),
        settingsApi.getRestaurantLocales(restaurantId),
      ]);
      if (!isCurrent()) return;
      setPresets(presetsData);
      setLocales(localesData);
      setStatus('loaded');
    } catch (err) {
      if (!isCurrent()) return;
      if (isUnauthenticatedError(err)) {
        redirectToLogin();
        return;
      }
      setStatus('error');
      setError(describeError(err));
    }
  }, [restaurantId, reads]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      reads.invalidate();
    };
  }, [load, reads]);

  const selectedPreset =
    presets.find((preset) => preset.id === selectedPresetId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <MenuHubBackLink restaurantId={restaurantId} parent="menus" />
      <PageHeader
        title={t('presets.title')}
        description={t('presets.subtitle')}
      />

      <MenuSectionTabs
        restaurantId={restaurantId}
        active="modifier-library"
        offersEnabled={offersEnabled}
      />

      {!canManage && hasMenuManagePermission ? (
        <Alert variant="info">{t('presets.needsFullScope')}</Alert>
      ) : null}

      {status === 'loading' ? (
        <Card>
          <LoadingState label={t('presets.loading')} />
        </Card>
      ) : status === 'error' ? (
        <Card className="flex flex-col gap-3">
          <Alert variant="error">{error}</Alert>
          <Button variant="secondary" onClick={() => void load()}>
            {t('common.retry')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="flex flex-col gap-2">
            {presets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('presets.none')}
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {presets.map((preset) => (
                  <li key={preset.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setIsCreating(false);
                      }}
                      className={`w-full rounded-md px-3 py-2 text-start text-sm ${
                        selectedPresetId === preset.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <bdi dir="auto">{preset.name}</bdi>
                      {preset.status === 'INACTIVE'
                        ? t('presets.inactiveSuffix')
                        : ''}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="secondary"
              disabled={!canManage}
              onClick={() => {
                setIsCreating(true);
                setSelectedPresetId(null);
              }}
            >
              {t('presets.new')}
            </Button>
          </Card>

          <Card>
            {isCreating ? (
              <NewPresetForm
                restaurantId={restaurantId}
                nextDisplayOrder={presets.length}
                onCancel={() => setIsCreating(false)}
                onCreated={(preset) => {
                  setPresets((prev) => [...prev, preset]);
                  setSelectedPresetId(preset.id);
                  setIsCreating(false);
                }}
              />
            ) : selectedPreset ? (
              <PresetDetail
                // Keying by preset id forces a fresh mount (and fresh
                // internal `useState`) whenever the User selects a
                // DIFFERENT preset -- simpler and lint-clean vs. an effect
                // that resets local form state on prop change.
                key={selectedPreset.id}
                restaurantId={restaurantId}
                currencyCode={currencyCode}
                canManage={canManage}
                locales={locales}
                preset={selectedPreset}
                onPresetChanged={(updated) =>
                  setPresets((prev) =>
                    prev.map((p) =>
                      p.id === updated.id
                        ? { ...updated, options: p.options }
                        : p,
                    ),
                  )
                }
                onOptionCreated={(option) =>
                  setPresets((prev) =>
                    prev.map((p) =>
                      p.id === selectedPreset.id
                        ? { ...p, options: [...p.options, option] }
                        : p,
                    ),
                  )
                }
                onOptionChanged={(option) =>
                  setPresets((prev) =>
                    prev.map((p) =>
                      p.id === selectedPreset.id
                        ? {
                            ...p,
                            options: p.options.map((o) =>
                              o.id === option.id ? option : o,
                            ),
                          }
                        : p,
                    ),
                  )
                }
                onPresetRemoved={(presetId) => {
                  setPresets((prev) => prev.filter((p) => p.id !== presetId));
                  setSelectedPresetId(null);
                }}
                onOptionRemoved={(optionId) =>
                  setPresets((prev) =>
                    prev.map((p) =>
                      p.id === selectedPreset.id
                        ? {
                            ...p,
                            options: p.options.filter((o) => o.id !== optionId),
                          }
                        : p,
                    ),
                  )
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('presets.selectHint')}
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
