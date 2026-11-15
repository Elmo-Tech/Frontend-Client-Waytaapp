'use client';
import {
  createExclusiveTask,
  createRequestSequence,
} from '../../../lib/utils/async-control';
import { useGuestCart } from './use-guest-cart';

import { useGuestOrderSubmission } from './use-guest-order-submission';
import { useGuestCheckout } from './use-guest-checkout';

import { buildCartLines } from '../utils/cart-lines';
import { useMenuDesignPreview } from './use-menu-design-preview';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_MENU_TEMPLATE,
  layoutOf,
} from '../../../config/menu-templates';
import { resolveAssetUrl } from '../../../lib/infrastructure/asset-url';
import { getTableOrdering, type WhatsappOrderView } from '../api/guest-orders';
import { type ChipItem } from '../components/CategoryChips';
import { type OrderingRecheckStatus } from '../components/TableClosedNotice';
import type { OrderingContextView } from '../components/guest-view-types';

import {
  FEATURED_SECTION_ID,
  useMenuNavigation,
} from '../components/useMenuNavigation';

import { getPublicMenuCopy } from '../constants/copy';

import { getOffersCopy } from '../constants/offers-copy';

import type { GuestOrderView, PublicMenuProduct } from '../types/index';
import type { PublicMenuViewProps } from '../types/menu-view';

import { saveCart } from '../utils/cart-storage';

import {
  ZERO_MINOR_UNITS,
  fromMinorUnits,
  lineTotalMinorUnits,
  toMinorUnits,
} from '../utils/money';
import { OFFERS_SECTION_ID } from '../utils/offers';

import { currencyLabel, formatAmount } from '../utils/price-format';
import { matchesSearch, normalizeForSearch } from '../utils/search';

import { readTrackedOrders } from '../utils/tracking';

