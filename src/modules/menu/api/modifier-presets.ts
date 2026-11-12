import { apiFetch } from '../../../lib/api/client';
import type { CreateModifierPresetInput, CreateModifierPresetOptionInput, ModifierPresetOptionTranslationInput, ModifierPresetOptionTranslationRow, ModifierPresetTranslationInput, ModifierPresetTranslationRow, UpdateModifierPresetInput, UpdateModifierPresetOptionInput } from '../types/api';
import type {
  ModifierGroup,
  ModifierPreset,
  ModifierPresetOption
} from '../types/index';
import { restaurantPath } from './menus';
import { modifierGroupsPath } from './modifiers';

/**
 * FT-6B: "Use Preset" -- attaches a Restaurant-scoped Modifier Preset to
 * this Product by copying its current values into a real, independent
 * Modifier Group/Options (never a second pricing entity).
 */
export async function applyModifierPreset(
  restaurantId: string,
  productId: string,
  presetId: string,
): Promise<ModifierGroup> {
  const body = await apiFetch<{ data: ModifierGroup }>(
    `${modifierGroupsPath(restaurantId, productId)}/apply-preset`,
    { method: 'POST', body: { presetId } },
  );
  return body.data;
}

/**
 * FT-6B: the Restaurant-scoped Modifier Preset library request layer,
 * mirroring the Modifier Group/Option functions above exactly -- Presets
 * nest directly under `restaurants/:restaurantId`, never under a Product.
 */
function modifierPresetsPath(restaurantId: string): string {
  return `${restaurantPath(restaurantId)}/modifier-presets`;
}

export async function listModifierPresets(restaurantId: string): Promise<ModifierPreset[]> {
  const body = await apiFetch<{ data: ModifierPreset[] }>(modifierPresetsPath(restaurantId));
  return body.data;
}

export async function createModifierPreset(
  restaurantId: string,
  input: CreateModifierPresetInput,
): Promise<ModifierPreset> {
  const body = await apiFetch<{ data: ModifierPreset }>(modifierPresetsPath(restaurantId), {
    method: 'POST',
    body: input,
  });
  return body.data;
}

export async function updateModifierPreset(
  restaurantId: string,
  presetId: string,
  input: UpdateModifierPresetInput,
): Promise<ModifierPreset> {
  const body = await apiFetch<{ data: ModifierPreset }>(
    `${modifierPresetsPath(restaurantId)}/${presetId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

/**
 * FT-6B closeout, Section 5: "Delete" a Preset -- hard DELETE, only ever
 * offered by the UI when `ModifierPreset.canDelete` is true (not currently
 * attached to any Product). Never cascades into Product-local Groups.
 */
export async function deleteModifierPreset(restaurantId: string, presetId: string): Promise<void> {
  await apiFetch<undefined>(`${modifierPresetsPath(restaurantId)}/${presetId}`, { method: 'DELETE' });
}

export async function createModifierPresetOption(
  restaurantId: string,
  presetId: string,
  input: CreateModifierPresetOptionInput,
): Promise<ModifierPresetOption> {
  const body = await apiFetch<{ data: ModifierPresetOption }>(
    `${modifierPresetsPath(restaurantId)}/${presetId}/options`,
    { method: 'POST', body: input },
  );
  return body.data;
}

export async function updateModifierPresetOption(
  restaurantId: string,
  presetId: string,
  presetOptionId: string,
  input: UpdateModifierPresetOptionInput,
): Promise<ModifierPresetOption> {
  const body = await apiFetch<{ data: ModifierPresetOption }>(
    `${modifierPresetsPath(restaurantId)}/${presetId}/options/${presetOptionId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

/**
 * FT-6B closeout, Section 5: "Delete" a Preset Option -- same
 * "unreferenced only" rule as `deleteModifierPreset`.
 */
export async function deleteModifierPresetOption(
  restaurantId: string,
  presetId: string,
  presetOptionId: string,
): Promise<void> {
  await apiFetch<undefined>(`${modifierPresetsPath(restaurantId)}/${presetId}/options/${presetOptionId}`, {
    method: 'DELETE',
  });
}

export async function getModifierPresetTranslations(
  restaurantId: string,
  presetId: string,
): Promise<ModifierPresetTranslationRow[]> {
  const body = await apiFetch<{ data: ModifierPresetTranslationRow[] }>(
    `${modifierPresetsPath(restaurantId)}/${presetId}/translations`,
  );
  return body.data;
}

export async function putModifierPresetTranslation(
  restaurantId: string,
  presetId: string,
  locale: string,
  input: ModifierPresetTranslationInput,
): Promise<ModifierPresetTranslationRow> {
  const body = await apiFetch<{ data: ModifierPresetTranslationRow }>(
    `${modifierPresetsPath(restaurantId)}/${presetId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteModifierPresetTranslation(
  restaurantId: string,
  presetId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(`${modifierPresetsPath(restaurantId)}/${presetId}/translations/${locale}`, {
    method: 'DELETE',
  });
}

export async function getModifierPresetOptionTranslations(
  restaurantId: string,
  presetId: string,
  presetOptionId: string,
): Promise<ModifierPresetOptionTranslationRow[]> {
  const body = await apiFetch<{ data: ModifierPresetOptionTranslationRow[] }>(
    `${modifierPresetsPath(restaurantId)}/${presetId}/options/${presetOptionId}/translations`,
  );
  return body.data;
}

export async function putModifierPresetOptionTranslation(
  restaurantId: string,
  presetId: string,
  presetOptionId: string,
  locale: string,
  input: ModifierPresetOptionTranslationInput,
): Promise<ModifierPresetOptionTranslationRow> {
  const body = await apiFetch<{ data: ModifierPresetOptionTranslationRow }>(
    `${modifierPresetsPath(restaurantId)}/${presetId}/options/${presetOptionId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteModifierPresetOptionTranslation(
  restaurantId: string,
  presetId: string,
  presetOptionId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${modifierPresetsPath(restaurantId)}/${presetId}/options/${presetOptionId}/translations/${locale}`,
    { method: 'DELETE' },
  );
}
