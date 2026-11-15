import { localeLabel } from '../../../../../lib/i18n/locale-labels';
import type { MessageKey } from '../../../../../lib/i18n/messages/index';

import type { PublicOffer } from '../../../../guest-menu/types';

import type {
  MenuItemChoice,
  Offer,
  OfferBadge,
  OfferInput,
} from '../../../api/offers';

/** The limits the Backend enforces (OFFERS_SPEC.md #1); the editor only mirrors them for instant feedback. */
export const MAX_SLOTS = 6;
export const MAX_OPTIONS = 20;
export const MAX_PICK = 20;
export const MONEY = /^\d{1,12}(\.\d{1,2})?$/;

export const STATE_VARIANT: Record<
  Offer['state'],
  'success' | 'info' | 'neutral' | 'warning'
> = {
  LIVE: 'success',
  TODAY_OFF: 'warning',
  SCHEDULED: 'info',
  EXPIRED: 'neutral',
  OFF: 'neutral',
};

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * The editor's model. An offer is NOT given a "type": it is a list of INCLUDED items (what the guest always gets, picked
 * from the menu with a quantity) plus optional CHOICE GROUPS (what the guest must pick). No group = nothing for the guest
 * to choose. On save the included items become one FIXED slot and each group a SINGLE (pick 1) or MULTI (pick N) slot.
 */
export interface DraftItem {
  key: string;
  id?: string;
  /** Set = this item IS a menu item (its name follows the menu); null = a typed item with its own names. */
  productId: string | null;
  variantId: string | null;
  names: Record<string, string>;
  /** The menu's current names for a linked item (display only). */
  shownNames: Record<string, string>;
  quantity: number;
  adjustment: string;
  orderable: boolean;
}

export interface DraftGroup {
  key: string;
  id?: string;
  /** 1 = the guest picks one; more = picks that many in total. */
  count: number;
  titles: Record<string, string>;
  options: DraftItem[];
}

export interface Draft {
  id: string | null;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  price: string;
  badge: OfferBadge;
  days: number[];
  startsOn: string;
  endsOn: string;
  active: boolean;
  imageAssetPath: string | null;
  included: DraftItem[];
  /** Kept so an edit keeps the id (and the title) of the existing included slot. */
  includedSlotId?: string;
  includedTitles: Record<string, string>;
  groups: DraftGroup[];
}

let keyCounter = 0;
export const nextKey = (): string => `k${++keyCounter}`;

export const typedItem = (): DraftItem => ({
  key: nextKey(),
  productId: null,
  variantId: null,
  names: {},
  shownNames: {},
  quantity: 1,
  adjustment: '0',
  orderable: true,
});

export const menuItem = (
  choice: MenuItemChoice,
  variantId: string | null,
): DraftItem => {
  const variant = choice.variants.find((v) => v.id === variantId);
  const shownNames: Record<string, string> = {};
  for (const [code, name] of Object.entries(choice.names)) {
    const size = variant?.names[code];
    shownNames[code] = size ? `${name} (${size})` : name;
  }
  return {
    key: nextKey(),
    productId: choice.id,
    variantId,
    names: {},
    shownNames,
    quantity: 1,
    adjustment: '0',
    orderable: choice.available,
  };
};

export const emptyGroup = (): DraftGroup => ({
  key: nextKey(),
  count: 1,
  titles: {},
  // no empty row: choices are added from the menu (or by typing, only when asked)
  options: [],
});

export const emptyDraft = (): Draft => ({
  id: null,
  names: {},
  descriptions: {},
  price: '',
  badge: 'OFFER',
  days: [...ALL_DAYS],
  startsOn: '',
  endsOn: '',
  active: true,
  imageAssetPath: null,
  included: [],
  includedTitles: {},
  groups: [],
});

export const optionToItem = (
  option: Offer['slots'][number]['options'][number],
): DraftItem => ({
  key: nextKey(),
  id: option.id,
  productId: option.productId,
  variantId: option.variantId,
  names: option.productId ? {} : { ...option.names },
  shownNames: option.productId ? { ...option.names } : {},
  quantity: option.quantity,
  adjustment: option.priceAdjustment,
  orderable: option.orderable,
});