export function usePublicMenuController({
  data,
  publicCode,
  template = DEFAULT_MENU_TEMPLATE,
  designPreview = false,
  exclusiveRendererKey,
}: PublicMenuViewProps) {
  const locale = data.locale.resolved;
  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';
  const currency = data.context.restaurant.currencyCode;
  const logoUrl = resolveAssetUrl(data.context.restaurant.logoAssetPath);
  const coverUrl = resolveAssetUrl(data.context.restaurant.coverAssetPath);
  const copy = getPublicMenuCopy(locale);
  const {
    emberSettings,
    bloomSettings,
    brewSettings,
    editorialSettings,
    isVerde,
    verdeSettings,
    isSherbiny,
    sherbinySettings,
    isMakkboz,
    makkbozSettings,
    isMeatLovers,
    meatLoversSettings,
  } = useMenuDesignPreview({
    data,
    template,
    designPreview,
    exclusiveRendererKey,
  });
  const hasCategories = data.menu.categories.length > 0;
  // Both premium demo references show one category at a time.
  // Search results still span all categories so no matching products disappear.
  const [premiumCategoryId, setPremiumCategoryId] = useState(
    data.menu.categories[0]?.id ?? '',
  );
  // FT-7/FT-8: a TABLE QR orders exactly as before (DINE_IN); a GENERIC QR
  // orders for Pickup or Delivery, each only while at least one Branch is
  // eligible for it (Delivery: an ACTIVE Branch with an ACTIVE zone).
  const isGenericQr = data.context.qrType === 'GENERIC';
  const pickupBranches = useMemo(
    () => data.context.pickupBranches ?? [],
    [data.context.pickupBranches],
  );
  const deliveryBranches = useMemo(
    () => data.context.deliveryBranches ?? [],
    [data.context.deliveryBranches],
  );
  const pickupAvailable = pickupBranches.length > 0;
  const deliveryAvailable = deliveryBranches.length > 0;
  // DEC-038: a Table channel the Restaurant switched off is a view-only menu. The page value
  // is advisory; a refused order (ORDERING_DISABLED) or "Check again" can also set it.
  const [serverOrderingDisabled, setServerOrderingDisabled] = useState(false);
  const tableChannelDisabled =
    !isGenericQr &&
    (data.context.tableOrdering === 'DISABLED' || serverOrderingDisabled);
  const canOrder = isGenericQr
    ? pickupAvailable || deliveryAvailable
    : !tableChannelDisabled;

  const orderingContext: OrderingContextView = {
    kind: isGenericQr ? 'GENERIC' : 'TABLE',
    tableNumber: data.context.table?.number ?? null,
    branchName: data.context.branch?.name ?? null,
    pickupAvailable,
    deliveryAvailable,
  };

  // The hero names a branch only when exactly one applies (a table's own branch, or the
  // single branch a generic QR can order from).
  const branchLine = useMemo(() => {
    if (!isGenericQr) return data.context.branch?.name ?? null;
    const unique = new Map<string, string>();
    for (const branch of [...pickupBranches, ...deliveryBranches])
      unique.set(branch.id, branch.name);
    return unique.size === 1 ? [...unique.values()][0] : null;
  }, [isGenericQr, data.context.branch, pickupBranches, deliveryBranches]);

  const productById = useMemo(() => {
    const products = new Map<string, PublicMenuProduct>();
    for (const category of data.menu.categories) {
      for (const product of category.products)
        products.set(product.id, product);
    }
    return products;
  }, [data.menu.categories]);

  // Re-resolve category names and menu order from the CURRENT public payload,
  // just like product names. Never persist or submit category metadata as cart truth.
  const categoryByProductId = useMemo(() => {
    const categories = new Map<
      string,
      { id: string; name: string; order: number }
    >();
    data.menu.categories.forEach((category, order) => {
      for (const product of category.products) {
        categories.set(product.id, {
          id: category.id,
          name: category.name,
          order,
        });
      }
    });
    return categories;
  }, [data.menu.categories]);

  // Offers / Bundles (DEC-069): fixed-price packages with choices. With at least one active offer the top strip shows
  // them INSTEAD of the featured products (which come back when there are none), and the first chip jumps there.
  const offers = useMemo(
    () => data.context.offers ?? [],
    [data.context.offers],
  );
  const offersCopy = getOffersCopy(locale);
  const hasOffers = offers.length > 0;

  // The template decides the header, the cards, the headings and the category strip (DEC-044).
  // Photo-free templates show no photos anywhere (cards, cart, product page, featured banners).
  const layout = layoutOf(template);
  const showPhotos =
    isVerde || isSherbiny || isMakkboz || isMeatLovers || layout.photos;

  // "Our picks": featured, still available, with a photo (the banner needs one). Photo banners do
  // not exist in the photo-free template; a featured dish still carries its "Featured" tag there.
  const featuredProducts = useMemo(
    () =>
      showPhotos && layout.featured
        ? data.menu.categories
            .flatMap((category) => category.products)
            .filter(
              (product) =>
                product.featured &&
                product.availability !== 'SOLD_OUT' &&
                product.primaryImageAssetPath !== null,
            )
        : [],
    [data.menu.categories, showPhotos, layout.featured],
  );

  // ---- search (client-side, over the already-loaded Menu) ----
  const [query, setQuery] = useState('');
  const normalizedQuery = normalizeForSearch(query);
  const isSearching = normalizedQuery !== '';
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const product of productById.values()) {
      index.set(
        product.id,
        normalizeForSearch(`${product.name} ${product.description ?? ''}`),
      );
    }
    return index;
  }, [productById]);
  const visibleCategories = useMemo(() => {
    if (!isSearching) return data.menu.categories;
    return data.menu.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) =>
          matchesSearch(searchIndex.get(product.id) ?? '', normalizedQuery),
        ),
      }))
      .filter((category) => category.products.length > 0);
  }, [data.menu.categories, isSearching, normalizedQuery, searchIndex]);
  const isPremiumSingleCategory =
    isVerde ||
    isSherbiny ||
    isMakkboz ||
    isMeatLovers ||
    template === 'ember' ||
    template === 'bloom' ||
    template === 'brew';
  const premiumVisibleCategories =
    isPremiumSingleCategory && !isSearching
      ? visibleCategories.filter(
          (category) => category.id === premiumCategoryId,
        )
      : visibleCategories;
  const searchResultCount = visibleCategories.reduce(
    (sum, category) => sum + category.products.length,
    0,
  );

  const showOffers = hasOffers && !isSearching;
  // The featured strip gives its place to the offers while there are any.
  const showFeatured =
    featuredProducts.length > 0 && !isSearching && !hasOffers;
  const scrollToOffers = () => {
    document.getElementById(`category-${OFFERS_SECTION_ID}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });
  };
  const selectPremiumCategory = (id: string) => {
    // The "Offers" chip is not a category: it scrolls to the strip at the top and keeps the shown category.
    if (id === OFFERS_SECTION_ID) {
      setQuery('');
      window.requestAnimationFrame(scrollToOffers);
      return;
    }
    // Category content switches in place, unlike normal templates which jump to an anchored section.
    // Clear search first so every category is selectable, then keep the chip strip at the top.
    setQuery('');
    setPremiumCategoryId(id);
    window.requestAnimationFrame(() => {
      const anchor = document.getElementById('premium-menu-start');
      if (!anchor) return;
      anchor.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    });
  };
  const navigation = useMenuNavigation(
    [
      ...(hasOffers
        ? [OFFERS_SECTION_ID]
        : featuredProducts.length > 0
          ? [FEATURED_SECTION_ID]
          : []),
      ...data.menu.categories.map((category) => category.id),
    ],
    isSearching,
  );
  const chipItems: ChipItem[] = [
    ...(showOffers
      ? [
          {
            id: OFFERS_SECTION_ID,
            name: offersCopy.sectionTitle,
            imageUrl: null,
            isOffers: true,
          },
        ]
      : []),
    ...(showFeatured
      ? [
          {
            id: FEATURED_SECTION_ID,
            name: copy.ourPicks,
            imageUrl: null,
            isFeatured: true,
          },
        ]
      : []),
    ...data.menu.categories.map((category) => ({
      id: category.id,
      name: category.name,
      imageUrl: showPhotos ? resolveAssetUrl(category.imageAssetPath) : null,
    })),
  ];

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Table Sessions: staff can close ordering for a TABLE QR. The server-rendered value is
  // advisory; a 409 from the order endpoint or "Check again" overrides it. Never applies to
  // Pickup/Delivery (GENERIC QR).
  const [orderingOverride, setOrderingOverride] = useState<
    'AVAILABLE' | 'CLOSED' | null
  >(null);
  const [isRecheckingOrdering, setIsRecheckingOrdering] = useState(false);
  const [orderingRecheck, setOrderingRecheck] =
    useState<OrderingRecheckStatus>('idle');
  const tableOrdering =
    orderingOverride ??
    (data.context.tableOrdering === 'CLOSED' ? 'CLOSED' : 'AVAILABLE');
  const tableLocked = !isGenericQr && tableOrdering === 'CLOSED';
  const [confirmedOrder, setConfirmedOrder] = useState<GuestOrderView | null>(
    null,
  );
  // FT-7/FT-8 checkout state -- kept here (not inside the Cart panel) so it
  // survives closing/reopening the panel and a failed submission. The hero's mode
  // switch and the checkout's switch both read/write `requestedFulfillment`: one
  // source of truth.
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [whatsappHandoff, setWhatsappHandoff] =
    useState<WhatsappOrderView | null>(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  useEffect(() => {
    // Read after mount so the server render and the first client render are identical.
    queueMicrotask(() =>
      setHasActiveOrder(readTrackedOrders(publicCode).length > 0),
    );
  }, [publicCode]);
  const {
    setSelectedBranchId,
    setSelectedZoneId,
    fields,
    setFields,
    fulfillment,
    isDelivery,
    eligibleBranches,
    resolvedBranchId,
    zones,
    resolvedZoneId,
    selectedZone,
    validation,
    checkout,
    handleFulfillmentChange,
  } = useGuestCheckout(data);
  // A stable primitive for effect dependencies (the object above is new every render).
  const checkoutKey = JSON.stringify(checkout);
  // The Product open in the customizer sheet -- null means no sheet is open.
  // Any available Product can open it (it shows the dish and a quantity); a
  // Product with Modifier Groups always opens it before adding.
  const {
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
  } = useGuestCart({
    data,
    publicCode,
    productById,
    offers,
    checkoutKey,
    isCartOpen,
  });
  const handleClearSearch = useCallback(() => setQuery(''), [setQuery]);

  /** The sticky bar's search button: back to the top, then into the first visible search field. */
  const handleJumpToSearch = useCallback(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    window.setTimeout(
      () => {
        const fieldsInPage = Array.from(
          document.querySelectorAll<HTMLInputElement>('[data-guest-search]'),
        );
        fieldsInPage
          .find((field) => field.offsetParent !== null)
          ?.focus({ preventScroll: true });
      },
      reduced ? 0 : 450,
    );
  }, []);

  const cartLines = buildCartLines(
    cart,
    offers,
    productById,
    categoryByProductId,
    locale,
  );

  const orderableLines = cartLines.filter((line) => !line.blocked);
  const hasBlockedLines = cartLines.some((line) => line.blocked);
  const totalMinorUnits = orderableLines.reduce(
    (sum, line) => sum + lineTotalMinorUnits(line.unitPrice, line.quantity),
    ZERO_MINOR_UNITS,
  );
  const totalDisplay = fromMinorUnits(totalMinorUnits);
  const originalTotalMinorUnits = orderableLines.reduce(
    (sum, line) => sum + toMinorUnits(line.originalLineTotal),
    ZERO_MINOR_UNITS,
  );
  const discountDisplay =
    originalTotalMinorUnits > totalMinorUnits
      ? fromMinorUnits(originalTotalMinorUnits - totalMinorUnits)
      : null;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // FT-8 display-only breakdown (exact BigInt minor units). The Backend
  // recomputes the fee, minimum and total from the zone row on submit.
  const deliveryFeeMinorUnits = selectedZone
    ? toMinorUnits(selectedZone.deliveryFee)
    : ZERO_MINOR_UNITS;
  const deliveryFeeDisplay = fromMinorUnits(deliveryFeeMinorUnits);
  const grandTotalDisplay = fromMinorUnits(
    totalMinorUnits + deliveryFeeMinorUnits,
  );
  const belowMinimum =
    selectedZone !== null &&
    totalMinorUnits < toMinorUnits(selectedZone.minimumOrder);
  // Money inside sentences uses the Guest display format ("100 ج.م" / "100 EGP").
  const unitLabel = currencyLabel(currency, locale);
  const minimumMessage =
    selectedZone !== null && belowMinimum
      ? copy.minimumOrderMessage(
          selectedZone.name,
          formatAmount(selectedZone.minimumOrder),
          unitLabel,
        )
      : null;
  const minimumShortfallDisplay =
    selectedZone !== null && belowMinimum
      ? copy.minimumShortfall(
          formatAmount(
            fromMinorUnits(
              toMinorUnits(selectedZone.minimumOrder) - totalMinorUnits,
            ),
          ),
          unitLabel,
        )
      : null;
  // Branch, delivery area and the minimum order block the button with a reason. The typed
  // fields (name, phone, address ...) do not: tapping send shows each problem under its field.
  const checkoutDetailsComplete =
    !isGenericQr ||
    (resolvedBranchId !== null &&
      (!isDelivery || (resolvedZoneId !== null && !belowMinimum)));
  // Opening hours (DEC-042): a closed Branch takes no Pickup / Delivery orders. Advisory
  // here; the Backend refuses with BRANCH_CLOSED either way.
  const branchClosed =
    isGenericQr &&
    eligibleBranches.find((branch) => branch.id === resolvedBranchId)?.hours
      ?.open === false;
  const canSubmit =
    cartLines.length > 0 &&
    !hasBlockedLines &&
    !isSubmitting &&
    checkoutDetailsComplete &&
    !branchClosed &&
    !tableLocked;
  // WhatsApp ordering (DEC-042): while it is on, a Restaurant QR order is sent to the Restaurant on
  // WhatsApp INSTEAD of the dashboard (which kinds of order are offered is still the Restaurant's switches).
  // Order tracking: off with the platform feature (DEC-043), and meaningless for WhatsApp orders
  // (nothing is stored, so there is no status to show).
  const trackingAvailable =
    data.context.tracking !== false &&
    !(isGenericQr && data.context.ordering?.whatsapp);
  const whatsappAction =
    isGenericQr && data.context.ordering?.whatsapp
      ? { onSend: () => void handleSendWhatsapp() }
      : null;

  // Why the primary action is unavailable, in words (shown instead of a silently greyed button).
  // A locked table shows its own dedicated notice instead of this one-line hint.
  const submitHint = tableLocked
    ? null
    : hasBlockedLines
      ? copy.placeOrderHintBlocked
      : branchClosed
        ? copy.branchClosedHint
        : !checkoutDetailsComplete && !belowMinimum
          ? isDelivery && resolvedBranchId !== null
            ? copy.deliveryAreaError
            : copy.pickupBranchError
          : null;

  // "Check again": re-read the advisory availability. Failure is shown as such -- never
  // silently treated as open or closed; the order endpoint stays the authority.
  const [availabilityChecks] = useState(createExclusiveTask);
  const [availabilityReads] = useState(createRequestSequence);
  const recheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      availabilityReads.invalidate();
      if (recheckTimer.current !== null) clearTimeout(recheckTimer.current);
    },
    [publicCode, availabilityReads],
  );
  const checkOrderingAgain = useCallback(async () => {
    if (isGenericQr) return;
    await availabilityChecks.run(async () => {
      const isCurrent = availabilityReads.next();
      if (recheckTimer.current !== null) clearTimeout(recheckTimer.current);
      setIsRecheckingOrdering(true);
      try {
        const result = await getTableOrdering(publicCode);
        if (!isCurrent()) return;
        if (result === 'unknown') {
          setOrderingRecheck('failed');
          return;
        }
        if (result === 'DISABLED') {
          setServerOrderingDisabled(true);
          return;
        }
        setOrderingOverride(result);
        setSubmitError(null);
        if (result === 'CLOSED') {
          setOrderingRecheck('stillClosed');
          return;
        }
        setOrderingRecheck('reopened');
        recheckTimer.current = setTimeout(() => {
          if (isCurrent()) setOrderingRecheck('idle');
        }, 8000);
      } finally {
        if (isCurrent()) setIsRecheckingOrdering(false);
      }
    });
  }, [
    isGenericQr,
    publicCode,
    availabilityChecks,
    availabilityReads,
    setIsRecheckingOrdering,
    setOrderingRecheck,
    setServerOrderingDisabled,
    setOrderingOverride,
    setSubmitError,
  ]);

  // A phone often sleeps on the table: re-check when the page becomes visible again.
  useEffect(() => {
    if (!tableLocked) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkOrderingAgain();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tableLocked, checkOrderingAgain]);

  const { handlePlaceOrder, handleSendWhatsapp } = useGuestOrderSubmission({
    canSubmit,
    validation,
    copy,
    offersCopy,
    publicCode,
    orderableLines,
    checkout,
    data,
    isDelivery,
    grandTotalDisplay,
    totalDisplay,
    selectedZone,
    unitLabel,
    persistCartCleared,
    setIsSubmitting,
    setSubmitError,
    setHasActiveOrder,
    setConfirmedOrder,
    setWhatsappHandoff,
    setOrderingOverride,
    setOrderingRecheck,
    setServerOrderingDisabled,
  });

  function openTracking() {
    setIsCartOpen(false);
    setConfirmedOrder(null);
    setIsTrackOpen(true);
  }

  function persistCartCleared() {
    setCart([]);
    saveCart(publicCode, []);
  }

  function closeCart() {
    setIsCartOpen(false);
    setWhatsappHandoff(null);
    if (confirmedOrder) {
      setConfirmedOrder(null);
      setSubmitError(null);
    }
  }

  const showCartBar = canOrder && cartCount > 0;
  const showModeSwitch = isGenericQr && (pickupAvailable || deliveryAvailable);
  const cartBarModeLabel = isGenericQr
    ? fulfillment === 'DELIVERY'
      ? copy.delivery
      : copy.pickup
    : `${copy.table} ${data.context.table?.number ?? ''}`.trim();

  const emberHeroProduct =
    data.menu.categories
      .flatMap((category) => category.products)
      .find(
        (product) =>
          product.featured &&
          product.primaryImageAssetPath &&
          product.availability !== 'SOLD_OUT',
      ) ??
    data.menu.categories
      .flatMap((category) => category.products)
      .find(
        (product) =>
          product.primaryImageAssetPath && product.availability !== 'SOLD_OUT',
      );
  const emberAutoPhotoUrl = resolveAssetUrl(
    emberHeroProduct?.primaryImageAssetPath ?? null,
  );
  const emberPhotoUrl =
    emberSettings.heroImageMode === 'CUSTOM' && emberSettings.heroImageAssetPath
      ? resolveAssetUrl(emberSettings.heroImageAssetPath)
      : emberAutoPhotoUrl;
  return {
    locale,
    dir,
    currency,
    logoUrl,
    coverUrl,
    copy,
    emberSettings,
    bloomSettings,
    brewSettings,
    editorialSettings,
    isVerde,
    verdeSettings,
    isSherbiny,
    sherbinySettings,
    isMakkboz,
    makkbozSettings,
    isMeatLovers,
    meatLoversSettings,
    hasCategories,
    premiumCategoryId,
    isGenericQr,
    pickupAvailable,
    deliveryAvailable,
    canOrder,
    orderingContext,
    branchLine,
    offers,
    offersCopy,
    layout,
    showPhotos,
    featuredProducts,
    query,
    setQuery,
    isSearching,
    visibleCategories,
    isPremiumSingleCategory,
    premiumVisibleCategories,
    searchResultCount,
    showOffers,
    showFeatured,
    selectPremiumCategory,
    navigation,
    chipItems,
    isCartOpen,
    setIsCartOpen,
    isSubmitting,
    submitError,
    isRecheckingOrdering,
    orderingRecheck,
    tableLocked,
    confirmedOrder,
    setSelectedBranchId,
    isTrackOpen,
    setIsTrackOpen,
    whatsappHandoff,
    hasActiveOrder,
    setHasActiveOrder,
    setSelectedZoneId,
    fields,
    setFields,
    fulfillment,
    isDelivery,
    eligibleBranches,
    resolvedBranchId,
    zones,
    resolvedZoneId,
    selectedZone,
    validation,
    checkout,
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
    handleClearSearch,
    handleJumpToSearch,
    cartLines,
    totalDisplay,
    discountDisplay,
    cartCount,
    deliveryFeeDisplay,
    grandTotalDisplay,
    minimumMessage,
    minimumShortfallDisplay,
    canSubmit,
    trackingAvailable,
    whatsappAction,
    submitHint,
    checkOrderingAgain,
    handlePlaceOrder,
    openTracking,
    closeCart,
    handleFulfillmentChange,
    showCartBar,
    showModeSwitch,
    cartBarModeLabel,
    emberAutoPhotoUrl,
    emberPhotoUrl,
  };
}
