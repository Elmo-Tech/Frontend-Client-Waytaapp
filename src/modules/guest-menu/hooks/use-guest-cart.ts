'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { extraLabel } from '../constants/offers-copy';
import type { PublicMenuProduct, PublicOffer } from '../types/index';
import type { PublicMenuViewProps } from '../types/menu-view';
import { MAX_QUANTITY } from '../types/menu-view-constants';
import {
  cartLineKey,
  loadCart,
  offerLineIdentity,
  saveCart,
  storedItemKey,
  type StoredCartItem,
} from '../utils/cart-storage';

import {
  MAX_OFFER_QUANTITY,
  resolveOfferLine,
  type OfferPick,
} from '../utils/offers';
import {
  clearPendingAttempt,
  payloadMatchesPendingAttempt,
  type PendingOrderCheckout,
} from '../utils/pending-order-attempt';

import { fetchSuggestions } from '../utils/suggestions';

interface GuestCartOptions {
  data: PublicMenuViewProps['data'];
  publicCode: string;
  productById: Map<string, PublicMenuProduct>;
  offers: PublicOffer[];
  checkoutKey: string;
  isCartOpen: boolean;
}
export function useGuestCart({
  data,
  publicCode,
  productById,
  offers,
  checkoutKey,
  isCartOpen,
}: GuestCartOptions) {
  const [cart, setCart] = useState<StoredCartItem[]>([]);
  const [hasHydratedCart, setHasHydratedCart] = useState(false);
  const [sheetProduct, setSheetProduct] = useState<PublicMenuProduct | null>(
    null,
  );
  // Set while the sheet is open from a cart row's "Edit": the line being replaced and its starting state.
  const [editing, setEditing] = useState<{
    lineKey: string;
    selectedByGroup: Record<string, string[]>;
    quantity: number;
    variantId: string | null;
  } | null>(null);

  // Section 21: load once on mount (localStorage does not exist during SSR)
  // and reconcile immediately against the CURRENT Menu response -- a stored
  // productId the current Menu no longer has at all (deleted/hidden) is
  // dropped outright, never blindly resubmitted.
  useEffect(() => {
    // `queueMicrotask` here is purely to satisfy eslint-plugin-react-hooks'
    // `set-state-in-effect` rule (same established pattern used elsewhere
    // in this repo, e.g. `MenuWorkspace`'s mount effect) -- it has nothing
    // to do with the reconciliation itself, which still runs essentially
    // immediately on mount.
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const stored = loadCart(publicCode);
      // An Offer line (DEC-069) stays only while the current menu still offers that offer; its choices are
      // re-checked against the offer when the lines are built (a changed offer blocks the line, never silently drops it).
      const reconciled = stored.filter((item) =>
        item.offerId
          ? offers.some((offer) => offer.id === item.offerId)
          : productById.has(item.productId),
      );
      setCart(reconciled);
      if (reconciled.length !== stored.length) {
        saveCart(publicCode, reconciled);
      }
      setHasHydratedCart(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on mount/publicCode change, not on every productById identity change (that would fight the User's own in-progress edits).
  }, [publicCode]);

  // FT-5 critical fix: whenever the Cart no longer matches whatever payload
  // the persisted pending submission attempt (if any) was generated for,
  // drop that attempt -- the next "Place Order" must get a fresh
  // `clientRequestId` rather than reusing one that belonged to different
  // items/quantities (see `pending-order-attempt.ts`). Gated on
  // `hasHydratedCart` so this never fires against the transient initial
  // `cart === []` render BEFORE the real persisted Cart has loaded, which
  // would otherwise wipe out a still-valid pending attempt on every mount.
  useEffect(() => {
    if (!hasHydratedCart) return;
    const items = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      modifierOptionIds: item.modifierOptionIds,
      variantId: item.variantId ?? null,
      offerId: item.offerId ?? null,
      offerChoices: item.offerChoices ?? [],
    }));
    const currentCheckout = JSON.parse(
      checkoutKey,
    ) as PendingOrderCheckout | null;
    if (!payloadMatchesPendingAttempt(publicCode, items, currentCheckout)) {
      clearPendingAttempt(publicCode);
    }
  }, [cart, publicCode, hasHydratedCart, checkoutKey]);

  // Every Cart mutation goes through this one helper, which always reads
  // the LATEST `cart` state (via the functional `setState` form) and
  // persists the result -- safe even across rapid successive clicks.
  // (Stable identity: the memoized menu below depends on the handlers.)
  const updateCart = useCallback(
    (updater: (prev: StoredCartItem[]) => StoredCartItem[]) => {
      setCart((prev) => {
        const next = updater(prev);
        saveCart(publicCode, next);
        return next;
      });
    },
    [publicCode],
  );

  // FT-6A: Cart identity is (productId + selected modifierOptionIds), not
  // productId alone -- "Burger + Cheese" and "Burger + Bacon" are two
  // genuinely distinct lines. Every quantity control keys off this same
  // `cartLineKey`, never `productId` in isolation.
  const { simpleQuantityByProductId, totalQuantityByProductId } =
    useMemo(() => {
      const simple = new Map<string, number>();
      const total = new Map<string, number>();
      for (const item of cart) {
        if (item.offerId) continue; // Offer lines have no product card to count on.
        total.set(
          item.productId,
          (total.get(item.productId) ?? 0) + item.quantity,
        );
        if (item.modifierOptionIds.length === 0 && !item.variantId)
          simple.set(item.productId, item.quantity);
      }
      return {
        simpleQuantityByProductId: simple,
        totalQuantityByProductId: total,
      };
    }, [cart]);

  /** Adds `quantity` of `productId` with the given selections -- merges into an existing line with the SAME selections, otherwise starts a new distinct line. */
  const addLine = useCallback(
    (
      productId: string,
      modifierOptionIds: string[],
      quantity = 1,
      variantId: string | null = null,
    ) => {
      const key = cartLineKey(productId, modifierOptionIds, variantId);
      updateCart((prev) => {
        const current = prev.find((item) => storedItemKey(item) === key);
        if (!current) {
          return [
            ...prev,
            {
              productId,
              quantity: Math.min(quantity, MAX_QUANTITY),
              modifierOptionIds,
              variantId,
            },
          ];
        }
        return prev.map((item) =>
          storedItemKey(item) === key
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, MAX_QUANTITY),
              }
            : item,
        );
      });
    },
    [updateCart],
  );

  /** The card's quick-add: a Product with Modifier Groups never adds blindly (it opens the sheet); one with none adds a plain no-selection line. */
  const handleQuickAdd = useCallback(
    (product: PublicMenuProduct) => {
      if (
        product.modifierGroups.length > 0 ||
        (product.variants?.length ?? 0) > 0
      ) {
        setSheetProduct(product);
        return;
      }
      addLine(product.id, []);
    },
    [addLine, setSheetProduct],
  );

  // "Complete your meal" (DEC-042): ask the Backend what goes with the cart while the cart is open.
  // The answer is product ids of this very menu; a failed request just means no suggestions.
  const suggestionsOn = data.context.suggestions === true;
  const cartProductKey = useMemo(
    () =>
      [
        ...new Set(
          cart.filter((item) => !item.offerId).map((item) => item.productId),
        ),
      ]
        .sort()
        .join(','),
    [cart],
  );
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);
  useEffect(() => {
    if (!suggestionsOn || !isCartOpen || cartProductKey === '') return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchSuggestions(publicCode, cartProductKey.split(',')).then(
        (ids) => {
          if (!cancelled) setSuggestionIds(ids);
        },
      );
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [suggestionsOn, isCartOpen, cartProductKey, publicCode]);
  const suggestedProducts = useMemo(() => {
    if (!suggestionsOn || !isCartOpen || cartProductKey === '') return [];
    const inCart = new Set(cartProductKey.split(','));
    return suggestionIds
      .map((id) => productById.get(id))
      .filter(
        (product): product is PublicMenuProduct =>
          product !== undefined &&
          product.availability !== 'SOLD_OUT' &&
          !inCart.has(product.id),
      );
  }, [suggestionsOn, isCartOpen, cartProductKey, suggestionIds, productById]);

  const handleOpenProduct = useCallback(
    (product: PublicMenuProduct) => setSheetProduct(product),
    [setSheetProduct],
  );

  function handleConfirmOptions(
    selectedOptionIds: string[],
    quantity: number,
    variantId: string | null = null,
  ) {
    if (!sheetProduct) return;
    if (editing) {
      replaceLine(
        editing.lineKey,
        sheetProduct.id,
        selectedOptionIds,
        quantity,
        variantId,
      );
    } else {
      addLine(sheetProduct.id, selectedOptionIds, quantity, variantId);
    }
    closeSheet();
  }

  function closeSheet() {
    setSheetProduct(null);
    setEditing(null);
  }

  /**
   * "Edit" on a cart row: the line's identity is (product + selected options), so editing is
   * replacing it -- the old line is swapped, in place, for the new selection (and merged into an
   * existing line when the new selection already exists). The cart's identity rules are unchanged.
   */
  function replaceLine(
    oldKey: string,
    productId: string,
    modifierOptionIds: string[],
    quantity: number,
    variantId: string | null = null,
  ) {
    const newKey = cartLineKey(productId, modifierOptionIds, variantId);
    updateCart((prev) => {
      const index = prev.findIndex((item) => storedItemKey(item) === oldKey);
      if (index === -1) return prev;
      const rest = prev.filter((_, position) => position !== index);
      const existing = rest.findIndex((item) => storedItemKey(item) === newKey);
      if (existing !== -1) {
        return rest.map((item, position) =>
          position === existing
            ? {
                ...item,
                quantity: Math.min(item.quantity + quantity, MAX_QUANTITY),
              }
            : item,
        );
      }
      const replacement = {
        productId,
        quantity: Math.min(quantity, MAX_QUANTITY),
        modifierOptionIds,
        variantId,
      };
      return [...rest.slice(0, index), replacement, ...rest.slice(index)];
    });
  }

  // ---- Offers (DEC-069) ----
  // The Offer open in its choice sheet, and -- when opened from a cart row -- the line being replaced.
  const [sheetOffer, setSheetOffer] = useState<PublicOffer | null>(null);
  const [editingOffer, setEditingOffer] = useState<{
    lineKey: string;
    choices: OfferPick[];
    quantity: number;
  } | null>(null);

  const handleOpenOffer = useCallback(
    (offer: PublicOffer) => setSheetOffer(offer),
    [],
  );

  function closeOfferSheet() {
    setSheetOffer(null);
    setEditingOffer(null);
  }

  /** Adds `quantity` copies of the offer with these exact choices (an identical line is merged, a different choice is its own line). */
  const addOfferLine = useCallback(
    (offerId: string, choices: OfferPick[], quantity: number) => {
      const key = offerLineIdentity(offerId, choices);
      updateCart((prev) => {
        if (prev.some((item) => storedItemKey(item) === key)) {
          return prev.map((item) =>
            storedItemKey(item) === key
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + quantity,
                    MAX_OFFER_QUANTITY,
                  ),
                }
              : item,
          );
        }
        return [
          ...prev,
          {
            productId: '',
            quantity: Math.min(quantity, MAX_OFFER_QUANTITY),
            modifierOptionIds: [],
            variantId: null,
            offerId,
            offerChoices: choices,
          },
        ];
      });
    },
    [updateCart],
  );

  function handleConfirmOffer(choices: OfferPick[], quantity: number) {
    if (!sheetOffer) return;
    if (editingOffer) {
      // Editing replaces the line in place (its identity is the offer plus its choices).
      const oldKey = editingOffer.lineKey;
      const newKey = offerLineIdentity(sheetOffer.id, choices);
      const offerId = sheetOffer.id;
      updateCart((prev) => {
        const index = prev.findIndex((item) => storedItemKey(item) === oldKey);
        if (index === -1) return prev;
        const rest = prev.filter((_, position) => position !== index);
        const existing = rest.findIndex(
          (item) => storedItemKey(item) === newKey,
        );
        if (existing !== -1) {
          return rest.map((item, position) =>
            position === existing
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + quantity,
                    MAX_OFFER_QUANTITY,
                  ),
                }
              : item,
          );
        }
        const replacement: StoredCartItem = {
          productId: '',
          quantity: Math.min(quantity, MAX_OFFER_QUANTITY),
          modifierOptionIds: [],
          variantId: null,
          offerId,
          offerChoices: choices,
        };
        return [...rest.slice(0, index), replacement, ...rest.slice(index)];
      });
    } else {
      addOfferLine(sheetOffer.id, choices, quantity);
    }
    closeOfferSheet();
  }

  function handleEditLine(lineKey: string) {
    const item = cart.find((entry) => storedItemKey(entry) === lineKey);
    if (item?.offerId) {
      const offer = offers.find((candidate) => candidate.id === item.offerId);
      if (!offer) return;
      // A changed offer starts the choice again; an unchanged one reopens with the same choices.
      const resolved = resolveOfferLine(
        offers,
        { offerId: offer.id, choices: item.offerChoices ?? [] },
        extraLabel,
      );
      setEditingOffer({
        lineKey,
        choices:
          resolved?.problem === 'CHANGED' ? [] : (item.offerChoices ?? []),
        quantity: item.quantity,
      });
      setSheetOffer(offer);
      return;
    }
    const product = item ? productById.get(item.productId) : undefined;
    if (!item || !product) return;
    const selectedByGroup: Record<string, string[]> = {};
    for (const group of product.modifierGroups) {
      selectedByGroup[group.id] = group.options
        .filter((option) => item.modifierOptionIds.includes(option.id))
        .map((option) => option.id);
    }
    setEditing({
      lineKey,
      selectedByGroup,
      quantity: item.quantity,
      variantId: item.variantId ?? null,
    });
    setSheetProduct(product);
  }

  const handleIncrement = useCallback(
    (lineKey: string) => {
      updateCart((prev) =>
        prev.map((item) =>
          storedItemKey(item) === lineKey
            ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) }
            : item,
        ),
      );
    },
    [updateCart],
  );

  const handleDecrement = useCallback(
    (lineKey: string) => {
      updateCart((prev) =>
        prev
          .map((item) =>
            storedItemKey(item) === lineKey
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          )
          .filter((item) => item.quantity > 0),
      );
    },
    [updateCart],
  );

  function handleRemove(lineKey: string) {
    updateCart((prev) =>
      prev.filter((item) => storedItemKey(item) !== lineKey),
    );
  }

  // The product cards only ever touch the no-selection line of a simple product.
  const handleCardIncrement = useCallback(
    (productId: string) => handleIncrement(cartLineKey(productId, [])),
    [handleIncrement],
  );
  const handleCardDecrement = useCallback(
    (productId: string) => handleDecrement(cartLineKey(productId, [])),
    [handleDecrement],
  );
  // An offer that vanished from the menu (switched off, deleted, expired) after the page loaded: drop its cart line.
  useEffect(() => {
    if (!hasHydratedCart) return;
    if (
      !cart.some(
        (item) =>
          item.offerId && !offers.some((offer) => offer.id === item.offerId),
      )
    )
      return;
    queueMicrotask(() =>
      updateCart((prev) =>
        prev.filter(
          (item) =>
            !item.offerId || offers.some((offer) => offer.id === item.offerId),
        ),
      ),
    );
  }, [offers, hasHydratedCart, cart, updateCart]);

  return {
    cart,
    setCart,
    sheetProduct,
    editing,
    simpleQuantityByProductId,
    totalQuantityByProductId,
    handleQuickAdd,
    suggestedProducts,
    handleOpenProduct,
    handleConfirmOptions,
    closeSheet,
    sheetOffer,
    editingOffer,
    handleOpenOffer,
    closeOfferSheet,
    handleConfirmOffer,
    handleEditLine,
    handleIncrement,
    handleDecrement,
    handleRemove,
    handleCardIncrement,
    handleCardDecrement,
  };
}