export const toDraft = (offer: Offer): Draft => {
  const fixed = offer.slots.filter((slot) => slot.kind === 'FIXED');
  return {
    id: offer.id,
    names: { ...offer.names },
    descriptions: { ...offer.descriptions },
    price: offer.price,
    badge: offer.badge,
    days: offer.daysOfWeek.length === 0 ? [...ALL_DAYS] : [...offer.daysOfWeek],
    startsOn: offer.startsOn ?? '',
    endsOn: offer.endsOn ?? '',
    active: offer.status === 'ACTIVE',
    imageAssetPath: offer.imageAssetPath,
    // every included slot of an older offer is shown as one list
    included: fixed.flatMap((slot) => slot.options.map(optionToItem)),
    includedSlotId: fixed[0]?.id,
    includedTitles: fixed[0] ? { ...fixed[0].titles } : {},
    groups: offer.slots
      .filter((slot) => slot.kind !== 'FIXED')
      .map((slot) => ({
        key: nextKey(),
        id: slot.id,
        count: slot.kind === 'SINGLE' ? 1 : slot.requiredCount,
        titles: { ...slot.titles },
        options: slot.options.map(optionToItem),
      })),
  };
};

/** "١٢٫٥" / "12,5" / " 12.50 " -> "12.5": Western digits, a dot, no spaces. */
export function normalizeMoneyInput(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٫,،]/g, '.')
    .replace(/\s+/g, '');
}

/** The default title of the included part when the editor makes one (the guest sees it above the included items). */
export const INCLUDED_TITLE: Record<string, string> = {
  ar: 'مضمّن في العرض',
  en: 'Included',
};

/** Instant, local checks that mirror the Backend (which stays the authority). Returns a sentence or null. */
export function validate(
  draft: Draft,
  defaultLocale: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): string | null {
  const language = localeLabel(defaultLocale);
  if (!draft.names[defaultLocale]?.trim())
    return t('offers.error.name', { language });
  if (!MONEY.test(normalizeMoneyInput(draft.price)))
    return t('offers.error.price');
  if (draft.startsOn && draft.endsOn && draft.endsOn < draft.startsOn)
    return t('offers.error.dates');
  const slotCount = draft.groups.length + (draft.included.length > 0 ? 1 : 0);
  if (slotCount === 0) return t('offers.error.empty');
  const optionCount =
    draft.included.length +
    draft.groups.reduce((sum, group) => sum + group.options.length, 0);
  if (slotCount > MAX_SLOTS || optionCount > MAX_OPTIONS) {
    return t('offers.error.tooMany', {
      slots: MAX_SLOTS,
      options: MAX_OPTIONS,
    });
  }
  const itemProblem = (item: DraftItem, priced: boolean): string | null => {
    if (item.productId === null && !item.names[defaultLocale]?.trim())
      return t('offers.error.optionName', { language });
    if (priced && !MONEY.test(normalizeMoneyInput(item.adjustment || '0')))
      return t('offers.error.adjustment');
    return null;
  };
  for (const item of draft.included) {
    const problem = itemProblem(item, false);
    if (problem) return problem;
  }
  for (const group of draft.groups) {
    if (!group.titles[defaultLocale]?.trim())
      return t('offers.error.slotTitle', { language });
    if (group.options.length === 0) return t('offers.error.optionsRequired');
    if (group.count === 1 && group.options.length < 2)
      return t('offers.error.single');
    if (group.count < 1 || group.count > MAX_PICK)
      return t('offers.error.count');
    for (const option of group.options) {
      const problem = itemProblem(option, true);
      if (problem) return problem;
    }
  }
  return null;
}

/** The request body for the Backend: every active language is sent (a blank one removes that language). */
export function toInput(draft: Draft, locales: string[]): OfferInput {
  const text = (map: Record<string, string>): Record<string, string | null> =>
    Object.fromEntries(
      locales.map((code) => [code, map[code]?.trim() || null]),
    );
  const item = (option: DraftItem, priced: boolean) => ({
    ...(option.id ? { id: option.id } : {}),
    ...(option.productId
      ? { productId: option.productId, variantId: option.variantId }
      : { names: text(option.names) }),
    ...(priced
      ? {
          priceAdjustment: normalizeMoneyInput(option.adjustment || '0') || '0',
        }
      : { quantity: option.quantity }),
  });
  const includedTitles: Record<string, string> = {};
  for (const code of locales)
    includedTitles[code] =
      draft.includedTitles[code]?.trim() ||
      INCLUDED_TITLE[code] ||
      INCLUDED_TITLE.en;
  return {
    status: draft.active ? 'ACTIVE' : 'INACTIVE',
    badge: draft.badge,
    price: normalizeMoneyInput(draft.price),
    daysOfWeek:
      draft.days.length === ALL_DAYS.length
        ? []
        : [...draft.days].sort((a, b) => a - b),
    startsOn: draft.startsOn || null,
    endsOn: draft.endsOn || null,
    names: text(draft.names),
    descriptions: text(draft.descriptions),
    slots: [
      ...draft.groups.map((group) => ({
        ...(group.id ? { id: group.id } : {}),
        kind: group.count === 1 ? ('SINGLE' as const) : ('MULTI' as const),
        ...(group.count === 1 ? {} : { requiredCount: group.count }),
        titles: text(group.titles),
        options: group.options.map((option) => item(option, true)),
      })),
      ...(draft.included.length > 0
        ? [
            {
              ...(draft.includedSlotId ? { id: draft.includedSlotId } : {}),
              kind: 'FIXED' as const,
              titles: includedTitles,
              options: draft.included.map((option) => item(option, false)),
            },
          ]
        : []),
    ],
  };
}

