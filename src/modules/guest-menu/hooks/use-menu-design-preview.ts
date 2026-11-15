'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_MENU_TEMPLATE } from '../../../config/menu-templates';

import {
  BLOOM_DESIGN_PREVIEW_READY,
  DEFAULT_BLOOM_SETTINGS,
  isBloomPreviewUpdate,
  normalizeBloomTemplateSettings,
  type BloomTemplateSettings,
} from '../constants/bloom-settings';
import {
  BREW_DESIGN_PREVIEW_READY,
  DEFAULT_BREW_SETTINGS,
  isBrewPreviewUpdate,
  normalizeBrewTemplateSettings,
  type BrewTemplateSettings,
} from '../constants/brew-settings';

import {
  DEFAULT_EDITORIAL_SETTINGS,
  EDITORIAL_DESIGN_PREVIEW_READY,
  isEditorialPreviewUpdate,
  normalizeEditorialTemplateSettings,
  type EditorialTemplateSettings,
} from '../constants/editorial-settings';
import {
  DEFAULT_EMBER_SETTINGS,
  EMBER_DESIGN_PREVIEW_READY,
  isEmberPreviewUpdate,
  normalizeEmberTemplateSettings,
  type EmberTemplateSettings,
} from '../constants/ember-settings';
import {
  DEFAULT_MAKKBOZ_SETTINGS,
  normalizeMakkbozSettings,
  type MakkbozMenuSettings,
} from '../constants/makkboz-settings';
import {
  DEFAULT_MEAT_LOVERS_SETTINGS,
  normalizeMeatLoversSettings,
  type MeatLoversMenuSettings,
} from '../constants/meat-lovers-settings';

import {
  DEFAULT_SHERBINY_SETTINGS,
  normalizeSherbinySettings,
  type SherbinyMenuSettings,
} from '../constants/sherbiny-settings';
import {
  DEFAULT_VERDE_SETTINGS,
  normalizeVerdeSettings,
  type VerdeMenuSettings,
} from '../constants/verde-settings';

import type { PublicMenuViewProps } from '../types/menu-view';

import {
  MAKKBOZ_DESIGN_PREVIEW_READY,
  isMakkbozPreviewUpdate,
} from '../utils/makkboz-preview';
import {
  MEAT_LOVERS_DESIGN_PREVIEW_READY,
  isMeatLoversPreviewUpdate,
} from '../utils/meat-lovers-preview';

import {
  SHERBINY_DESIGN_PREVIEW_READY,
  isSherbinyPreviewUpdate,
} from '../utils/sherbiny-preview';

import {
  VERDE_DESIGN_PREVIEW_READY,
  isVerdePreviewUpdate,
} from '../utils/verde-preview';

