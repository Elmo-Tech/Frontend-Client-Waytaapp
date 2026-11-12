import type {
  CategoryStatus,
  MenuStatus,
  ModifierGroupStatus,
  ModifierOptionStatus,
  ModifierPresetOptionStatus,
  ModifierPresetStatus,
  ProductAvailability,
  ProductStatus,
  ProductVariantStatus
} from './index';

/** Shared PUT-translation body shape -- identical across Menu/Category/Product (API_CONVENTIONS.md #108E). */
export interface TranslationInput {
  name: string;
  description?: string | null;
}

export interface CreateMenuInput {
  nameInternal: string;
  name: string;
  description?: string | null;
  status: MenuStatus;
  displayOrder: number;
}

export interface UpdateMenuInput {
  nameInternal?: string;
  name?: string;
  description?: string | null;
  status?: MenuStatus;
  displayOrder?: number;
}

export interface CreateCategoryInput {
  menuId: string;
  name: string;
  description?: string | null;
  status: CategoryStatus;
  displayOrder: number;
}

export interface UpdateCategoryInput {
  menuId?: string;
  name?: string;
  description?: string | null;
  status?: CategoryStatus;
  displayOrder?: number;
}

/** Write shape of a product discount (omit on create for none; `null` on update removes it). */
export interface ProductDiscountInput {
  enabled: boolean;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  startsOn: string | null;
  endsOn: string | null;
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  description?: string | null;
  status: ProductStatus;
  availability: ProductAvailability;
  basePrice: string;
  displayOrder: number;
  allowCustomerNotes: boolean;
  featured: boolean;
  discount?: ProductDiscountInput | null;
}

export interface UpdateProductInput {
  categoryId?: string;
  name?: string;
  description?: string | null;
  status?: ProductStatus;
  basePrice?: string;
  displayOrder?: number;
  allowCustomerNotes?: boolean;
  featured?: boolean;
  /** Omitted = unchanged; `null` = remove the discount. */
  discount?: ProductDiscountInput | null;
}

export interface CreateModifierGroupInput {
  name: string;
  helperText?: string | null;
  status: ModifierGroupStatus;
  minimumSelections: number;
  maximumSelections: number;
  displayOrder: number;
}

export interface UpdateModifierGroupInput {
  name?: string;
  helperText?: string | null;
  status?: ModifierGroupStatus;
  minimumSelections?: number;
  maximumSelections?: number;
  displayOrder?: number;
}

export interface CreateModifierOptionInput {
  name: string;
  status: ModifierOptionStatus;
  priceAdjustment: string;
  displayOrder: number;
}

export interface UpdateModifierOptionInput {
  name?: string;
  status?: ModifierOptionStatus;
  priceAdjustment?: string;
  displayOrder?: number;
}

/**
 * FT-6A closeout: Modifier Group/Option secondary-locale translation
 * requests, mirroring `getProductTranslations`/`putProductTranslation`/
 * `deleteProductTranslation` above exactly. `ModifierGroupTranslation`'s
 * second field is `helperText` (not `description`); `ModifierOptionTranslation`
 * has `name` only.
 */
export interface ModifierGroupTranslationRow {
  locale: string;
  name: string;
  helperText: string | null;
}

export interface ModifierGroupTranslationInput {
  name: string;
  helperText?: string | null;
}

export interface ModifierOptionTranslationRow {
  locale: string;
  name: string;
}

export interface ModifierOptionTranslationInput {
  name: string;
}

export interface CreateModifierPresetInput {
  name: string;
  helperText?: string | null;
  status: ModifierPresetStatus;
  minimumSelections: number;
  maximumSelections: number;
  displayOrder: number;
}

export interface UpdateModifierPresetInput {
  name?: string;
  helperText?: string | null;
  status?: ModifierPresetStatus;
  minimumSelections?: number;
  maximumSelections?: number;
  displayOrder?: number;
}

export interface CreateModifierPresetOptionInput {
  name: string;
  status: ModifierPresetOptionStatus;
  priceAdjustment: string;
  displayOrder: number;
}

export interface UpdateModifierPresetOptionInput {
  name?: string;
  status?: ModifierPresetOptionStatus;
  priceAdjustment?: string;
  displayOrder?: number;
}

export interface ModifierPresetTranslationRow {
  locale: string;
  name: string;
  helperText: string | null;
}

export interface ModifierPresetTranslationInput {
  name: string;
  helperText?: string | null;
}

export interface ModifierPresetOptionTranslationRow {
  locale: string;
  name: string;
}

export interface ModifierPresetOptionTranslationInput {
  name: string;
}

export interface CreateProductVariantInput {
  name: string;
  status: ProductVariantStatus;
  price: string;
  displayOrder: number;
  isDefault?: boolean;
  discountApplies?: boolean;
}

export interface UpdateProductVariantInput {
  name?: string;
  status?: ProductVariantStatus;
  price?: string;
  displayOrder?: number;
  isDefault?: boolean;
  discountApplies?: boolean;
}

export interface ProductVariantTranslationRow {
  locale: string;
  name: string;
}