/** Adds a menu item to an INCLUDED list: the same product + size again just raises its quantity. */
export function addIncluded(list: DraftItem[], item: DraftItem): DraftItem[] {
  const same =
    item.productId !== null
      ? list.find(
          (c) =>
            c.productId === item.productId && c.variantId === item.variantId,
        )
      : undefined;
  if (!same) return [...list, item];
  return list.map((c) =>
    c === same
      ? { ...c, quantity: Math.min(99, c.quantity + item.quantity) }
      : c,
  );
}

/** Adds a menu item to a CHOICE group: the same product + size twice would be two identical choices, so it is ignored. */
export function addChoice(list: DraftItem[], item: DraftItem): DraftItem[] {
  const exists =
    item.productId !== null &&
    list.some(
      (c) => c.productId === item.productId && c.variantId === item.variantId,
    );
  return exists ? list : [...list, item];
}

/** The draft as a guest would receive it, in one language (the preview feeds it to the real guest components). */
export function draftToPublicOffer(
  draft: Draft,
  language: 'ar' | 'en',
  defaultLocale: string,
  placeholder: string,
): PublicOffer {
  const pickText = (map: Record<string, string>): string =>
    map[language]?.trim() ||
    map[defaultLocale]?.trim() ||
    Object.values(map).find((v) => v.trim()) ||
    '';
  const option = (item: DraftItem, slot: string, index: number) => ({
    id: `${slot}-${index}`,
    name:
      (item.productId ? pickText(item.shownNames) : pickText(item.names)) ||
      '…',
    priceAdjustment: MONEY.test(normalizeMoneyInput(item.adjustment || '0'))
      ? normalizeMoneyInput(item.adjustment || '0')
      : '0',
    quantity: item.quantity,
  });
  const groups = draft.groups.map((group, g) => ({
    id: `g${g}`,
    kind: group.count === 1 ? ('SINGLE' as const) : ('MULTI' as const),
    requiredCount: group.count === 1 ? 1 : group.count,
    title: pickText(group.titles) || '…',
    options: group.options.map((o, i) => option(o, `g${g}`, i)),
  }));
  const included =
    draft.included.length > 0
      ? [
          {
            id: 'included',
            kind: 'FIXED' as const,
            requiredCount: 0,
            title:
              draft.includedTitles[language]?.trim() ||
              INCLUDED_TITLE[language],
            options: draft.included.map((o, i) => ({
              ...option(o, 'included', i),
              priceAdjustment: '0.00',
            })),
          },
        ]
      : [];
  const price = normalizeMoneyInput(draft.price);
  return {
    id: 'preview',
    name: pickText(draft.names) || placeholder,
    description: pickText(draft.descriptions) || null,
    price: MONEY.test(price) ? price : '0',
    badge: draft.badge,
    imageAssetPath: null,
    daysOfWeek:
      draft.days.length === ALL_DAYS.length
        ? []
        : [...draft.days].sort((a, b) => a - b),
    startsOn: draft.startsOn || null,
    endsOn: draft.endsOn || null,
    availableToday: true,
    soldOut: false,
    slots: [...groups, ...included],
  };
}

/** The best name of an item for the Staff's own language (then the default language, then any). */
export function itemLabel(
  item: DraftItem,
  locale: string,
  defaultLocale: string,
): string {
  const map = item.productId ? item.shownNames : item.names;
  return map[locale] ?? map[defaultLocale] ?? Object.values(map)[0] ?? '';
}
