'use client';

import {
  createExclusiveTask,
  createRequestSequence,
} from '../../../../../lib/utils/async-control';
import {
  ALL_DAYS,
  validate,
  toInput,
  type Draft,
  type DraftGroup,
} from './offer-draft';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { useStaffI18n } from '../../../../../lib/i18n/client';

import type { MessageKey } from '../../../../../lib/i18n/messages/index';

import {
  describeError,
  isUnauthenticatedError,
  redirectToLogin,
} from '../../../../../lib/api/user-errors';

import { useActiveLocales } from '../../../../settings/use-active-locales';
import type { MenuItemChoice, Offer } from '../../../api/offers';
import * as offersApi from '../../../api/offers';

export function useOffersEditor(restaurantId: string, defaultLocale: string) {
  const { t, tp, locale } = useStaffI18n();
  const activeLocales = useActiveLocales(restaurantId, defaultLocale);
  const locales = useMemo(
    () => activeLocales ?? [defaultLocale],
    [activeLocales, defaultLocale],
  );
  const [items, setItems] = useState<Offer[] | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemChoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Offer | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fail = useCallback(
    (caught: unknown, target: 'page' | 'form' = 'page') => {
      if (isUnauthenticatedError(caught)) {
        redirectToLogin();
        return;
      }
      (target === 'page' ? setError : setFormError)(describeError(caught));
    },
    [],
  );

  const [mutations] = useState(createExclusiveTask);
  const [reads] = useState(createRequestSequence);
  const reload = useCallback(async () => {
    const isCurrent = reads.next();
    setError(null);
    try {
      const list = await offersApi.listOffers(restaurantId);
      if (isCurrent()) setItems(list);
    } catch (caught) {
      if (isCurrent()) fail(caught);
    }
  }, [restaurantId, fail, reads]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void reload();
    });
    // The menu's items for the pickers (the editor works without them: typed items still work).
    offersApi
      .listMenuItems(restaurantId)
      .then((list) => {
        if (!cancelled) setMenuItems(list);
      })
      .catch(() => {
        if (!cancelled) setMenuItems([]);
      });
    return () => {
      cancelled = true;
      reads.invalidate();
    };
  }, [restaurantId, fail, reload, reads]);

  const photoPreview = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile],
  );
  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );

  function openEditor(next: Draft) {
    setNotice(null);
    setError(null);
    setFormError(null);
    setPhotoFile(null);
    setPhotoRemoved(false);
    setPhotoError(null);
    setDraft(next);
  }

  function patchDraft(change: (current: Draft) => Draft) {
    setDraft((current) => (current ? change(current) : current));
  }

  function patchGroup(
    groupKey: string,
    change: (group: DraftGroup) => DraftGroup,
  ) {
    patchDraft((current) => ({
      ...current,
      groups: current.groups.map((group) =>
        group.key === groupKey ? change(group) : group,
      ),
    }));
  }

  function moveGroup(groupKey: string, direction: -1 | 1) {
    patchDraft((current) => {
      const index = current.groups.findIndex((group) => group.key === groupKey);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.groups.length)
        return current;
      const groups = [...current.groups];
      [groups[index], groups[target]] = [groups[target], groups[index]];
      return { ...current, groups };
    });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await mutations.run(async () => {
      if (!draft) return;
      setFormError(null);
      const problem = validate(draft, defaultLocale, t);
      if (problem) {
        setFormError(problem);
        return;
      }
      setSaving(true);
      try {
        const input = toInput(draft, locales);
        const saved = draft.id
          ? await offersApi.updateOffer(restaurantId, draft.id, input)
          : await offersApi.createOffer(restaurantId, input);
        // The photo is its own request (like Product photos): the offer is already saved when it fails.
        try {
          if (photoFile)
            await offersApi.uploadOfferImage(restaurantId, saved.id, photoFile);
          else if (photoRemoved && draft.imageAssetPath)
            await offersApi.removeOfferImage(restaurantId, saved.id);
        } catch (photoCaught) {
          setError(describeError(photoCaught));
        }
        setDraft(null);
        setNotice(t('offers.saved'));
        await reload();
      } catch (caught) {
        fail(caught, 'form');
      } finally {
        setSaving(false);
      }
    });
  }

  async function handleToggle(offer: Offer, next: boolean) {
    await mutations.run(async () => {
      setBusyId(offer.id);
      setNotice(null);
      setError(null);
      try {
        await offersApi.updateOffer(restaurantId, offer.id, {
          status: next ? 'ACTIVE' : 'INACTIVE',
        });
        setNotice(next ? t('offers.enabled') : t('offers.disabled'));
        await reload();
      } catch (caught) {
        fail(caught);
      } finally {
        setBusyId(null);
      }
    });
  }

  async function handleMove(offer: Offer, direction: -1 | 1) {
    await mutations.run(async () => {
      if (!items) return;
      const index = items.findIndex((candidate) => candidate.id === offer.id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= items.length) return;
      const ids = items.map((candidate) => candidate.id);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      setBusyId(offer.id);
      setNotice(null);
      setError(null);
      try {
        await offersApi.reorderOffers(restaurantId, ids);
        setNotice(t('offers.reordered'));
        await reload();
      } catch (caught) {
        fail(caught);
      } finally {
        setBusyId(null);
      }
    });
  }

  async function handleDelete() {
    await mutations.run(async () => {
      if (!toDelete) return;
      setSaving(true);
      try {
        await offersApi.deleteOffer(restaurantId, toDelete.id);
        setToDelete(null);
        setNotice(t('offers.deleted'));
        await reload();
      } catch (caught) {
        setToDelete(null);
        fail(caught);
      } finally {
        setSaving(false);
      }
    });
  }

  const dayName = (day: number): string => t(`offers.day.${day}` as MessageKey);
  const daysText = (offer: Offer): string =>
    offer.daysOfWeek.length === 0
      ? t('offers.days.everyDay')
      : (locale === 'ar' ? [6, 0, 1, 2, 3, 4, 5] : ALL_DAYS)
          .filter((day) => offer.daysOfWeek.includes(day))
          .map(dayName)
          .join(locale === 'ar' ? '، ' : ', ');
  const shownName = (offer: Offer): string =>
    offer.names[locale] ??
    offer.names[defaultLocale] ??
    Object.values(offer.names)[0] ??
    '';

  return {
    reload,
    t,
    tp,
    locale,
    locales,
    items,
    menuItems,
    error,
    notice,
    draft,
    setDraft,
    formError,
    saving,
    busyId,
    toDelete,
    setToDelete,
    photoFile,
    setPhotoFile,
    photoRemoved,
    setPhotoRemoved,
    photoError,
    setPhotoError,
    photoPreview,
    openEditor,
    patchDraft,
    patchGroup,
    moveGroup,
    handleSave,
    handleToggle,
    handleMove,
    handleDelete,
    dayName,
    daysText,
    shownName,
  };
}
