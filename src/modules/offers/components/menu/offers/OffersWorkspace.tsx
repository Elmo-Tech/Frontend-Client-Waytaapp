'use client';
import { OfferEditor } from './OfferEditor';

import { useOffersEditor } from './use-offers-editor';

import { STATE_VARIANT, emptyDraft, toDraft } from './offer-draft';

import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { Button } from '../../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../../components/ui/ConfirmDialog';

import { LoadingState } from '../../../../../components/ui/LoadingState';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { SectionCard } from '../../../../../components/ui/SectionCard';

import { Switch } from '../../../../../components/ui/Switch';

import type { MessageKey } from '../../../../../lib/i18n/messages/index';
import { resolveAssetUrl } from '../../../../../lib/infrastructure/asset-url';
import { formatMoney } from '../../../../guest-menu/price-format';

import { MenuHubBackLink } from '../../../../menu/menu-hub-back-link';
import { MenuSectionTabs } from '../../../../menu/menu-section-tabs';

/**
 * The shared "add an item from the menu" control: one dropdown of the menu's products (one entry per size when a product
 * has sizes), grouped by category. Picking one adds it and resets the dropdown.
 */
export function OffersWorkspace({
  restaurantId,
  defaultLocale,
  currencyCode,
  canManage,
}: {
  restaurantId: string;
  defaultLocale: string;
  currencyCode: string;
  canManage: boolean;
}) {
  const editor = useOffersEditor(restaurantId, defaultLocale);
  const {
    reload,
    t,
    tp,
    locale,
    items,
    error,
    notice,
    draft,
    saving,
    busyId,
    toDelete,
    setToDelete,
    openEditor,
    handleToggle,
    handleMove,
    handleDelete,
    daysText,
    shownName,
  } = editor;

  if (draft)
    return (
      <OfferEditor
        editor={editor}
        draft={draft}
        defaultLocale={defaultLocale}
        currencyCode={currencyCode}
      />
    );

  // -------------------------------------------------------------------- list
  return (
    <div className="flex flex-col gap-6">
      <MenuHubBackLink restaurantId={restaurantId} parent="hub" />
      <MenuSectionTabs
        restaurantId={restaurantId}
        active="offers"
        offersEnabled
      />
      <PageHeader
        title={t('offers.title')}
        description={t('offers.description')}
      />

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <Alert variant="error">{error}</Alert>
          <Button variant="secondary" onClick={() => void reload()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <SectionCard
        title={t('offers.title')}
        actions={
          canManage ? (
            <Button onClick={() => openEditor(emptyDraft())}>
              {t('offers.add')}
            </Button>
          ) : null
        }
      >
        {items === null && !error ? (
          <LoadingState label={t('offers.loading')} />
        ) : null}
        {items !== null && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('offers.empty')}</p>
        ) : null}
        {items !== null && items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {items.map((offer, index) => {
              const thumb = resolveAssetUrl(offer.imageAssetPath);
              return (
                <li
                  key={offer.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a Staff-uploaded asset from a runtime-configured API origin, not a Next.js-optimizable image.
                      <img
                        src={thumb}
                        alt=""
                        className="size-14 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-accent text-xl"
                      >
                        🎁
                      </span>
                    )}
                    <div className="min-w-0">
                      <p
                        dir="auto"
                        className="truncate text-sm font-semibold text-foreground"
                      >
                        {shownName(offer)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <bdi>
                          {formatMoney(offer.price, currencyCode, locale)}
                        </bdi>{' '}
                        · {daysText(offer)} ·{' '}
                        {tp('offers.slotsCount', offer.slots.length)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">
                      {t(`offers.badge.${offer.badge}` as MessageKey)}
                    </Badge>
                    <Badge variant={STATE_VARIANT[offer.state]} dot>
                      {t(`offers.state.${offer.state}` as MessageKey)}
                    </Badge>
                    {canManage ? (
                      <>
                        <Switch
                          checked={offer.status === 'ACTIVE'}
                          disabled={busyId === offer.id}
                          onCheckedChange={(next) =>
                            void handleToggle(offer, next)
                          }
                          label={t('offers.switchLabel', {
                            name: shownName(offer),
                          })}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === offer.id || index === 0}
                          aria-label={`${t('offers.moveUp')}: ${shownName(offer)}`}
                          onClick={() => void handleMove(offer, -1)}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={
                            busyId === offer.id || index === items.length - 1
                          }
                          aria-label={`${t('offers.moveDown')}: ${shownName(offer)}`}
                          onClick={() => void handleMove(offer, 1)}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditor(toDraft(offer))}
                        >
                          {t('offers.edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setToDelete(offer)}
                        >
                          {t('offers.delete')}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </SectionCard>

      <ConfirmDialog
        open={toDelete !== null}
        title={t('offers.delete.title')}
        description={t('offers.delete.body')}
        confirmLabel={t('offers.delete')}
        isSubmitting={saving}
        onConfirm={() => void handleDelete()}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
