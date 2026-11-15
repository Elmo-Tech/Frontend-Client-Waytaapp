'use client';
import { useState } from 'react';
import type { PublicMenuViewProps } from '../types/menu-view';
import type {
  CheckoutFieldKey,
  Fulfillment,
} from '../components/guest-view-types';
import { useCheckoutValidation } from '../components/useCheckoutValidation';
import type { PendingOrderCheckout } from '../utils/pending-order-attempt';
export function useGuestCheckout(data: PublicMenuViewProps['data']) {
  const locale = data.locale.resolved;
  const isGenericQr = data.context.qrType === 'GENERIC';
  const pickupBranches = data.context.pickupBranches ?? [];
  const deliveryBranches = data.context.deliveryBranches ?? [];
  const pickupAvailable = pickupBranches.length > 0;
  const deliveryAvailable = deliveryBranches.length > 0;
  const [requestedFulfillment, setRequestedFulfillment] =
    useState<Fulfillment>('PICKUP');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
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
    ? (deliveryBranches.find((branch) => branch.id === resolvedBranchId)
        ?.zones ?? [])
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
  function handleFulfillmentChange(next: Fulfillment) {
    setRequestedFulfillment(next);
    // Branch/zone lists differ per mode -- the Guest re-chooses if needed.
    setSelectedBranchId(null);
    setSelectedZoneId(null);
  }

  return {
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
  };
}
