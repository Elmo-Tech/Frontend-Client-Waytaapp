import { type ProductDiscountInput } from './api';
import type {
  Product,
  ProductAvailability,
  ProductStatus
} from './index';

/** Mirrors the Backend's accepted decimal-string shape (money-decimal.ts) -- helpful client validation only, never authoritative (CLAUDE.md #27). */
export const MONEY_DECIMAL_PATTERN = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;

export interface ProductEditorProps {
  restaurantId: string;
  currencyCode: string;
  /** `menu.manage` AND `allBranches === true` -- the Server page already refuses to render this component at all when false; kept here only to disable controls defensively. */
  canManage: boolean;
  mode: 'create' | 'edit';
  productId?: string;
}

export interface ProductFormState {
  categoryId: string;
  name: string;
  description: string;
  status: ProductStatus;
  availability: ProductAvailability;
  basePrice: string;
  displayOrder: string;
  allowCustomerNotes: boolean;
  featured: boolean;
  /** Product Discounts V1: NONE = no discount configured. */
  discountMode: 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountEnabled: boolean;
  discountValue: string;
  discountStartsOn: string;
  discountEndsOn: string;
}

export const EMPTY_FORM: ProductFormState = {
  categoryId: '',
  name: '',
  description: '',
  status: 'ACTIVE',
  availability: 'AVAILABLE',
  basePrice: '0.00',
  displayOrder: '0',
  allowCustomerNotes: false,
  featured: false,
  discountMode: 'NONE',
  discountEnabled: true,
  discountValue: '',
  discountStartsOn: '',
  discountEndsOn: '',
};

/** The write shape for the form's discount section (`null` removes the discount). */
export function toDiscountInput(form: ProductFormState): ProductDiscountInput | null {
  if (form.discountMode === 'NONE') return null;
  return {
    enabled: form.discountEnabled,
    type: form.discountMode,
    value: form.discountValue.trim(),
    startsOn: form.discountStartsOn === '' ? null : form.discountStartsOn,
    endsOn: form.discountEndsOn === '' ? null : form.discountEndsOn,
  };
}

export function toFormState(product: Product): ProductFormState {
  return {
    categoryId: product.categoryId,
    name: product.translation.name,
    description: product.translation.description ?? '',
    status: product.status,
    availability: product.availability,
    basePrice: product.basePrice,
    displayOrder: String(product.displayOrder),
    allowCustomerNotes: product.allowCustomerNotes,
    featured: product.featured,
    discountMode: product.discount ? product.discount.type : 'NONE',
    discountEnabled: product.discount ? product.discount.enabled : true,
    discountValue: product.discount ? product.discount.value : '',
    discountStartsOn: product.discount?.startsOn ?? '',
    discountEndsOn: product.discount?.endsOn ?? '',
  };
}

/** A product added to (or moved into) a Category goes to the end of it. Drag-and-drop ordering in the Menu workspace is the way to place it elsewhere. */
export function nextDisplayOrder(products: readonly Product[], categoryId: string): number {
  let max = -1;
  for (const product of products) {
    if (product.categoryId === categoryId && product.displayOrder > max) max = product.displayOrder;
  }
  return max + 1;
}

/** One in-progress, not-yet-saved secondary-locale translation typed while creating (FT-1 correction 2, Section 4). */
export interface SecondaryDraft {
  name: string;
  description: string;
}

export type SecondaryDrafts = Record<string, SecondaryDraft>;
