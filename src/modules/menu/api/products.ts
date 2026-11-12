import { apiFetch, apiFetchFormData } from '../../../lib/api/client';
import type { CreateProductInput, TranslationInput, UpdateProductInput } from '../types/api';
import type {
  Product,
  ProductAvailability,
  ProductTranslation
} from '../types/index';
import { restaurantPath } from './menus';

/** `categoryId` omitted lists every Product across the whole Restaurant (Backend `ListProductsQueryDto`) -- used by the Product Editor route to locate one Product by id without already knowing its Category. */
export async function listProducts(
  restaurantId: string,
  categoryId?: string,
): Promise<Product[]> {
  const query = categoryId ? `?categoryId=${categoryId}` : '';
  const body = await apiFetch<{ data: Product[] }>(
    `${restaurantPath(restaurantId)}/products${query}`,
  );
  return body.data;
}

/** Drag-and-drop ordering: the complete new order of one Category's Products. `409 ORDER_MISMATCH` when the list changed meanwhile. */
export async function reorderProducts(
  restaurantId: string,
  categoryId: string,
  productIds: string[],
): Promise<void> {
  await apiFetch<{ data: { productIds: string[] } }>(
    `${restaurantPath(restaurantId)}/products/order`,
    { method: 'PUT', body: { categoryId, productIds } },
  );
}

export async function createProduct(
  restaurantId: string,
  input: CreateProductInput,
): Promise<Product> {
  const body = await apiFetch<{ data: Product }>(
    `${restaurantPath(restaurantId)}/products`,
    { method: 'POST', body: input },
  );
  return body.data;
}

export async function updateProduct(
  restaurantId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<Product> {
  const body = await apiFetch<{ data: Product }>(
    `${restaurantPath(restaurantId)}/products/${productId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

/** The only field this endpoint accepts (Section 20) -- never sent through generic Product Update. */
export async function updateProductAvailability(
  restaurantId: string,
  productId: string,
  availability: ProductAvailability,
): Promise<{ id: string; availability: ProductAvailability }> {
  const body = await apiFetch<{
    data: { id: string; availability: ProductAvailability };
  }>(`${restaurantPath(restaurantId)}/products/${productId}/availability`, {
    method: 'PATCH',
    body: { availability },
  });
  return body.data;
}

/** FT-2: uploads (or replaces) the Product's one primary image. `field name` must be exactly `image`, matching the Backend's `FileInterceptor('image', ...)`. */
export async function uploadProductImage(
  restaurantId: string,
  productId: string,
  file: File,
): Promise<{ primaryImageAssetPath: string }> {
  const formData = new FormData();
  formData.set('image', file);
  const body = await apiFetchFormData<{ data: { primaryImageAssetPath: string } }>(
    `${restaurantPath(restaurantId)}/products/${productId}/image`,
    formData,
  );
  return body.data;
}

export async function removeProductImage(
  restaurantId: string,
  productId: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${restaurantPath(restaurantId)}/products/${productId}/image`,
    { method: 'DELETE' },
  );
}

// Product translations -- same pattern as Menu translations.

export async function getProductTranslations(
  restaurantId: string,
  productId: string,
): Promise<ProductTranslation[]> {
  const body = await apiFetch<{ data: ProductTranslation[] }>(
    `${restaurantPath(restaurantId)}/products/${productId}/translations`,
  );
  return body.data;
}

export async function putProductTranslation(
  restaurantId: string,
  productId: string,
  locale: string,
  input: TranslationInput,
): Promise<ProductTranslation> {
  const body = await apiFetch<{ data: ProductTranslation }>(
    `${restaurantPath(restaurantId)}/products/${productId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteProductTranslation(
  restaurantId: string,
  productId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${restaurantPath(restaurantId)}/products/${productId}/translations/${locale}`,
    { method: 'DELETE' },
  );
}