export function useMenuDesignPreview({
  data,
  template = DEFAULT_MENU_TEMPLATE,
  designPreview = false,
  exclusiveRendererKey,
}: Omit<PublicMenuViewProps, 'publicCode'>) {
  const [emberLiveDraft, setEmberLiveDraft] =
    useState<EmberTemplateSettings | null>(null);
  useEffect(() => {
    if (!designPreview || template !== 'ember' || window.parent === window)
      return;
    const onDraftMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isEmberPreviewUpdate(event.data)
      )
        return;
      // Treat messages as untrusted display data; normalize the allowlisted
      // palette, motion, localized copy and server-owned image asset path.
      setEmberLiveDraft(normalizeEmberTemplateSettings(event.data.settings));
    };
    window.addEventListener('message', onDraftMessage);
    // Child -> parent handshake covers hydration after iframe load.
    window.parent.postMessage(
      { type: EMBER_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', onDraftMessage);
  }, [designPreview, template]);
  const emberSettings =
    designPreview && template === 'ember' && emberLiveDraft
      ? emberLiveDraft
      : (data.context.restaurant.emberSettings ?? DEFAULT_EMBER_SETTINGS);
  const [bloomLiveDraft, setBloomLiveDraft] =
    useState<BloomTemplateSettings | null>(null);
  useEffect(() => {
    if (!designPreview || template !== 'bloom' || window.parent === window)
      return;
    const onBloomDraft = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isBloomPreviewUpdate(event.data)
      )
        return;
      setBloomLiveDraft(normalizeBloomTemplateSettings(event.data.settings));
    };
    window.addEventListener('message', onBloomDraft);
    window.parent.postMessage(
      { type: BLOOM_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', onBloomDraft);
  }, [designPreview, template]);
  const bloomSettings =
    designPreview && template === 'bloom' && bloomLiveDraft
      ? bloomLiveDraft
      : (data.context.restaurant.bloomSettings ?? DEFAULT_BLOOM_SETTINGS);
  const [brewLiveDraft, setBrewLiveDraft] =
    useState<BrewTemplateSettings | null>(null);
  useEffect(() => {
    if (!designPreview || template !== 'brew' || window.parent === window)
      return;
    const listen = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isBrewPreviewUpdate(event.data)
      )
        return;
      setBrewLiveDraft(normalizeBrewTemplateSettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage(
      { type: BREW_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', listen);
  }, [designPreview, template]);
  const brewSettings =
    designPreview && template === 'brew' && brewLiveDraft
      ? brewLiveDraft
      : (data.context.restaurant.brewSettings ?? DEFAULT_BREW_SETTINGS);
  const [editorialLiveDraft, setEditorialLiveDraft] =
    useState<EditorialTemplateSettings | null>(null);
  useEffect(() => {
    if (!designPreview || template !== 'editorial' || window.parent === window)
      return;
    const handlePreview = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isEditorialPreviewUpdate(event.data)
      )
        return;
      setEditorialLiveDraft(
        normalizeEditorialTemplateSettings(event.data.settings),
      );
    };
    window.addEventListener('message', handlePreview);
    window.parent.postMessage(
      { type: EDITORIAL_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', handlePreview);
  }, [designPreview, template]);
  const editorialSettings =
    designPreview && template === 'editorial' && editorialLiveDraft
      ? editorialLiveDraft
      : (data.context.restaurant.editorialSettings ??
        DEFAULT_EDITORIAL_SETTINGS);
  const isVerde = exclusiveRendererKey === 'VERDE_NAPOLI_V1';
  const [verdeLiveDraft, setVerdeLiveDraft] =
    useState<VerdeMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isVerde || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isVerdePreviewUpdate(event.data)
      )
        return;
      setVerdeLiveDraft(normalizeVerdeSettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage(
      { type: VERDE_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isVerde]);
  const verdeSettings: VerdeMenuSettings | null = isVerde
    ? designPreview && verdeLiveDraft
      ? verdeLiveDraft
      : (data.context.restaurant.verdeSettings ?? DEFAULT_VERDE_SETTINGS)
    : null;
  const isSherbiny = exclusiveRendererKey === 'SHERBINY_FIRE_DOUGH_V1';
  const [sherbinyLiveDraft, setSherbinyLiveDraft] =
    useState<SherbinyMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isSherbiny || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isSherbinyPreviewUpdate(event.data)
      )
        return;
      setSherbinyLiveDraft(normalizeSherbinySettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage(
      { type: SHERBINY_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isSherbiny]);
  const sherbinySettings: SherbinyMenuSettings | null = isSherbiny
    ? designPreview && sherbinyLiveDraft
      ? sherbinyLiveDraft
      : (data.context.restaurant.sherbinySettings ?? DEFAULT_SHERBINY_SETTINGS)
    : null;
  const isMakkboz = exclusiveRendererKey === 'MAKKBOZ_HERITAGE_V1';
  const [makkbozLiveDraft, setMakkbozLiveDraft] =
    useState<MakkbozMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isMakkboz || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isMakkbozPreviewUpdate(event.data)
      )
        return;
      setMakkbozLiveDraft(normalizeMakkbozSettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage(
      { type: MAKKBOZ_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isMakkboz]);
  const makkbozSettings: MakkbozMenuSettings | null = isMakkboz
    ? designPreview && makkbozLiveDraft
      ? makkbozLiveDraft
      : (data.context.restaurant.makkbozSettings ?? DEFAULT_MAKKBOZ_SETTINGS)
    : null;
  const isMeatLovers = exclusiveRendererKey === 'MEAT_LOVERS_BUTCHER_V1';
  const [meatLoversLiveDraft, setMeatLoversLiveDraft] =
    useState<MeatLoversMenuSettings | null>(null);
  useEffect(() => {
    if (!designPreview || !isMeatLovers || window.parent === window) return;
    const listen = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        !isMeatLoversPreviewUpdate(event.data)
      )
        return;
      setMeatLoversLiveDraft(normalizeMeatLoversSettings(event.data.settings));
    };
    window.addEventListener('message', listen);
    window.parent.postMessage(
      { type: MEAT_LOVERS_DESIGN_PREVIEW_READY },
      window.location.origin,
    );
    return () => window.removeEventListener('message', listen);
  }, [designPreview, isMeatLovers]);
  const meatLoversSettings: MeatLoversMenuSettings | null = isMeatLovers
    ? designPreview && meatLoversLiveDraft
      ? meatLoversLiveDraft
      : (data.context.restaurant.meatLoversSettings ??
        DEFAULT_MEAT_LOVERS_SETTINGS)
    : null;
  return {
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
  };
}
