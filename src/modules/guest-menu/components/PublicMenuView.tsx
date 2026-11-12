'use client';

import dynamic from 'next/dynamic';
import { WaytaLockup } from '../../../components/brand/Wayta';
import { DEFAULT_MENU_TEMPLATE } from '../../../config/menu-templates';
import { resolveAssetUrl } from '../../../lib/infrastructure/asset-url';
import { usePublicMenuController } from '../hooks/use-public-menu-controller';
import type { PublicMenuViewProps } from '../types/menu-view';
import { sanitizeWhileTyping } from '../utils/checkout-validation';
import {
  OFFERS_SECTION_ID
} from '../utils/offers';
import { readTrackedOrders } from '../utils/tracking';
import { AnnouncementBar } from './AnnouncementBar';
import { CartBar } from './CartBar';
import { CartPanel } from './CartPanel';
import { CategoryChips } from './CategoryChips';
import { FeaturedBanners } from './FeaturedBanners';
import { GuestContact } from './GuestContact';
import { GuestHero, type GuestHeroProps } from './GuestHero';
import { GuestHeroBloom } from './GuestHeroBloom';
import { GuestHeroBrew } from './GuestHeroBrew';
import { GuestHeroEmber } from './GuestHeroEmber';
import {
  GuestHeroCentered,
  GuestHeroCompact,
  GuestHeroEditorial,
  GuestHeroFloating,
} from './GuestHeroVariants';
import { GuestLocaleProvider } from './GuestLocale';
import { MenuSections } from './MenuSections';
import { ModeSwitch } from './ModeSwitch';
import { OfferSheet } from './OfferSheet';
import { OffersStrip } from './OffersStrip';
import { ProductSheet } from './ProductSheet';
import { SearchField } from './SearchField';
import { TableClosedNotice } from './TableClosedNotice';
import { TrackOrderSheet } from './TrackOrderSheet';
import type {
  DesignOffers
} from './guest-view-types';
import { GuestIconInfo } from './icons';

// Loaded on demand: other Restaurants' menus never download the VERDE renderer, its CSS or its fonts.
const VerdeMenu = dynamic(() => import('./verde/VerdeMenu').then((module) => module.VerdeMenu));
// Same on-demand rule for the El Sherbiny renderer (its CSS and Arabic font stay out of every other menu).
const SherbinyMenu = dynamic(() => import('./sherbiny/SherbinyMenu').then((module) => module.SherbinyMenu));
const MakkbozMenu = dynamic(() => import('./makkboz/MakkbozMenu').then((module) => module.MakkbozMenu));
const MeatLoversMenu = dynamic(() => import('./meat-lovers/MeatLoversMenu').then((module) => module.MeatLoversMenu));



/**
 * The Guest Menu (FT-3/FT-5, FT-13A architecture, FT-13B "Ember & Saffron" look): the hero,
 * the ordering-mode switch and search, sticky category chips, the featured banners, the menu
 * itself and -- for any QR with something orderable -- the cart/checkout.
 *
 * This component owns the state and the business wiring (Cart identity, checkout fields,
 * Branch/zone resolution, idempotent submission); everything visual lives in the small
 * components it composes. It is a Client Component because the Cart needs React state,
 * localStorage and a browser `fetch`; Next.js still server-renders the first paint. The
 * theme (`data-guest-theme`) comes from the /q layout, so it is already right on first paint.
 *
 * `dir` is set on this component's own root, not the document `<html>` (shared with Staff)
 * -- everything inside mirrors for Arabic through logical utilities only.
 */
