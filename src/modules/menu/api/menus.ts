import { apiFetch } from '../../../lib/api/client';
import type { CreateMenuInput, TranslationInput, UpdateMenuInput } from '../types/api';
import type {
  Category,
  Menu,
  MenuTranslation
} from '../types/index';

/**
 * Thin Menu/Category/Product request layer (Batch H, Section 8): each
 * function calls the one documented Backend route exactly, using the
 * existing `apiFetch` transport -- no generic repository-wide SDK, no
 * second API abstraction. Every payload here matches the Backend DTO's
 * writable-field set exactly (API_CONVENTIONS.md); fields the DTOs strip or
 * reject (`restaurantId`, `isPrimary`, `locale`, `publicId`,
 * `primaryImageAssetPath`, timestamps) are never sent.
 */

export function restaurantPath(restaurantId: string): string {
  return `/restaurants/${restaurantId}`;
}

export async function listMenus(restaurantId: string): Promise<Menu[]> {
  const body = await apiFetch<{ data: Menu[] }>(
    `${restaurantPath(restaurantId)}/menus`,
  );
  return body.data;
}

export async function createMenu(
  restaurantId: string,
  input: CreateMenuInput,
): Promise<Menu> {
  const body = await apiFetch<{ data: Menu }>(
    `${restaurantPath(restaurantId)}/menus`,
    { method: 'POST', body: input },
  );
  return body.data;
}

export async function updateMenu(
  restaurantId: string,
  menuId: string,
  input: UpdateMenuInput,
): Promise<Menu> {
  const body = await apiFetch<{ data: Menu }>(
    `${restaurantPath(restaurantId)}/menus/${menuId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

/** No meaningful request body -- the Backend alone performs the primary switch (Section 12). */
export async function setPrimaryMenu(
  restaurantId: string,
  menuId: string,
): Promise<Menu> {
  const body = await apiFetch<{ data: Menu }>(
    `${restaurantPath(restaurantId)}/menus/${menuId}/primary`,
    { method: 'PATCH', body: {} },
  );
  return body.data;
}

/** Archive the active primary Menu and replace it with an empty one atomically. */
export async function startFreshMenu(
  restaurantId: string,
  expectedPrimaryMenuId: string,
): Promise<{ menuId: string; changed: boolean }> {
  const body = await apiFetch<{ data: { menuId: string; changed: boolean } }>(
    `${restaurantPath(restaurantId)}/menus/start-fresh`,
    {
      method: 'POST',
      body: {
        expectedPrimaryMenuId,
        confirmation: 'ARCHIVE_AND_START_FRESH',
      },
    },
  );
  return body.data;
}

/** `menuId` omitted lists every Category across the whole Restaurant (Backend `ListCategoriesQueryDto`) -- used by the Product Editor route to build one Menu-grouped Category picker. */
export async function listCategories(
  restaurantId: string,
  menuId?: string,
): Promise<Category[]> {
  const query = menuId ? `?menuId=${menuId}` : '';
  const body = await apiFetch<{ data: Category[] }>(
    `${restaurantPath(restaurantId)}/categories${query}`,
  );
  return body.data;
}

/** Drag-and-drop ordering: the complete new order of one Menu's Categories. `409 ORDER_MISMATCH` when the list changed meanwhile. */
export async function reorderCategories(
  restaurantId: string,
  menuId: string,
  categoryIds: string[],
): Promise<void> {
  await apiFetch<{ data: { categoryIds: string[] } }>(
    `${restaurantPath(restaurantId)}/categories/order`,
    { method: 'PUT', body: { menuId, categoryIds } },
  );
}

// Menu translations -- raw editing resources, no fallback logic (Section 5).

export async function getMenuTranslations(
  restaurantId: string,
  menuId: string,
): Promise<MenuTranslation[]> {
  const body = await apiFetch<{ data: MenuTranslation[] }>(
    `${restaurantPath(restaurantId)}/menus/${menuId}/translations`,
  );
  return body.data;
}

export async function putMenuTranslation(
  restaurantId: string,
  menuId: string,
  locale: string,
  input: TranslationInput,
): Promise<MenuTranslation> {
  const body = await apiFetch<{ data: MenuTranslation }>(
    `${restaurantPath(restaurantId)}/menus/${menuId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteMenuTranslation(
  restaurantId: string,
  menuId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${restaurantPath(restaurantId)}/menus/${menuId}/translations/${locale}`,
    { method: 'DELETE' },
  );
}
