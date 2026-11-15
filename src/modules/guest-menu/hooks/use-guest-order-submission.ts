'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExclusiveTask } from '../../../lib/utils/async-control';
import {
  submitGuestOrder,
  submitWhatsappOrder,
  type SubmitGuestOrderResult,
  type WhatsappOrderView,
} from '../api/guest-orders';
import type { CartLine } from '../components/guest-view-types';
import type { useCheckoutValidation } from '../components/useCheckoutValidation';
import type { getPublicMenuCopy } from '../constants/copy';
import type { getOffersCopy } from '../constants/offers-copy';
import type { GuestOrderView } from '../types/index';
import type { PublicMenuViewProps } from '../types/menu-view';
import { toPendingItems, toSubmitItems } from '../utils/cart-lines';
import {
  clearPendingAttempt,
  resolveClientRequestId,
  type PendingOrderCheckout,
} from '../utils/pending-order-attempt';
import { formatAmount } from '../utils/price-format';
import { rememberOrder } from '../utils/tracking';
import { generateUuid } from '../utils/uuid';
interface SubmissionOptions {
  canSubmit: boolean;
  validation: ReturnType<typeof useCheckoutValidation>;
  copy: ReturnType<typeof getPublicMenuCopy>;
  offersCopy: ReturnType<typeof getOffersCopy>;
  publicCode: string;
  orderableLines: CartLine[];
  checkout: PendingOrderCheckout | null;
  data: PublicMenuViewProps['data'];
  isDelivery: boolean;
  grandTotalDisplay: string;
  totalDisplay: string;
  selectedZone: { name: string; minimumOrder: string } | null;
  unitLabel: string;
  persistCartCleared: () => void;
  setIsSubmitting: (value: boolean) => void;
  setSubmitError: (value: string | null) => void;
  setHasActiveOrder: (value: boolean) => void;
  setConfirmedOrder: (value: GuestOrderView | null) => void;
  setWhatsappHandoff: (value: WhatsappOrderView | null) => void;
  setOrderingOverride: (value: 'CLOSED' | 'AVAILABLE' | null) => void;
  setOrderingRecheck: (value: 'idle') => void;
  setServerOrderingDisabled: (value: boolean) => void;
}
export function useGuestOrderSubmission({
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
}: SubmissionOptions) {
  const router = useRouter();
  const [submission] = useState(createExclusiveTask);
  async function handlePlaceOrder() {
    if (!canSubmit) return;
    await submission.run(async () => {
      setIsSubmitting(true);
      try {
        if (!(await validation.checkBeforeSend())) return;
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

        if (result.outcome === 'success') {
          rememberOrder(publicCode, result.data.id);
          setHasActiveOrder(true);
          setConfirmedOrder(result.data);
          persistCartCleared();
          clearPendingAttempt(publicCode);
          return;
        }
        reportFailure(result);
      } catch {
        setSubmitError(copy.orderNetworkError);
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  /** Why an order (or a WhatsApp order) was not accepted, in the Guest's words. Nothing was created. */
  function reportFailure(
    result: Exclude<SubmitGuestOrderResult, { outcome: 'success' }>,
  ) {
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
    if (
      result.outcome === 'offerUnavailable' ||
      result.outcome === 'offerChanged'
    ) {
      // An offer was switched off, expired, is not valid today, or its items changed. Nothing was created; the cart
      // is kept. Refetch the menu so the cart marks the line (remove / choose again) and the strip shows the truth.
      setSubmitError(
        result.outcome === 'offerUnavailable'
          ? offersCopy.unavailableError
          : offersCopy.changedError,
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
        setSubmitError(
          isDelivery
            ? copy.deliveryDetailsRequiredError
            : copy.pickupDetailsRequiredError,
        );
      }
      return;
    }
    if (result.outcome === 'pickupDetailsRequired') {
      setSubmitError(
        isDelivery
          ? copy.deliveryDetailsRequiredError
          : copy.pickupDetailsRequiredError,
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
      setSubmitError(
        isDelivery ? copy.deliveryAreaError : copy.pickupBranchError,
      );
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
    await submission.run(async () => {
      setIsSubmitting(true);
      try {
        if (!(await validation.checkBeforeSend())) return;
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
        if (result.outcome === 'whatsappSuccess') {
          setWhatsappHandoff(result.data);
          persistCartCleared();
          clearPendingAttempt(publicCode);
          // Try to open WhatsApp at once; a browser may block it after the wait, so the panel also has a button.
          try {
            window.open(
              result.data.whatsappUrl,
              '_blank',
              'noopener,noreferrer',
            );
          } catch {
            // The button in the panel does the same.
          }
          return;
        }
        reportFailure(result);
      } catch {
        setSubmitError(copy.orderNetworkError);
      } finally {
        setIsSubmitting(false);
      }
    });
  }

  return { handlePlaceOrder, handleSendWhatsapp };
}
