import { apiFetch, apiFetchFormData } from '../../../lib/api/client';
import type { CreateCategoryInput, TranslationInput, UpdateCategoryInput } from '../types/api';
import type {
  Category,
  CategoryTranslation
} from '../types/index';
import { restaurantPath } from './menus';

export async function createCategory(
  restaurantId: string,
  input: CreateCategoryInput,
): Promise<Category> {
  const body = await apiFetch<{ data: Category }>(
    `${restaurantPath(restaurantId)}/categories`,
    { method: 'POST', body: input },
  );
  return body.data;
}

export async function updateCategory(
  restaurantId: string,
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const body = await apiFetch<{ data: Category }>(
    `${restaurantPath(restaurantId)}/categories/${categoryId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

/** FT-2: uploads (or replaces) the Category's one image. `field name` must be exactly `image`, matching the Backend's `FileInterceptor('image', ...)`. */
export async function uploadCategoryImage(
  restaurantId: string,
  categoryId: string,
  file: File,
): Promise<{ imageAssetPath: string }> {
  const formData = new FormData();
  formData.set('image', file);
  const body = await apiFetchFormData<{ data: { imageAssetPath: string } }>(
    `${restaurantPath(restaurantId)}/categories/${categoryId}/image`,
    formData,
  );
  return body.data;
}

export async function removeCategoryImage(
  restaurantId: string,
  categoryId: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${restaurantPath(restaurantId)}/categories/${categoryId}/image`,
    { method: 'DELETE' },
  );
}

// Category translations -- same pattern as Menu translations.

export async function getCategoryTranslations(
  restaurantId: string,
  categoryId: string,
): Promise<CategoryTranslation[]> {
  const body = await apiFetch<{ data: CategoryTranslation[] }>(
    `${restaurantPath(restaurantId)}/categories/${categoryId}/translations`,
  );
  return body.data;
}

export async function putCategoryTranslation(
  restaurantId: string,
  categoryId: string,
  locale: string,
  input: TranslationInput,
): Promise<CategoryTranslation> {
  const body = await apiFetch<{ data: CategoryTranslation }>(
    `${restaurantPath(restaurantId)}/categories/${categoryId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteCategoryTranslation(
  restaurantId: string,
  categoryId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${restaurantPath(restaurantId)}/categories/${categoryId}/translations/${locale}`,
    { method: 'DELETE' },
  );
}
