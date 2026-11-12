'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_MENU_TEMPLATE, layoutOf } from '../../../config/menu-templates';
import { resolveAssetUrl } from '../../../lib/infrastructure/asset-url';
import {
  getTableOrdering, submitGuestOrder, submitWhatsappOrder,
  type SubmitGuestOrderItem,
  type SubmitGuestOrderResult,
  type WhatsappOrderView
} from '../api/guest-orders';
import { type ChipItem } from '../components/CategoryChips';
import { type OrderingRecheckStatus } from '../components/TableClosedNotice';
import type {
  CartLine,
  CheckoutFieldKey,
  Fulfillment,
  OrderingContextView
} from '../components/guest-view-types';
import { useCheckoutValidation } from '../components/useCheckoutValidation';
import { FEATURED_SECTION_ID, useMenuNavigation } from '../components/useMenuNavigation';
import {
  BLOOM_DESIGN_PREVIEW_READY,
  DEFAULT_BLOOM_SETTINGS,
  isBloomPreviewUpdate,
  normalizeBloomTemplateSettings,
  type BloomTemplateSettings,
} from '../constants/bloom-settings';
import { BREW_DESIGN_PREVIEW_READY, DEFAULT_BREW_SETTINGS, isBrewPreviewUpdate, normalizeBrewTemplateSettings, type BrewTemplateSettings } from '../constants/brew-settings';
import { getPublicMenuCopy } from '../constants/copy';
import { DEFAULT_EDITORIAL_SETTINGS, EDITORIAL_DESIGN_PREVIEW_READY, isEditorialPreviewUpdate, normalizeEditorialTemplateSettings, type EditorialTemplateSettings } from '../constants/editorial-settings';
import {
  DEFAULT_EMBER_SETTINGS,
  EMBER_DESIGN_PREVIEW_READY,
  isEmberPreviewUpdate,
  normalizeEmberTemplateSettings,
  type EmberTemplateSettings,
} from '../constants/ember-settings';
import { DEFAULT_MAKKBOZ_SETTINGS, normalizeMakkbozSettings, type MakkbozMenuSettings } from '../constants/makkboz-settings';
import { DEFAULT_MEAT_LOVERS_SETTINGS, normalizeMeatLoversSettings, type MeatLoversMenuSettings } from '../constants/meat-lovers-settings';
import { extraLabel, getOffersCopy } from '../constants/offers-copy';
import { DEFAULT_SHERBINY_SETTINGS, normalizeSherbinySettings, type SherbinyMenuSettings } from '../constants/sherbiny-settings';
import { DEFAULT_VERDE_SETTINGS, normalizeVerdeSettings, type VerdeMenuSettings } from '../constants/verde-settings';
import type {
  GuestOrderView,
  PublicMenuProduct,
  PublicOffer
} from '../types/index';
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
import { MAKKBOZ_DESIGN_PREVIEW_READY, isMakkbozPreviewUpdate } from '../utils/makkboz-preview';
import { MEAT_LOVERS_DESIGN_PREVIEW_READY, isMeatLoversPreviewUpdate } from '../utils/meat-lovers-preview';
import {
  ZERO_MINOR_UNITS,
  fromMinorUnits,
  lineTotalMinorUnits,
  toMinorUnits,
} from '../utils/money';
import {
  MAX_OFFER_QUANTITY,
  OFFERS_SECTION_ID,
  resolveOfferLine,
  type OfferPick,
} from '../utils/offers';
import {
  clearPendingAttempt,
  payloadMatchesPendingAttempt,
  resolveClientRequestId,
  type PendingOrderCheckout,
  type PendingOrderItem,
} from '../utils/pending-order-attempt';
import { currencyLabel, formatAmount } from '../utils/price-format';
import { matchesSearch, normalizeForSearch } from '../utils/search';
import { SHERBINY_DESIGN_PREVIEW_READY, isSherbinyPreviewUpdate } from '../utils/sherbiny-preview';
import { fetchSuggestions } from '../utils/suggestions';
import { readTrackedOrders, rememberOrder } from '../utils/tracking';
import { generateUuid } from '../utils/uuid';
import { VERDE_DESIGN_PREVIEW_READY, isVerdePreviewUpdate } from '../utils/verde-preview';

