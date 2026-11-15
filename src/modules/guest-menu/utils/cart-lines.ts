import type { SubmitGuestOrderItem } from '../api/guest-orders';

import type { CartLine } from '../components/guest-view-types';

import { extraLabel } from '../constants/offers-copy';

import type { PublicMenuProduct, PublicOffer } from '../types/index';

import { storedItemKey, type StoredCartItem } from './cart-storage';

import {
  ZERO_MINOR_UNITS,
  fromMinorUnits,
  lineTotalMinorUnits,
  toMinorUnits,
} from './money';
import { resolveOfferLine } from './offers';
import type { PendingOrderItem } from './pending-order-attempt';

export function buildCartLines(
  cart: StoredCartItem[],
  offers: PublicOffer[],
  productById: Map<string, PublicMenuProduct>,
  categoryByProductId: Map<string, { id: string; name: string; order: number }>,
  locale: string,
): CartLine[] {
  return cart
    .map((item): CartLine | null => {
      if (item.offerId) {
        // An Offer line (DEC-069): name, rows and price always come from the CURRENT offer, never from storage.
        const resolved = resolveOfferLine(
          offers,
          { offerId: item.offerId, choices: item.offerChoices ?? [] },
          extraLabel,
          locale === 'ar' ? '، ' : ', ',
        );
        if (!resolved) return null;
        const unitPrice = resolved.unitPrice;
        return {
          lineKey: storedItemKey(item),
          productId: '',
          offerId: resolved.offer.id,
          offerChoices: item.offerChoices ?? [],
          quantity: item.quantity,
          modifierOptionIds: [],
          variantId: null,
          variantName: null,
          name: resolved.offer.name,
          category: null,
          hasModifierGroups: true,
          imageAssetPath: resolved.offer.imageAssetPath,
          unitPrice,
          lineTotal: fromMinorUnits(
            lineTotalMinorUnits(unitPrice, item.quantity),
          ),
          originalLineTotal: fromMinorUnits(
            lineTotalMinorUnits(unitPrice, item.quantity),
          ),
          discounted: false,
          selections: [],
          offerRows: resolved.rows,
          blocked: resolved.problem !== null,
          blockedReason:
            resolved.problem === 'UNAVAILABLE'
              ? resolved.offer.soldOut === true
                ? ('OFFER_SOLD_OUT' as const)
                : ('OFFER_NOT_TODAY' as const)
              : resolved.problem === 'CHANGED'
                ? ('OFFER_CHANGED' as const)
                : null,
        };
      }
      const product = productById.get(item.productId);
      if (!product) return null;

      // Resolve each selected Option's CURRENT display name/price for this
      // render -- an id the Menu no longer recognizes (Group/Option
      // deactivated or removed since being added) is simply omitted from
      // the display; the Cart line itself is left intact either way (the
      // Backend re-validates authoritatively at submission time and
      // rejects the whole Order with a guest-safe error if it's genuinely
      // no longer valid -- Section: Cart remains intact on that error).
      const selections: {
        groupName: string;
        optionName: string;
        priceAdjustment: string;
      }[] = [];
      let modifiersMinorUnits = ZERO_MINOR_UNITS;
      for (const group of product.modifierGroups) {
        for (const option of group.options) {
          if (item.modifierOptionIds.includes(option.id)) {
            selections.push({
              groupName: group.name,
              optionName: option.name,
              priceAdjustment: option.priceAdjustment,
            });
            modifiersMinorUnits += toMinorUnits(option.priceAdjustment);
          }
        }
      }
      // DEC-041: a product with sizes is priced by the size in this line (its own price and
      // discount); a size the menu no longer offers blocks the line until the Guest re-chooses.
      const sizes = product.variants ?? [];
      const size = item.variantId
        ? (sizes.find((entry) => entry.id === item.variantId) ?? null)
        : null;
      const sizeMissing = sizes.length > 0 && size === null;
      // Product Discounts V1: the discount applies to the product (or size) price only, never to
      // paid extras. Display only -- the Backend recomputes every amount on submit.
      const baseForLine = size ? size.price : product.basePrice;
      const discountedForLine = size
        ? size.discountedPrice
        : product.discount
          ? product.discount.discountedPrice
          : null;
      const discounted = discountedForLine !== null;
      const originalUnitPrice = fromMinorUnits(
        toMinorUnits(baseForLine) + modifiersMinorUnits,
      );
      const unitPrice =
        discountedForLine !== null
          ? fromMinorUnits(
              toMinorUnits(discountedForLine) + modifiersMinorUnits,
            )
          : originalUnitPrice;

      return {
        lineKey: storedItemKey(item),
        productId: item.productId,
        quantity: item.quantity,
        modifierOptionIds: item.modifierOptionIds,
        variantId: item.variantId ?? null,
        variantName: size ? size.name : null,
        name: product.name,
        category: categoryByProductId.get(item.productId) ?? null,
        hasModifierGroups:
          product.modifierGroups.length > 0 || sizes.length > 0,
        imageAssetPath: product.primaryImageAssetPath,
        unitPrice,
        lineTotal: fromMinorUnits(
          lineTotalMinorUnits(unitPrice, item.quantity),
        ),
        originalLineTotal: fromMinorUnits(
          lineTotalMinorUnits(originalUnitPrice, item.quantity),
        ),
        discounted,
        selections,
        offerId: null,
        offerChoices: [],
        blockedReason: null,
        blocked: product.availability === 'SOLD_OUT' || sizeMissing,
      };
    })
    .filter((line): line is CartLine => line !== null);
}
export const toPendingItems = (lines: CartLine[]): PendingOrderItem[] =>
  lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    modifierOptionIds: line.modifierOptionIds,
    variantId: line.variantId,
    offerId: line.offerId,
    offerChoices: line.offerChoices,
  }));
export const toSubmitItems = (lines: CartLine[]): SubmitGuestOrderItem[] =>
  lines.map((line) =>
    line.offerId
      ? {
          offerId: line.offerId,
          quantity: line.quantity,
          offerChoices: line.offerChoices,
        }
      : {
          productId: line.productId,
          quantity: line.quantity,
          modifierOptionIds: line.modifierOptionIds,
          ...(line.variantId ? { variantId: line.variantId } : {}),
        },
  );