export function PublicMenuView({
  data,
  publicCode,
  template = DEFAULT_MENU_TEMPLATE,
  designPreview = false,
  exclusiveRendererKey,
  guestTheme = null,
}: PublicMenuViewProps) {
  const { locale, dir, currency, logoUrl, coverUrl, copy, emberSettings, bloomSettings, brewSettings, editorialSettings, isVerde, verdeSettings, isSherbiny, sherbinySettings, isMakkboz, makkbozSettings, isMeatLovers, meatLoversSettings, hasCategories, premiumCategoryId, isGenericQr,
    pickupAvailable,
    deliveryAvailable, canOrder, orderingContext, branchLine, offers, offersCopy, layout, showPhotos, featuredProducts, query, setQuery, isSearching, visibleCategories, isPremiumSingleCategory, premiumVisibleCategories, searchResultCount, showOffers, showFeatured, selectPremiumCategory, navigation, chipItems, isCartOpen, setIsCartOpen, isSubmitting, submitError, isRecheckingOrdering, orderingRecheck, tableLocked, confirmedOrder, setSelectedBranchId, isTrackOpen, setIsTrackOpen, whatsappHandoff, hasActiveOrder, setHasActiveOrder, setSelectedZoneId, fields, setFields, fulfillment, isDelivery, eligibleBranches, resolvedBranchId, zones, resolvedZoneId, selectedZone, validation, sheetProduct, editing, simpleQuantityByProductId, totalQuantityByProductId, handleQuickAdd, suggestedProducts, handleOpenProduct, handleConfirmOptions, closeSheet, sheetOffer, editingOffer, handleOpenOffer, closeOfferSheet, handleConfirmOffer, handleEditLine, handleIncrement, handleDecrement, handleRemove, handleCardIncrement, handleCardDecrement, handleClearSearch, handleJumpToSearch, cartLines, totalDisplay, discountDisplay, cartCount, deliveryFeeDisplay, grandTotalDisplay, minimumMessage, minimumShortfallDisplay, canSubmit, trackingAvailable, whatsappAction, submitHint, checkOrderingAgain, handlePlaceOrder, openTracking, closeCart, handleFulfillmentChange, showCartBar, showModeSwitch, cartBarModeLabel, emberAutoPhotoUrl, emberPhotoUrl } = usePublicMenuController({ data, publicCode, template, designPreview, exclusiveRendererKey, guestTheme });

  const heroProps: GuestHeroProps = {
    sentinelRef: navigation.headerRef,
    restaurantName: data.context.restaurant.name,
    logoUrl,
    coverUrl,
    menuDescription: data.menu.description,
    emberHeadline: locale === 'ar' ? emberSettings.headlineAr : emberSettings.headlineEn,
    emberSubtitle: locale === 'ar' ? emberSettings.subtitleAr : emberSettings.subtitleEn,
    emberNavTagline: locale === 'ar' ? emberSettings.navTaglineAr : emberSettings.navTaglineEn,
    emberEyebrow: locale === 'ar' ? emberSettings.eyebrowAr : emberSettings.eyebrowEn,
    emberSignature: locale === 'ar' ? emberSettings.signatureAr : emberSettings.signatureEn,
    emberMarquee: locale === 'ar' ? emberSettings.marqueeAr : emberSettings.marqueeEn,
    emberPhotoUrl,
    emberPhotoFallbackUrl: emberAutoPhotoUrl,
    emberCartCount: cartCount,
    emberDesignPreview: designPreview,
    brewNavTagline:locale==='ar'?brewSettings.navTaglineAr:brewSettings.navTaglineEn,
    brewEyebrow:locale==='ar'?brewSettings.eyebrowAr:brewSettings.eyebrowEn,
    brewHeadlineTop:locale==='ar'?brewSettings.headlineTopAr:brewSettings.headlineTopEn,
    brewHeadlineBottom:locale==='ar'?brewSettings.headlineBottomAr:brewSettings.headlineBottomEn,
    brewSubtitle:locale==='ar'?brewSettings.subtitleAr:brewSettings.subtitleEn,
    brewStory:locale==='ar'?brewSettings.storyAr:brewSettings.storyEn,
    brewCartCount:cartCount,
    onBrewCartOpen:canOrder?()=>setIsCartOpen(true):undefined,
    bloomRibbon: locale === 'ar' ? bloomSettings.ribbonAr : bloomSettings.ribbonEn,
    bloomNavTagline: locale === 'ar' ? bloomSettings.navTaglineAr : bloomSettings.navTaglineEn,
    bloomEyebrow: locale === 'ar' ? bloomSettings.eyebrowAr : bloomSettings.eyebrowEn,
    bloomHeadlineTop: locale === 'ar' ? bloomSettings.headlineTopAr : bloomSettings.headlineTopEn,
    bloomHeadlineMiddle: locale === 'ar' ? bloomSettings.headlineMiddleAr : bloomSettings.headlineMiddleEn,
    bloomHeadlineBottom: locale === 'ar' ? bloomSettings.headlineBottomAr : bloomSettings.headlineBottomEn,
    bloomSubtitle: locale === 'ar' ? bloomSettings.subtitleAr : bloomSettings.subtitleEn,
    bloomCta: locale === 'ar' ? bloomSettings.ctaAr : bloomSettings.ctaEn,
    bloomHeroImageUrl: bloomSettings.heroImageMode === 'CUSTOM' ? resolveAssetUrl(bloomSettings.heroImageAssetPath) : null,
    bloomCartCount: cartCount,
    onBloomCartOpen: canOrder ? () => setIsCartOpen(true) : undefined,
    onEmberCartOpen: canOrder ? () => setIsCartOpen(true) : undefined,
    tableNumber: data.context.table?.number ?? null,
    branchLine,
    copy,
    locale: data.locale,
    publicCode,
    shareCode: data.context.restaurant.shareCode,
    contact: data.context.restaurant.contact,
    hours: data.context.restaurant.hours,
    onTrack: trackingAvailable ? openTracking : null,
    hasActiveOrder,
  };
  const Hero =
    isVerde || isSherbiny || isMakkboz || isMeatLovers ? GuestHeroCompact : layout.hero === 'brew' ? GuestHeroBrew : layout.hero === 'bloom'
      ? GuestHeroBloom
      : layout.hero === 'ember'
      ? GuestHeroEmber
      : layout.hero === 'floating'
      ? GuestHeroFloating
      : layout.hero === 'centered'
        ? GuestHeroCentered
        : layout.hero === 'editorial'
          ? GuestHeroEditorial
        : layout.hero === 'compact'
          ? GuestHeroCompact
          : GuestHero;
  // Only the classic hero is tall enough for the announcement and order bars to overlap its edge.
  const overlapsHero = layout.hero === 'classic';

  const overlays = (
    <>
        {isTrackOpen ? (
          <TrackOrderSheet
            publicCode={publicCode}
            copy={copy}
            locale={locale}
            dir={dir}
            onClose={() => {
              setIsTrackOpen(false);
              setHasActiveOrder(readTrackedOrders(publicCode).length > 0);
            }}
          />
        ) : null}

        {showCartBar ? (
          <CartBar
            count={cartCount}
            totalDisplay={totalDisplay}
            currency={currency}
            modeLabel={cartBarModeLabel}
            copy={copy}
            onOpen={() => setIsCartOpen(true)}
          />
        ) : null}

        {canOrder && (isCartOpen || confirmedOrder || whatsappHandoff) ? (
          <CartPanel
            copy={copy}
            currency={currency}
            locale={locale}
            dir={dir}
            context={orderingContext}
            lines={cartLines}
            count={cartCount}
            totalDisplay={totalDisplay}
            discountDisplay={discountDisplay}
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            submitError={submitError}
            submitHint={submitHint}
            orderingClosed={
              tableLocked
                ? {
                    isChecking: isRecheckingOrdering,
                    status: orderingRecheck,
                    onCheckAgain: () => void checkOrderingAgain(),
                  }
                : null
            }
            confirmedOrder={confirmedOrder}
            checkout={
              isGenericQr
                ? {
                    fulfillment,
                    pickupAvailable,
                    deliveryAvailable,
                    onFulfillmentChange: handleFulfillmentChange,
                    branches: eligibleBranches.map((branch) => ({
                      id: branch.id,
                      name: branch.name,
                    })),
                    branchId: resolvedBranchId,
                    onBranchChange: (branchId) => {
                      setSelectedBranchId(branchId);
                      setSelectedZoneId(null);
                    },
                    zones,
                    zoneId: resolvedZoneId,
                    onZoneChange: setSelectedZoneId,
                    fields,
                    onFieldChange: (key, value) => {
                      validation.onFieldEdited(key);
                      setFields((prev) => ({ ...prev, [key]: sanitizeWhileTyping(key, value) }));
                    },
                    fieldErrors: validation.fieldErrors,
                    onFieldBlur: validation.onFieldBlur,
                    subtotalDisplay: totalDisplay,
                    deliveryFeeDisplay: isDelivery && selectedZone ? deliveryFeeDisplay : null,
                    grandTotalDisplay: isDelivery ? grandTotalDisplay : totalDisplay,
                    minimumMessage,
                    minimumShortfallDisplay,
                  }
                : null
            }
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
            onEditLine={handleEditLine}
            onPlaceOrder={() => void handlePlaceOrder()}
            onClose={closeCart}
            onTrackOrder={trackingAvailable ? openTracking : null}
            showPhotos={showPhotos}
            suggestions={suggestedProducts}
            onAddSuggestion={handleQuickAdd}
            whatsapp={whatsappAction}
            whatsappHandoff={whatsappHandoff}
          />
        ) : null}

        {sheetProduct ? (
          <ProductSheet
            key={sheetProduct.id}
            product={sheetProduct}
            currency={currency}
            copy={copy}
            dir={dir}
            initial={editing ?? undefined}
            showPhotos={showPhotos}
            onCancel={closeSheet}
            onConfirm={handleConfirmOptions}
          />
        ) : null}

        {sheetOffer ? (
          <OfferSheet
            key={`${sheetOffer.id}:${editingOffer?.lineKey ?? 'new'}`}
            offer={sheetOffer}
            currency={currency}
            copy={copy}
            offersCopy={offersCopy}
            dir={dir}
            initial={editingOffer ?? undefined}
            showPhotos={showPhotos}
            onCancel={closeOfferSheet}
            onConfirm={handleConfirmOffer}
          />
        ) : null}
    </>
  );
  // Offers (DEC-069) for the exclusive designs: the same shared strip, dressed by the design's own tokens, plus the first chip.
  const designOffers: DesignOffers | null = showOffers
    ? {
        strip: (
          <OffersStrip
            offers={offers}
            currency={currency}
            offersCopy={offersCopy}
            canOrder={canOrder}
            showPhotos={showPhotos}
            onOpen={handleOpenOffer}
            showNavigation={isMakkboz}
          />
        ),
        chipLabel: offersCopy.sectionTitle,
        onJump: () => selectPremiumCategory(OFFERS_SECTION_ID),
      }
    : null;
  const poweredByLink = data.context.platform?.poweredByUrl ?? 'https://waytaapp.com/';
  const verdePoweredBy = (
    <>
      <span>{copy.poweredBy}</span>
      <a href={poweredByLink} aria-label="Wayta ويتا" className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-accent">
        <WaytaLockup tone="auto" size={16} className="[--wayta-ink:currentColor]" />
      </a>
    </>
  );
  const verdeNotices = (
    <div className="empty:hidden">
      <AnnouncementBar announcements={data.context.announcements ?? []} publicCode={publicCode} copy={copy} />
    </div>
  );
  // Makkboz keeps fulfillment selection in the cart; important ordering notices remain visible here.
  const verdeOrdering = (
    <>
      {showModeSwitch && !isMakkboz ? (
        <div className="flex min-w-0 gap-1 rounded-[26px] border border-g-line bg-g-surface p-1">
          <ModeSwitch variant="hero" value={fulfillment} pickupAvailable={pickupAvailable} deliveryAvailable={deliveryAvailable} onChange={handleFulfillmentChange} copy={copy} />
        </div>
      ) : null}
      {tableLocked ? (
        <TableClosedNotice copy={copy} isChecking={isRecheckingOrdering} status={orderingRecheck} onCheckAgain={() => void checkOrderingAgain()} />
      ) : orderingRecheck === 'reopened' ? (
        <p role="status" className="rounded-2xl border border-g-line bg-g-surface-2 px-4 py-3 text-[14px] font-semibold text-g-text">{copy.tableOrderingReopened}</p>
      ) : null}
      {!canOrder ? (
        <p className="flex items-start gap-3 rounded-[22px] border border-g-line bg-g-surface px-4 py-3.5 text-[14px] leading-[1.7] text-g-text-2">
          <GuestIconInfo className="mt-0.5 size-5 shrink-0 text-g-accent-text" />
          {copy.pickupUnavailable}
        </p>
      ) : null}
      {isGenericQr && canOrder && data.context.restaurant.hours?.open === false ? (
        <p className="flex items-start gap-3 rounded-[22px] border border-g-line bg-g-surface px-4 py-3.5 text-[14px] leading-[1.7] text-g-text-2">
          <GuestIconInfo className="mt-0.5 size-5 shrink-0 text-g-accent-text" />
          {copy.branchClosedNotice}
        </p>
      ) : null}
    </>
  );

  return (
    <GuestLocaleProvider locale={locale}>
      <div
          dir={dir}
          lang={locale}
          className={`g-body relative ${template === 'ember' ? 'ember-experience' : template === 'bloom' ? 'bloom-experience' : template === 'brew' ? 'brew-experience' : ''}`}
          data-ember-palette={template === 'ember' ? emberSettings.palette : undefined}
          data-ember-motion={template === 'ember' ? emberSettings.motion : undefined}
          data-brew-palette={template==='brew'?brewSettings.palette:undefined}
          data-brew-motion={template==='brew'?brewSettings.motion:undefined}
          data-bloom-palette={template === 'bloom' ? bloomSettings.palette : undefined}
          data-bloom-motion={template === 'bloom' ? bloomSettings.motion : undefined}
        >
        {meatLoversSettings ? (
          <MeatLoversMenu
            settings={meatLoversSettings}
            guestTheme={guestTheme}
            restaurantName={data.context.restaurant.name}
            logoUrl={logoUrl}
            locale={locale}
            availableLocales={data.locale.available}
            publicCode={publicCode}
            designPreview={designPreview}
            copy={copy}
            currency={currency}
            categories={data.menu.categories}
            visibleCategories={visibleCategories}
            query={query}
            onQueryChange={setQuery}
            canOrder={canOrder}
            simpleQuantityByProductId={simpleQuantityByProductId}
            totalQuantityByProductId={totalQuantityByProductId}
            onOpenProduct={handleOpenProduct}
            onQuickAdd={handleQuickAdd}
            onIncrement={handleCardIncrement}
            onDecrement={handleCardDecrement}
            cartCount={cartCount}
            onOpenCart={canOrder ? () => setIsCartOpen(true) : null}
            onTrack={trackingAvailable ? openTracking : null}
            hasActiveOrder={hasActiveOrder}
            shareCode={data.context.restaurant.shareCode}
            contact={data.context.restaurant.contact}
            locations={data.context.locations ?? []}
            hours={data.context.restaurant.hours}
            notices={verdeNotices}
            orderingBar={verdeOrdering}
            offers={designOffers}
            poweredBy={verdePoweredBy}
          >
            {overlays}
          </MeatLoversMenu>
        ) : makkbozSettings ? (
          <MakkbozMenu
            settings={makkbozSettings}
            guestTheme={guestTheme}
            restaurantName={data.context.restaurant.name}
            logoUrl={logoUrl}
            locale={locale}
            availableLocales={data.locale.available}
            publicCode={publicCode}
            designPreview={designPreview}
            copy={copy}
            currency={currency}
            categories={data.menu.categories}
            visibleCategories={visibleCategories}
            query={query}
            onQueryChange={setQuery}
            canOrder={canOrder}
            simpleQuantityByProductId={simpleQuantityByProductId}
            totalQuantityByProductId={totalQuantityByProductId}
            onOpenProduct={handleOpenProduct}
            onQuickAdd={handleQuickAdd}
            onIncrement={handleCardIncrement}
            onDecrement={handleCardDecrement}
            cartCount={cartCount}
            onOpenCart={canOrder ? () => setIsCartOpen(true) : null}
            onTrack={trackingAvailable ? openTracking : null}
            hasActiveOrder={hasActiveOrder}
            shareCode={data.context.restaurant.shareCode}
            contact={data.context.restaurant.contact}
            locations={data.context.locations ?? []}
            hours={data.context.restaurant.hours}
            notices={verdeNotices}
            orderingBar={verdeOrdering}
            offers={designOffers}
            poweredBy={verdePoweredBy}
          >
            {overlays}
          </MakkbozMenu>
        ) : sherbinySettings ? (
          <SherbinyMenu
            settings={sherbinySettings}
            guestTheme={guestTheme}
            restaurantName={data.context.restaurant.name}
            logoUrl={logoUrl}
            coverUrl={resolveAssetUrl(data.context.restaurant.coverAssetPath)}
            locale={locale}
            availableLocales={data.locale.available}
            publicCode={publicCode}
            designPreview={designPreview}
            copy={copy}
            currency={currency}
            categories={data.menu.categories}
            visibleCategories={visibleCategories}
            query={query}
            onQueryChange={setQuery}
            activeCategoryId={premiumCategoryId}
            onSelectCategory={selectPremiumCategory}
            canOrder={canOrder}
            simpleQuantityByProductId={simpleQuantityByProductId}
            totalQuantityByProductId={totalQuantityByProductId}
            onOpenProduct={handleOpenProduct}
            onQuickAdd={handleQuickAdd}
            onIncrement={handleCardIncrement}
            onDecrement={handleCardDecrement}
            cartCount={cartCount}
            onOpenCart={canOrder ? () => setIsCartOpen(true) : null}
            onTrack={trackingAvailable ? openTracking : null}
            hasActiveOrder={hasActiveOrder}
            shareCode={data.context.restaurant.shareCode}
            contact={data.context.restaurant.contact}
            locations={data.context.locations ?? []}
            hours={data.context.restaurant.hours}
            notices={verdeNotices}
            orderingBar={verdeOrdering}
            offers={designOffers}
            poweredBy={verdePoweredBy}
          >
            {overlays}
          </SherbinyMenu>
        ) : verdeSettings ? (
          <VerdeMenu
            settings={verdeSettings}
            restaurantName={data.context.restaurant.name}
            logoUrl={logoUrl}
            locale={locale}
            availableLocales={data.locale.available}
            publicCode={publicCode}
            designPreview={designPreview}
            copy={copy}
            currency={currency}
            categories={data.menu.categories}
            visibleCategories={visibleCategories}
            query={query}
            onQueryChange={setQuery}
            activeCategoryId={premiumCategoryId}
            onSelectCategory={selectPremiumCategory}
            canOrder={canOrder}
            simpleQuantityByProductId={simpleQuantityByProductId}
            totalQuantityByProductId={totalQuantityByProductId}
            onOpenProduct={handleOpenProduct}
            onQuickAdd={handleQuickAdd}
            onIncrement={handleCardIncrement}
            onDecrement={handleCardDecrement}
            cartCount={cartCount}
            onOpenCart={canOrder ? () => setIsCartOpen(true) : null}
            onTrack={trackingAvailable ? openTracking : null}
            hasActiveOrder={hasActiveOrder}
            shareCode={data.context.restaurant.shareCode}
            notices={verdeNotices}
            orderingBar={verdeOrdering}
            offers={designOffers}
            contact={<GuestContact contact={data.context.restaurant.contact} copy={copy} />}
            poweredBy={verdePoweredBy}
          >
            {overlays}
          </VerdeMenu>
        ) : (
          <>
        <Hero {...heroProps} />

        <div className="relative z-20 px-4 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className={`announce-slot ${overlapsHero ? '-mt-7' : 'mt-4'} mb-3 empty:hidden`}>
              <AnnouncementBar
                announcements={data.context.announcements ?? []}
                publicCode={publicCode}
                copy={copy}
              />
            </div>
            <div
              className={`${showModeSwitch ? 'flex' : 'hidden lg:flex'} g-shadow ${template === 'ember' ? 'ember-v2-toolbar' : ''} ${overlapsHero ? '-mt-7' : 'mt-4'} [.announce-slot:not(:empty)+&]:mt-0 items-center justify-between gap-4 rounded-[30px] border border-g-line bg-g-surface p-[5px] lg:rounded-[32px] lg:p-2`}
            >
              {showModeSwitch ? (
                <div className="flex min-w-0 flex-1 gap-1 lg:flex-none lg:rounded-[26px] lg:bg-g-surface-2 lg:p-0.5">
                  <ModeSwitch
                    variant="hero"
                    value={fulfillment}
                    pickupAvailable={pickupAvailable}
                    deliveryAvailable={deliveryAvailable}
                    onChange={handleFulfillmentChange}
                    copy={copy}
                  />
                </div>
              ) : null}
              <SearchField
                id="guest-search-desktop"
                variant="desktop"
                value={query}
                onChange={setQuery}
                placeholder={copy.searchPlaceholder}
                label={copy.searchMenu}
                clearLabel={copy.clearSearch}
                className="hidden max-w-[460px] flex-1 lg:flex"
              />
            </div>
            <SearchField
              id="guest-search-phone"
              variant="phone"
              value={query}
              onChange={setQuery}
              placeholder={copy.searchPlaceholder}
              label={copy.searchMenu}
              clearLabel={copy.clearSearch}
              className="mt-5 lg:hidden"
            />
            {tableLocked ? (
              <TableClosedNotice
                className="mt-4"
                copy={copy}
                isChecking={isRecheckingOrdering}
                status={orderingRecheck}
                onCheckAgain={() => void checkOrderingAgain()}
              />
            ) : orderingRecheck === 'reopened' ? (
              <p
                role="status"
                className="mt-4 rounded-2xl border border-g-line bg-g-surface-2 px-4 py-3 text-[14px] font-semibold text-g-text"
              >
                {copy.tableOrderingReopened}
              </p>
            ) : null}
          </div>
        </div>

        {/* A sticky element only sticks inside its parent: the chips must be a direct child of
            this page-height root (no short wrapper), or the bar scrolls away with its own box. */}
        {hasCategories ? (
          <CategoryChips
            items={chipItems}
            activeId={isPremiumSingleCategory ? premiumCategoryId : navigation.activeId}
            onSelect={isPremiumSingleCategory ? selectPremiumCategory : navigation.select}
            compact={navigation.compact}
            onJumpToSearch={handleJumpToSearch}
            copy={copy}
            template={template}
          />
        ) : null}

        <main
          id={isPremiumSingleCategory ? 'premium-menu-start' : undefined}
          className={`scroll-mt-[76px] px-4 pt-5 lg:px-8 lg:pt-7 ${showCartBar ? 'pb-[150px]' : 'pb-16'}`}
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-[34px] lg:gap-[52px]">
            {!canOrder ? (
              <p className="flex items-start gap-3 rounded-[22px] border border-g-line bg-g-surface px-4 py-3.5 text-[14px] leading-[1.7] text-g-text-2">
                <GuestIconInfo className="mt-0.5 size-5 shrink-0 text-g-accent-text" />
                {copy.pickupUnavailable}
              </p>
            ) : null}

            {isGenericQr && canOrder && data.context.restaurant.hours?.open === false ? (
              <p className="flex items-start gap-3 rounded-[22px] border border-g-line bg-g-surface px-4 py-3.5 text-[14px] leading-[1.7] text-g-text-2">
                <GuestIconInfo className="mt-0.5 size-5 shrink-0 text-g-accent-text" />
                {copy.branchClosedNotice}
              </p>
            ) : null}

            {showOffers ? (
              <OffersStrip
                offers={offers}
                currency={currency}
                offersCopy={offersCopy}
                canOrder={canOrder}
                showPhotos={showPhotos}
                onOpen={handleOpenOffer}
              />
            ) : null}

            {showFeatured ? (
              <FeaturedBanners
                products={featuredProducts}
                currency={currency}
                copy={copy}
                canOrder={canOrder}
                onOpen={handleOpenProduct}
                onQuickAdd={handleQuickAdd}
              />
            ) : null}

            {isSearching && searchResultCount > 0 ? (
              <p role="status" className="-mb-4 text-sm font-semibold text-g-text-2">
                {copy.searchResultsCount(searchResultCount)}
              </p>
            ) : null}

            <MenuSections
              categories={premiumVisibleCategories}
              menuCategoryCount={data.menu.categories.length}
              currency={currency}
              copy={copy}
              canOrder={canOrder}
              searchQuery={isSearching ? query : ''}
              simpleQuantityByProductId={simpleQuantityByProductId}
              totalQuantityByProductId={totalQuantityByProductId}
              onOpen={handleOpenProduct}
              onQuickAdd={handleQuickAdd}
              onIncrement={handleCardIncrement}
              onDecrement={handleCardDecrement}
              onClearSearch={handleClearSearch}
              brewSettings={template==='brew'?brewSettings:undefined}
              brewLocale={locale}
              bloomSectionEyebrow={locale === 'ar' ? bloomSettings.sectionEyebrowAr : bloomSettings.sectionEyebrowEn}
              bloomSectionHeadline={locale === 'ar' ? bloomSettings.sectionHeadlineAr : bloomSettings.sectionHeadlineEn}
              editorialPriceDisplay={template==='editorial'?editorialSettings.priceDisplay:undefined}
              template={template}
            />
          </div>
        </main>

        <GuestContact contact={data.context.restaurant.contact} copy={copy} />

        <footer className="flex items-center justify-center gap-2 px-4 pb-28 pt-6 text-[11px] text-muted-foreground">
          <span>{copy.poweredBy}</span>
          <a
            href={
              data.context.platform?.poweredByUrl ??
              'https://waytaapp.com/'
            }
            aria-label="Wayta ويتا"
            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-accent"
          >
            <WaytaLockup tone="auto" size={16} className="[--wayta-ink:currentColor]" />
          </a>
        </footer>

{overlays}
          </>
        )}
      </div>
    </GuestLocaleProvider>
  );
}