export function usePublicMenuController({
  data,
  publicCode,
  template = DEFAULT_MENU_TEMPLATE,
  designPreview = false,
  exclusiveRendererKey,
}: PublicMenuViewProps) {
  const router = useRouter();
  const locale = data.locale.resolved;
  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';
  const currency = data.context.restaurant.currencyCode;
  const logoUrl = resolveAssetUrl(data.context.restaurant.logoAssetPath);
  const coverUrl = resolveAssetUrl(data.context.restaurant.coverAssetPath);
  const copy = getPublicMenuCopy(locale);
  const [emberLiveDraft, setEmberLiveDraft] = useState<EmberTemplateSettings | null>(null);
  useEffect(() => {
    if (!designPreview || template !== 'ember' || window.parent === window) return;
    const onDraftMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin ||
          event.source !== window.parent ||
          !isEmberPreviewUpdate(event.data)) return;
      // Treat messages as untrusted display data; normalize the allowlisted
      // palette, motion, localized copy and server-owned image asset path.
      setEmberLiveDraft(normalizeEmberTemplateSettings(event.data.settings));
    };
    window.addEventListener('message', onDraftMessage);
    // Child -> parent handshake covers hydration after iframe load.
    window.parent.postMessage({ type: EMBER_DESIGN_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', onDraftMessage);
  }, [designPreview, template]);
  const emberSettings = designPreview && template === 'ember' && emberLiveDraft
    ? emberLiveDraft
    : data.context.restaurant.emberSettings ?? DEFAULT_EMBER_SETTINGS;
  const [bloomLiveDraft, setBloomLiveDraft] = useState<BloomTemplateSettings | null>(null);
  useEffect(() => {
    if (!designPreview || template !== 'bloom' || window.parent === window) return;
    const onBloomDraft = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent ||
          !isBloomPreviewUpdate(event.data)) return;
      setBloomLiveDraft(normalizeBloomTemplateSettings(event.data.settings));
    };
    window.addEventListener('message', onBloomDraft);
    window.parent.postMessage({ type: BLOOM_DESIGN_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', onBloomDraft);
  }, [designPreview, template]);
  const bloomSettings = designPreview && template === 'bloom' && bloomLiveDraft
    ? bloomLiveDraft
    : data.context.restaurant.bloomSettings ?? DEFAULT_BLOOM_SETTINGS;
  const [brewLiveDraft,setBrewLiveDraft]=useState<BrewTemplateSettings|null>(null);
  useEffect(()=>{
    if(!designPreview||template!=='brew'||window.parent===window)return;
    const listen=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin||event.source!==window.parent||!isBrewPreviewUpdate(event.data))return;
      setBrewLiveDraft(normalizeBrewTemplateSettings(event.data.settings));
    };
    window.addEventListener('message',listen);
    window.parent.postMessage({type:BREW_DESIGN_PREVIEW_READY},window.location.origin);
    return ()=>window.removeEventListener('message',listen);
  },[designPreview,template]);
  const brewSettings=designPreview&&template==='brew'&&brewLiveDraft?brewLiveDraft:data.context.restaurant.brewSettings??DEFAULT_BREW_SETTINGS;
  const [editorialLiveDraft,setEditorialLiveDraft]=useState<EditorialTemplateSettings|null>(null);
  useEffect(()=>{
    if(!designPreview||template!=='editorial'||window.parent===window)return;
    const handlePreview=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin || event.source!==window.parent || !isEditorialPreviewUpdate(event.data))return;
      setEditorialLiveDraft(normalizeEditorialTemplateSettings(event.data.settings));
    };
    window.addEventListener('message',handlePreview);
    window.parent.postMessage({type:EDITORIAL_DESIGN_PREVIEW_READY},window.location.origin);
    return()=>window.removeEventListener('message',handlePreview);
  },[designPreview,template]);
  const editorialSettings=designPreview&&template==='editorial'&&editorialLiveDraft
    ? editorialLiveDraft : data.context.restaurant.editorialSettings??DEFAULT_EDITORIAL_SETTINGS;
  const isVerde = exclusiveRendererKey === 'VERDE_NAPOLI_V1';
  const [verdeLiveDraft, setVerdeLiveDraft] = useState<VerdeMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isVerde || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || !isVerdePreviewUpdate(event.data)) return;
      setVerdeLiveDraft(normalizeVerdeSettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage({ type: VERDE_DESIGN_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isVerde]);
  const verdeSettings: VerdeMenuSettings | null = isVerde
    ? designPreview && verdeLiveDraft
      ? verdeLiveDraft
      : (data.context.restaurant.verdeSettings ?? DEFAULT_VERDE_SETTINGS)
    : null;
  const isSherbiny = exclusiveRendererKey === 'SHERBINY_FIRE_DOUGH_V1';
  const [sherbinyLiveDraft, setSherbinyLiveDraft] = useState<SherbinyMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isSherbiny || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || !isSherbinyPreviewUpdate(event.data)) return;
      setSherbinyLiveDraft(normalizeSherbinySettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage({ type: SHERBINY_DESIGN_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isSherbiny]);
  const sherbinySettings: SherbinyMenuSettings | null = isSherbiny
    ? designPreview && sherbinyLiveDraft
      ? sherbinyLiveDraft
      : (data.context.restaurant.sherbinySettings ?? DEFAULT_SHERBINY_SETTINGS)
    : null;
  const isMakkboz = exclusiveRendererKey === 'MAKKBOZ_HERITAGE_V1';
  const [makkbozLiveDraft, setMakkbozLiveDraft] = useState<MakkbozMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isMakkboz || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || !isMakkbozPreviewUpdate(event.data)) return;
      setMakkbozLiveDraft(normalizeMakkbozSettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage({ type: MAKKBOZ_DESIGN_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isMakkboz]);
  const makkbozSettings: MakkbozMenuSettings | null = isMakkboz
    ? designPreview && makkbozLiveDraft
      ? makkbozLiveDraft
      : (data.context.restaurant.makkbozSettings ?? DEFAULT_MAKKBOZ_SETTINGS)
    : null;
  const isMeatLovers = exclusiveRendererKey === 'MEAT_LOVERS_BUTCHER_V1';
  const [meatLoversLiveDraft, setMeatLoversLiveDraft] = useState<MeatLoversMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isMeatLovers || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || !isMeatLoversPreviewUpdate(event.data)) return;
      setMeatLoversLiveDraft(normalizeMeatLoversSettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage({ type: MEAT_LOVERS_DESIGN_PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isMeatLovers]);
  const meatLoversSettings: MeatLoversMenuSettings | null = isMeatLovers
    ? designPreview && meatLoversLiveDraft
      ? meatLoversLiveDraft
      : (data.context.restaurant.meatLoversSettings ?? DEFAULT_MEAT_LOVERS_SETTINGS)
    : null;
  const hasCategories = data.menu.categories.length > 0;
  // Both premium demo references show one category at a time.
  // Search results still span all categories so no matching products disappear.
  const [premiumCategoryId, setPremiumCategoryId] = useState(data.menu.categories[0]?.id ?? '');
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
    !isGenericQr && (data.context.tableOrdering === 'DISABLED' || serverOrderingDisabled);
  const canOrder = isGenericQr ? pickupAvailable || deliveryAvailable : !tableChannelDisabled;

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
      for (const product of category.products) products.set(product.id, product);
    }
    return products;
  }, [data.menu.categories]);

  // Re-resolve category names and menu order from the CURRENT public payload,
  // just like product names. Never persist or submit category metadata as cart truth.
  const categoryByProductId = useMemo(() => {
    const categories = new Map<string, { id: string; name: string; order: number }>();
    data.menu.categories.forEach((category, order) => {
      for (const product of category.products) {
        categories.set(product.id, { id: category.id, name: category.name, order });
      }
    });
    return categories;
  }, [data.menu.categories]);

  // Offers / Bundles (DEC-069): fixed-price packages with choices. With at least one active offer the top strip shows
  // them INSTEAD of the featured products (which come back when there are none), and the first chip jumps there.
  const offers = useMemo(() => data.context.offers ?? [], [data.context.offers]);
  const offersCopy = getOffersCopy(locale);
  const hasOffers = offers.length > 0;

  // The template decides the header, the cards, the headings and the category strip (DEC-044).
  // Photo-free templates show no photos anywhere (cards, cart, product page, featured banners).
  const layout = layoutOf(template);
  const showPhotos = isVerde || isSherbiny || isMakkboz || isMeatLovers || layout.photos;

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
      index.set(product.id, normalizeForSearch(`${product.name} ${product.description ?? ''}`));
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
  const isPremiumSingleCategory = isVerde || isSherbiny || isMakkboz || isMeatLovers || template === 'ember' || template === 'bloom' || template === 'brew';
  const premiumVisibleCategories = isPremiumSingleCategory && !isSearching
    ? visibleCategories.filter((category) => category.id === premiumCategoryId)
    : visibleCategories;
  const searchResultCount = visibleCategories.reduce(
    (sum, category) => sum + category.products.length,
    0,
  );

  const showOffers = hasOffers && !isSearching;
  // The featured strip gives its place to the offers while there are any.
  const showFeatured = featuredProducts.length > 0 && !isSearching && !hasOffers;
  const scrollToOffers = () => {
    document.getElementById(`category-${OFFERS_SECTION_ID}`)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
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
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  };
  const navigation = useMenuNavigation(
    [
      ...(hasOffers ? [OFFERS_SECTION_ID] : featuredProducts.length > 0 ? [FEATURED_SECTION_ID] : []),
      ...data.menu.categories.map((category) => category.id),
    ],
    isSearching,
  );
  const chipItems: ChipItem[] = [
    ...(showOffers
      ? [{ id: OFFERS_SECTION_ID, name: offersCopy.sectionTitle, imageUrl: null, isOffers: true }]
      : []),
    ...(showFeatured
      ? [{ id: FEATURED_SECTION_ID, name: copy.ourPicks, imageUrl: null, isFeatured: true }]
      : []),
    ...data.menu.categories.map((category) => ({
      id: category.id,
      name: category.name,
      imageUrl: showPhotos ? resolveAssetUrl(category.imageAssetPath) : null,
    })),
  ];

  const [cart, setCart] = useState<StoredCartItem[]>([]);
  const [hasHydratedCart, setHasHydratedCart] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Table Sessions: staff can close ordering for a TABLE QR. The server-rendered value is
  // advisory; a 409 from the order endpoint or "Check again" overrides it. Never applies to
  // Pickup/Delivery (GENERIC QR).
  const [orderingOverride, setOrderingOverride] = useState<'AVAILABLE' | 'CLOSED' | null>(null);
  const [isRecheckingOrdering, setIsRecheckingOrdering] = useState(false);
  const [orderingRecheck, setOrderingRecheck] = useState<OrderingRecheckStatus>('idle');
  const tableOrdering =
    orderingOverride ?? (data.context.tableOrdering === 'CLOSED' ? 'CLOSED' : 'AVAILABLE');
  const tableLocked = !isGenericQr && tableOrdering === 'CLOSED';
  const [confirmedOrder, setConfirmedOrder] = useState<GuestOrderView | null>(null);
  // FT-7/FT-8 checkout state -- kept here (not inside the Cart panel) so it
  // survives closing/reopening the panel and a failed submission. The hero's mode
  // switch and the checkout's switch both read/write `requestedFulfillment`: one
  // source of truth.
  const [requestedFulfillment, setRequestedFulfillment] = useState<Fulfillment>('PICKUP');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [whatsappHandoff, setWhatsappHandoff] = useState<WhatsappOrderView | null>(null);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  useEffect(() => {
    // Read after mount so the server render and the first client render are identical.
    queueMicrotask(() => setHasActiveOrder(readTrackedOrders(publicCode).length > 0));
  }, [publicCode]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<CheckoutFieldKey, string>>({
    customerName: '',
    customerPhone: '',
    customerNotes: '',
    deliveryAddress: '',
    deliveryBuilding: '',
    deliveryFloor: '',
    deliveryApartment: '',
    deliveryLandmark: '',
  });
  // The mode actually in effect: the Guest's choice while it is available,
  // otherwise whichever mode is (a Restaurant with only Delivery, say).
  const fulfillment: Fulfillment = !isGenericQr
    ? 'PICKUP'
    : requestedFulfillment === 'DELIVERY' && deliveryAvailable
      ? 'DELIVERY'
      : pickupAvailable
        ? 'PICKUP'
        : 'DELIVERY';
  const isDelivery = isGenericQr && fulfillment === 'DELIVERY';
  // One eligible Branch auto-resolves; several require the Guest's own choice.
  const eligibleBranches = isDelivery ? deliveryBranches : pickupBranches;
  const resolvedBranchId =
    eligibleBranches.length === 1
      ? eligibleBranches[0].id
      : eligibleBranches.some((branch) => branch.id === selectedBranchId)
        ? selectedBranchId
        : null;
  // Delivery area: only zones of the resolved Branch; a single zone is chosen for the Guest.
  const zones = isDelivery
    ? (deliveryBranches.find((branch) => branch.id === resolvedBranchId)?.zones ?? [])
    : [];
  const resolvedZoneId =
    zones.length === 1
      ? zones[0].id
      : zones.some((zone) => zone.id === selectedZoneId)
        ? selectedZoneId
        : null;
  const selectedZone = zones.find((zone) => zone.id === resolvedZoneId) ?? null;
  // Name, phone, address and the other typed fields: one shared set of rules for every template
  // (instant inline feedback here; the API repeats them and is the authority).
  const validation = useCheckoutValidation({
    fields,
    enabled: isGenericQr,
    delivery: isDelivery,
    country: data.context.restaurant.countryCode,
    locale,
  });
  const submitValues = validation.valuesForSubmit();
  const checkout: PendingOrderCheckout | null = isGenericQr
    ? {
        fulfillment,
        branchId: resolvedBranchId,
        customerName: submitValues.customerName,
        customerPhone: submitValues.customerPhone,
        customerNotes: submitValues.customerNotes,
        deliveryZoneId: isDelivery ? resolvedZoneId : null,
      // A Pickup attempt never carries delivery text (typed earlier, then switched away from).
      deliveryAddress: isDelivery ? submitValues.deliveryAddress : '',
        deliveryBuilding: isDelivery ? submitValues.deliveryBuilding : '',
        deliveryFloor: isDelivery ? submitValues.deliveryFloor : '',
        deliveryApartment: isDelivery ? submitValues.deliveryApartment : '',
        deliveryLandmark: isDelivery ? submitValues.deliveryLandmark : '',
      }
    : null;
  // A stable primitive for effect dependencies (the object above is new every render).
  const checkoutKey = JSON.stringify(checkout);
  // The Product open in the customizer sheet -- null means no sheet is open.
  // Any available Product can open it (it shows the dish and a quantity); a
  // Product with Modifier Groups always opens it before adding.
  const [sheetProduct, setSheetProduct] = useState<PublicMenuProduct | null>(null);
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
    queueMicrotask(() => {
      const stored = loadCart(publicCode);
      // An Offer line (DEC-069) stays only while the current menu still offers that offer; its choices are
      // re-checked against the offer when the lines are built (a changed offer blocks the line, never silently drops it).
      const reconciled = stored.filter((item) =>
        item.offerId ? offers.some((offer) => offer.id === item.offerId) : productById.has(item.productId),
      );
      setCart(reconciled);
      if (reconciled.length !== stored.length) {
        saveCart(publicCode, reconciled);
      }
      setHasHydratedCart(true);
    });
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
    const currentCheckout = JSON.parse(checkoutKey) as PendingOrderCheckout | null;
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
  const { simpleQuantityByProductId, totalQuantityByProductId } = useMemo(() => {
    const simple = new Map<string, number>();
    const total = new Map<string, number>();
    for (const item of cart) {
      if (item.offerId) continue; // Offer lines have no product card to count on.
      total.set(item.productId, (total.get(item.productId) ?? 0) + item.quantity);
      if (item.modifierOptionIds.length === 0 && !item.variantId) simple.set(item.productId, item.quantity);
    }
    return { simpleQuantityByProductId: simple, totalQuantityByProductId: total };
  }, [cart]);

  /** Adds `quantity` of `productId` with the given selections -- merges into an existing line with the SAME selections, otherwise starts a new distinct line. */
  const addLine = useCallback(
    (productId: string, modifierOptionIds: string[], quantity = 1, variantId: string | null = null) => {
      const key = cartLineKey(productId, modifierOptionIds, variantId);
      updateCart((prev) => {
        const current = prev.find(
          (item) => storedItemKey(item) === key,
        );
        if (!current) {
          return [
            ...prev,
            { productId, quantity: Math.min(quantity, MAX_QUANTITY), modifierOptionIds, variantId },
          ];
        }
        return prev.map((item) =>
          storedItemKey(item) === key
            ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
            : item,
        );
      });
    },
    [updateCart],
  );

  /** The card's quick-add: a Product with Modifier Groups never adds blindly (it opens the sheet); one with none adds a plain no-selection line. */
  const handleQuickAdd = useCallback(
    (product: PublicMenuProduct) => {
      if (product.modifierGroups.length > 0 || (product.variants?.length ?? 0) > 0) {
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
      [...new Set(cart.filter((item) => !item.offerId).map((item) => item.productId))].sort().join(','),
    [cart],
  );
  const [suggestionIds, setSuggestionIds] = useState<string[]>([]);
  useEffect(() => {
    if (!suggestionsOn || !isCartOpen || cartProductKey === '') return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchSuggestions(publicCode, cartProductKey.split(',')).then((ids) => {
        if (!cancelled) setSuggestionIds(ids);
      });
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
          product !== undefined && product.availability !== 'SOLD_OUT' && !inCart.has(product.id),
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
      replaceLine(editing.lineKey, sheetProduct.id, selectedOptionIds, quantity, variantId);
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
      const index = prev.findIndex(
        (item) => storedItemKey(item) === oldKey,
      );
      if (index === -1) return prev;
      const rest = prev.filter((_, position) => position !== index);
      const existing = rest.findIndex(
        (item) => storedItemKey(item) === newKey,
      );
      if (existing !== -1) {
        return rest.map((item, position) =>
          position === existing
            ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
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

  const handleOpenOffer = useCallback((offer: PublicOffer) => setSheetOffer(offer), []);

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
              ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_OFFER_QUANTITY) }
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
        const existing = rest.findIndex((item) => storedItemKey(item) === newKey);
        if (existing !== -1) {
          return rest.map((item, position) =>
            position === existing
              ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_OFFER_QUANTITY) }
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
      const resolved = resolveOfferLine(offers, { offerId: offer.id, choices: item.offerChoices ?? [] }, extraLabel);
      setEditingOffer({
        lineKey,
        choices: resolved?.problem === 'CHANGED' ? [] : (item.offerChoices ?? []),
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
    setEditing({ lineKey, selectedByGroup, quantity: item.quantity, variantId: item.variantId ?? null });
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
  const handleClearSearch = useCallback(() => setQuery(''), []);

  /** The sticky bar's search button: back to the top, then into the first visible search field. */
  const handleJumpToSearch = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    window.setTimeout(
      () => {
        const fieldsInPage = Array.from(
          document.querySelectorAll<HTMLInputElement>('[data-guest-search]'),
        );
        fieldsInPage.find((field) => field.offsetParent !== null)?.focus({ preventScroll: true });
      },
      reduced ? 0 : 450,
    );
  }, []);

  // An offer that vanished from the menu (switched off, deleted, expired) after the page loaded: drop its cart line.
  useEffect(() => {
    if (!hasHydratedCart) return;
    if (!cart.some((item) => item.offerId && !offers.some((offer) => offer.id === item.offerId))) return;
    queueMicrotask(() =>
      updateCart((prev) =>
        prev.filter((item) => !item.offerId || offers.some((offer) => offer.id === item.offerId)),
      ),
    );
  }, [offers, hasHydratedCart, cart, updateCart]);

  const cartLines: CartLine[] = cart
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
          lineTotal: fromMinorUnits(lineTotalMinorUnits(unitPrice, item.quantity)),
          originalLineTotal: fromMinorUnits(lineTotalMinorUnits(unitPrice, item.quantity)),
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
      const selections: { groupName: string; optionName: string; priceAdjustment: string }[] = [];
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
      const size = item.variantId ? (sizes.find((entry) => entry.id === item.variantId) ?? null) : null;
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
      const originalUnitPrice = fromMinorUnits(toMinorUnits(baseForLine) + modifiersMinorUnits);
      const unitPrice = discountedForLine !== null
        ? fromMinorUnits(toMinorUnits(discountedForLine) + modifiersMinorUnits)
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
        hasModifierGroups: product.modifierGroups.length > 0 || sizes.length > 0,
        imageAssetPath: product.primaryImageAssetPath,
        unitPrice,
        lineTotal: fromMinorUnits(lineTotalMinorUnits(unitPrice, item.quantity)),
        originalLineTotal: fromMinorUnits(lineTotalMinorUnits(originalUnitPrice, item.quantity)),
        discounted,
        selections,
        offerId: null,
        offerChoices: [],
        blockedReason: null,
        blocked: product.availability === 'SOLD_OUT' || sizeMissing,
      };
    })
    .filter((line): line is CartLine => line !== null);

  /** What the order endpoints receive for the orderable lines: identities and quantities only -- never a price or a name. */
  const toPendingItems = (lines: CartLine[]): PendingOrderItem[] =>
    lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      modifierOptionIds: line.modifierOptionIds,
      variantId: line.variantId,
      offerId: line.offerId,
      offerChoices: line.offerChoices,
    }));
  const toSubmitItems = (lines: CartLine[]): SubmitGuestOrderItem[] =>
    lines.map((line) =>
      line.offerId
        ? { offerId: line.offerId, quantity: line.quantity, offerChoices: line.offerChoices }
        : {
            productId: line.productId,
            quantity: line.quantity,
            modifierOptionIds: line.modifierOptionIds,
            ...(line.variantId ? { variantId: line.variantId } : {}),
          },
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
  const grandTotalDisplay = fromMinorUnits(totalMinorUnits + deliveryFeeMinorUnits);
  const belowMinimum =
    selectedZone !== null && totalMinorUnits < toMinorUnits(selectedZone.minimumOrder);
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
          formatAmount(fromMinorUnits(toMinorUnits(selectedZone.minimumOrder) - totalMinorUnits)),
          unitLabel,
        )
      : null;
  // Branch, delivery area and the minimum order block the button with a reason. The typed
  // fields (name, phone, address ...) do not: tapping send shows each problem under its field.
  const checkoutDetailsComplete =
    !isGenericQr ||
    (resolvedBranchId !== null && (!isDelivery || (resolvedZoneId !== null && !belowMinimum)));
  // Opening hours (DEC-042): a closed Branch takes no Pickup / Delivery orders. Advisory
  // here; the Backend refuses with BRANCH_CLOSED either way.
  const branchClosed =
    isGenericQr &&
    eligibleBranches.find((branch) => branch.id === resolvedBranchId)?.hours?.open === false;
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
    data.context.tracking !== false && !(isGenericQr && data.context.ordering?.whatsapp);
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
  const checkOrderingAgain = useCallback(async () => {
    if (isGenericQr) return;
    setIsRecheckingOrdering(true);
    const result = await getTableOrdering(publicCode);
    setIsRecheckingOrdering(false);
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
    window.setTimeout(() => setOrderingRecheck('idle'), 8000);
  }, [isGenericQr, publicCode]);

  // A phone often sleeps on the table: re-check when the page becomes visible again.
  useEffect(() => {
    if (!tableLocked) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkOrderingAgain();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tableLocked, checkOrderingAgain]);

  async function handlePlaceOrder() {
    if (!canSubmit) return;
    if (!(await validation.checkBeforeSend())) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const items = toSubmitItems(orderableLines);
    // FT-5 critical fix: reuse the SAME clientRequestId as any still-
    // pending attempt for this exact Cart payload (a retry after a lost
    // response, including across a refresh or an EN/AR navigation), or
    // generate+persist a fresh one -- never a brand-new id on every call,
    // which would silently defeat the Backend's idempotency guarantee on
    // the most important case (an ambiguous network failure).
    const clientRequestId = resolveClientRequestId(
      publicCode,
      toPendingItems(orderableLines),
      checkout,
      generateUuid,
    );
    const result = await submitGuestOrder(
      publicCode,
      clientRequestId,
      items,
      checkout,
      data.locale.resolved,
      // The total the Guest is looking at: if a discount changed meanwhile the Backend
      // answers 409 instead of silently charging a different amount.
      isDelivery ? grandTotalDisplay : totalDisplay,
    );
    setIsSubmitting(false);

    if (result.outcome === 'success') {
      rememberOrder(publicCode, result.data.id);
      setHasActiveOrder(true);
      setConfirmedOrder(result.data);
      persistCartCleared();
      clearPendingAttempt(publicCode);
      return;
    }
    reportFailure(result);
  }

  /** Why an order (or a WhatsApp order) was not accepted, in the Guest's words. Nothing was created. */
  function reportFailure(result: Exclude<SubmitGuestOrderResult, { outcome: 'success' }>) {
    if (result.outcome === 'tableOrderingUnavailable') {
      // Staff closed ordering since this page loaded. Nothing was created; the cart and the
      // pending attempt are kept, so the SAME request id is reused if ordering reopens.
      setOrderingOverride('CLOSED');
      setOrderingRecheck('idle');
      return;
    }
    if (result.outcome === 'orderingDisabled') {
      // The Restaurant switched ordering off since this page loaded: nothing was created.
      // The menu stays browsable and the notice explains why the cart is gone.
      setServerOrderingDisabled(true);
      return;
    }
    if (result.outcome === 'priceChanged') {
      // A discount started, ended or changed. Nothing was created: refetch the menu so
      // the cart shows the current prices, and ask the Guest to review before ordering.
      setSubmitError(copy.priceChangedError);
      router.refresh();
      return;
    }
    if (result.outcome === 'itemsUnavailable') {
      setSubmitError(copy.itemsUnavailableError);
      return;
    }
    if (result.outcome === 'offerUnavailable' || result.outcome === 'offerChanged') {
      // An offer was switched off, expired, is not valid today, or its items changed. Nothing was created; the cart
      // is kept. Refetch the menu so the cart marks the line (remove / choose again) and the strip shows the truth.
      setSubmitError(
        result.outcome === 'offerUnavailable' ? offersCopy.unavailableError : offersCopy.changedError,
      );
      router.refresh();
      return;
    }
    if (result.outcome === 'notFound') {
      setSubmitError(copy.orderNotFoundError);
      return;
    }
    if (result.outcome === 'invalidFields') {
      // The API refused specific fields: show each one under its field (stable codes, our words).
      if (!validation.applyServerIssues(result.fields)) {
        setSubmitError(isDelivery ? copy.deliveryDetailsRequiredError : copy.pickupDetailsRequiredError);
      }
      return;
    }
    if (result.outcome === 'pickupDetailsRequired') {
      setSubmitError(
        isDelivery ? copy.deliveryDetailsRequiredError : copy.pickupDetailsRequiredError,
      );
      return;
    }
    if (result.outcome === 'deliveryDetailsRequired') {
      setSubmitError(copy.deliveryDetailsRequiredError);
      return;
    }
    if (result.outcome === 'deliveryZoneInvalid') {
      setSubmitError(copy.deliveryAreaError);
      return;
    }
    if (result.outcome === 'deliveryUnavailable') {
      setSubmitError(copy.deliveryUnavailable);
      return;
    }
    if (result.outcome === 'minimumNotMet') {
      setSubmitError(
        copy.minimumOrderMessage(
          result.zoneName ?? selectedZone?.name ?? '',
          formatAmount(result.minimumOrder ?? selectedZone?.minimumOrder ?? ''),
          unitLabel,
        ),
      );
      return;
    }
    if (result.outcome === 'pickupBranchInvalid') {
      setSubmitError(isDelivery ? copy.deliveryAreaError : copy.pickupBranchError);
      return;
    }
    if (result.outcome === 'pickupUnavailable') {
      setSubmitError(copy.pickupUnavailable);
      return;
    }
    if (result.outcome === 'whatsappOnly') {
      // The Restaurant switched to WhatsApp since this page loaded: refresh so the cart sends it there.
      setSubmitError(copy.whatsappOnlyError);
      router.refresh();
      return;
    }
    if (result.outcome === 'whatsappUnavailable') {
      setSubmitError(copy.whatsappUnavailable);
      return;
    }
    if (result.outcome === 'branchClosed') {
      setSubmitError(copy.branchClosedHint);
      return;
    }
    // Network/unexpected failure (Section: Backend may have actually
    // created the Order despite a lost response) -- the pending attempt is
    // deliberately left in place so an unchanged retry reuses this same
    // `clientRequestId` above.
    setSubmitError(copy.orderNetworkError);
  }

  /** DEC-042: prices the cart on the Backend and hands the ready-to-send message to WhatsApp. No order is stored. */
  async function handleSendWhatsapp() {
    if (!canSubmit) return;
    if (!(await validation.checkBeforeSend())) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const items = toSubmitItems(orderableLines);
    const result = await submitWhatsappOrder(
      publicCode,
      items,
      checkout,
      data.locale.resolved,
      isDelivery ? grandTotalDisplay : totalDisplay,
      generateUuid(),
    );
    setIsSubmitting(false);
    if (result.outcome === 'whatsappSuccess') {
      setWhatsappHandoff(result.data);
      persistCartCleared();
      clearPendingAttempt(publicCode);
      // Try to open WhatsApp at once; a browser may block it after the wait, so the panel also has a button.
      try {
        window.open(result.data.whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // The button in the panel does the same.
      }
      return;
    }
    reportFailure(result);
  }

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

  function handleFulfillmentChange(next: Fulfillment) {
    setRequestedFulfillment(next);
    // Branch/zone lists differ per mode -- the Guest re-chooses if needed.
    setSelectedBranchId(null);
    setSelectedZoneId(null);
  }

  const showCartBar = canOrder && cartCount > 0;
  const showModeSwitch = isGenericQr && (pickupAvailable || deliveryAvailable);
  const cartBarModeLabel = isGenericQr
    ? fulfillment === 'DELIVERY'
      ? copy.delivery
      : copy.pickup
    : `${copy.table} ${data.context.table?.number ?? ''}`.trim();

  const emberHeroProduct =
    data.menu.categories.flatMap((category) => category.products)
      .find((product) => product.featured && product.primaryImageAssetPath && product.availability !== 'SOLD_OUT') ??
    data.menu.categories.flatMap((category) => category.products)
      .find((product) => product.primaryImageAssetPath && product.availability !== 'SOLD_OUT');
  const emberAutoPhotoUrl = resolveAssetUrl(emberHeroProduct?.primaryImageAssetPath ?? null);
  const emberPhotoUrl = emberSettings.heroImageMode === 'CUSTOM' && emberSettings.heroImageAssetPath
    ? resolveAssetUrl(emberSettings.heroImageAssetPath)
    : emberAutoPhotoUrl;
  return { locale, dir, currency,
    logoUrl,
    coverUrl, copy, emberSettings, bloomSettings, brewSettings, editorialSettings, isVerde, verdeSettings, isSherbiny, sherbinySettings, isMakkboz, makkbozSettings, isMeatLovers, meatLoversSettings, hasCategories, premiumCategoryId, isGenericQr,
                    pickupAvailable,
                    deliveryAvailable, canOrder, orderingContext, branchLine, offers, offersCopy, layout, showPhotos, featuredProducts, query, setQuery, isSearching, visibleCategories, isPremiumSingleCategory, premiumVisibleCategories, searchResultCount, showOffers, showFeatured, selectPremiumCategory, navigation, chipItems, isCartOpen, setIsCartOpen, isSubmitting, submitError, isRecheckingOrdering, orderingRecheck, tableLocked, confirmedOrder, setSelectedBranchId, isTrackOpen, setIsTrackOpen, whatsappHandoff, hasActiveOrder, setHasActiveOrder, setSelectedZoneId,
                    fields, setFields, fulfillment, isDelivery, eligibleBranches, resolvedBranchId, zones, resolvedZoneId, selectedZone, validation, checkout, sheetProduct, editing, simpleQuantityByProductId, totalQuantityByProductId, handleQuickAdd, suggestedProducts, handleOpenProduct, handleConfirmOptions, closeSheet, sheetOffer, editingOffer, handleOpenOffer, closeOfferSheet, handleConfirmOffer, handleEditLine, handleIncrement, handleDecrement, handleRemove, handleCardIncrement, handleCardDecrement, handleClearSearch, handleJumpToSearch, cartLines, totalDisplay, discountDisplay, cartCount, deliveryFeeDisplay,
                    grandTotalDisplay,
                    minimumMessage,
                    minimumShortfallDisplay, canSubmit, trackingAvailable, whatsappAction, submitHint, checkOrderingAgain, handlePlaceOrder, openTracking, closeCart, handleFulfillmentChange, showCartBar, showModeSwitch, cartBarModeLabel, emberAutoPhotoUrl, emberPhotoUrl };
}
