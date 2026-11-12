import { apiFetch } from '../../../lib/api/client';
import type { CreateModifierGroupInput, CreateModifierOptionInput, ModifierGroupTranslationInput, ModifierGroupTranslationRow, ModifierOptionTranslationInput, ModifierOptionTranslationRow, UpdateModifierGroupInput, UpdateModifierOptionInput } from '../types/api';
import type {
  ModifierGroup,
  ModifierOption
} from '../types/index';
import { restaurantPath } from './menus';

/**
 * FT-6A: Modifier Group/Option request layer, nested under Product exactly
 * like `translations` above. `name`/`helperText` write the Restaurant's
 * default-locale translation row directly (V1 scope, mirrors
 * `CreateProductInput.name`) -- there is no locale parameter here.
 */
export function modifierGroupsPath(restaurantId: string, productId: string): string {
  return `${restaurantPath(restaurantId)}/products/${productId}/modifier-groups`;
}

export async function listModifierGroups(
  restaurantId: string,
  productId: string,
): Promise<ModifierGroup[]> {
  const body = await apiFetch<{ data: ModifierGroup[] }>(
    modifierGroupsPath(restaurantId, productId),
  );
  return body.data;
}

export async function createModifierGroup(
  restaurantId: string,
  productId: string,
  input: CreateModifierGroupInput,
): Promise<ModifierGroup> {
  const body = await apiFetch<{ data: ModifierGroup }>(
    modifierGroupsPath(restaurantId, productId),
    { method: 'POST', body: input },
  );
  return body.data;
}

export async function updateModifierGroup(
  restaurantId: string,
  productId: string,
  groupId: string,
  input: UpdateModifierGroupInput,
): Promise<ModifierGroup> {
  const body = await apiFetch<{ data: ModifierGroup }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

export async function createModifierOption(
  restaurantId: string,
  productId: string,
  groupId: string,
  input: CreateModifierOptionInput,
): Promise<ModifierOption> {
  const body = await apiFetch<{ data: ModifierOption }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/options`,
    { method: 'POST', body: input },
  );
  return body.data;
}

export async function updateModifierOption(
  restaurantId: string,
  productId: string,
  groupId: string,
  optionId: string,
  input: UpdateModifierOptionInput,
): Promise<ModifierOption> {
  const body = await apiFetch<{ data: ModifierOption }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/options/${optionId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

/**
 * FT-6B closeout, Section 3/4: "Delete" for a Custom Modifier Group -- hard
 * DELETE, only ever offered by the UI when `ModifierGroup.canDelete` is
 * true (no historical Order reference). The Backend rejects it again
 * regardless (409 `MODIFIER_HAS_HISTORICAL_REFERENCES`).
 */
export async function deleteModifierGroup(
  restaurantId: string,
  productId: string,
  groupId: string,
): Promise<void> {
  await apiFetch<undefined>(`${modifierGroupsPath(restaurantId, productId)}/${groupId}`, {
    method: 'DELETE',
  });
}

/**
 * FT-6B closeout, Section 3/4: "Remove from Product" for a Preset-linked
 * Modifier Group -- ADAPTIVE: hard-deletes when historically safe
 * (`data: null`), or deactivates the Group instead when not (`data` holds
 * the now-INACTIVE Group).
 */
export async function removeModifierGroupFromProduct(
  restaurantId: string,
  productId: string,
  groupId: string,
): Promise<ModifierGroup | null> {
  const body = await apiFetch<{ data: ModifierGroup | null }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/remove`,
    { method: 'POST' },
  );
  return body.data;
}

/**
 * FT-6B closeout, Section 3/4/6: "Delete" for a Custom Modifier Option --
 * same historical-safety rule as `deleteModifierGroup`, scoped to one
 * Option (applies equally to a Custom Option inside an otherwise
 * Preset-linked Group).
 */
export async function deleteModifierOption(
  restaurantId: string,
  productId: string,
  groupId: string,
  optionId: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/options/${optionId}`,
    { method: 'DELETE' },
  );
}

export async function getModifierGroupTranslations(
  restaurantId: string,
  productId: string,
  groupId: string,
): Promise<ModifierGroupTranslationRow[]> {
  const body = await apiFetch<{ data: ModifierGroupTranslationRow[] }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/translations`,
  );
  return body.data;
}

export async function putModifierGroupTranslation(
  restaurantId: string,
  productId: string,
  groupId: string,
  locale: string,
  input: ModifierGroupTranslationInput,
): Promise<ModifierGroupTranslationRow> {
  const body = await apiFetch<{ data: ModifierGroupTranslationRow }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteModifierGroupTranslation(
  restaurantId: string,
  productId: string,
  groupId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/translations/${locale}`,
    { method: 'DELETE' },
  );
}

export async function getModifierOptionTranslations(
  restaurantId: string,
  productId: string,
  groupId: string,
  optionId: string,
): Promise<ModifierOptionTranslationRow[]> {
  const body = await apiFetch<{ data: ModifierOptionTranslationRow[] }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/options/${optionId}/translations`,
  );
  return body.data;
}

export async function putModifierOptionTranslation(
  restaurantId: string,
  productId: string,
  groupId: string,
  optionId: string,
  locale: string,
  input: ModifierOptionTranslationInput,
): Promise<ModifierOptionTranslationRow> {
  const body = await apiFetch<{ data: ModifierOptionTranslationRow }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/options/${optionId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteModifierOptionTranslation(
  restaurantId: string,
  productId: string,
  groupId: string,
  optionId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/options/${optionId}/translations/${locale}`,
    { method: 'DELETE' },
  );
}

/**
 * FT-6B, "Reset to preset": re-adopts the linked Preset Option's CURRENT
 * price for this Product and clears the override flag. The target price is
 * resolved server-side -- never client-supplied.
 */
export async function resetModifierOptionPrice(
  restaurantId: string,
  productId: string,
  groupId: string,
  optionId: string,
): Promise<ModifierOption> {
  const body = await apiFetch<{ data: ModifierOption }>(
    `${modifierGroupsPath(restaurantId, productId)}/${groupId}/options/${optionId}/reset-price`,
    { method: 'POST' },
  );
  return body.data;
}
