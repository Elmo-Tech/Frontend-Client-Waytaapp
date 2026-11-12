import { apiFetch } from '../../../lib/api/client';
import type { CreateProductVariantInput, ProductVariantTranslationRow, UpdateProductVariantInput } from '../types/api';
import type {
  ProductVariant
} from '../types/index';
import { restaurantPath } from './menus';

/**
 * Product Variants (DEC-041): Staff configuration of a Product's sizes,
 * `/restaurants/{id}/products/{productId}/variants` (menu.view to read,
 * menu.manage with Restaurant-wide scope to write).
 */
function variantsPath(restaurantId: string, productId: string): string {
  return `${restaurantPath(restaurantId)}/products/${productId}/variants`;
}

export async function listProductVariants(
  restaurantId: string,
  productId: string,
): Promise<ProductVariant[]> {
  const body = await apiFetch<{ data: ProductVariant[] }>(variantsPath(restaurantId, productId));
  return body.data;
}

export async function createProductVariant(
  restaurantId: string,
  productId: string,
  input: CreateProductVariantInput,
): Promise<ProductVariant> {
  const body = await apiFetch<{ data: ProductVariant }>(variantsPath(restaurantId, productId), {
    method: 'POST',
    body: input,
  });
  return body.data;
}

export async function updateProductVariant(
  restaurantId: string,
  productId: string,
  variantId: string,
  input: UpdateProductVariantInput,
): Promise<ProductVariant> {
  const body = await apiFetch<{ data: ProductVariant }>(
    `${variantsPath(restaurantId, productId)}/${variantId}`,
    { method: 'PATCH', body: input },
  );
  return body.data;
}

/** Hard DELETE, only offered when `canDelete` is true; the Backend refuses it again (409 `VARIANT_HAS_HISTORICAL_REFERENCES`). */
export async function deleteProductVariant(
  restaurantId: string,
  productId: string,
  variantId: string,
): Promise<void> {
  await apiFetch<undefined>(`${variantsPath(restaurantId, productId)}/${variantId}`, {
    method: 'DELETE',
  });
}

export async function reorderProductVariants(
  restaurantId: string,
  productId: string,
  variantIds: string[],
): Promise<void> {
  await apiFetch<{ data: { variantIds: string[] } }>(`${variantsPath(restaurantId, productId)}/order`, {
    method: 'PUT',
    body: { variantIds },
  });
}

export async function getProductVariantTranslations(
  restaurantId: string,
  productId: string,
  variantId: string,
): Promise<ProductVariantTranslationRow[]> {
  const body = await apiFetch<{ data: ProductVariantTranslationRow[] }>(
    `${variantsPath(restaurantId, productId)}/${variantId}/translations`,
  );
  return body.data;
}

export async function putProductVariantTranslation(
  restaurantId: string,
  productId: string,
  variantId: string,
  locale: string,
  input: { name: string },
): Promise<ProductVariantTranslationRow> {
  const body = await apiFetch<{ data: ProductVariantTranslationRow }>(
    `${variantsPath(restaurantId, productId)}/${variantId}/translations/${locale}`,
    { method: 'PUT', body: input },
  );
  return body.data;
}

export async function deleteProductVariantTranslation(
  restaurantId: string,
  productId: string,
  variantId: string,
  locale: string,
): Promise<void> {
  await apiFetch<undefined>(
    `${variantsPath(restaurantId, productId)}/${variantId}/translations/${locale}`,
    { method: 'DELETE' },
  );
}
