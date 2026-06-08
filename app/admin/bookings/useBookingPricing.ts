'use client';

import { useMemo } from 'react';
import {
  calcVatRate, calcDeposit,
  OPERATOR_EXTRA_MIN_PRICE, OPERATOR_EXTRA_FACTOR,
} from '@/lib/constants/pricing';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import {
  calculateBillableTravelKm,
  calculateTravelBlocks,
  calculateTravelCharge,
  calculateTravelCost,
  DEFAULT_VEHICLE_COST_PER_KM,
  INCLUDED_TRAVEL_KM,
  TRAVEL_BLOCK_EUR,
  TRAVEL_BLOCK_KM,
} from '@/lib/services/travelCost';
import type { BookingExtra, BookingFormData, BookingPack, BookingSelectedExtras, BookingServiceLineFormInput } from './booking-form.types';
import { OPERATOR_EXTRA_ID } from './booking-form.types';

function calculateEventDuration(startTime: string | null | undefined, endTime: string | null | undefined): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  if (![startH, startM, endH, endM].every(Number.isFinite)) return 0;
  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return (endMinutes - startMinutes) / 60;
}

interface UseBookingPricingOptions {
  form: Pick<BookingFormData, 'packId' | 'extraHours' | 'eventStartTime' | 'eventEndTime' | 'distanceKm' | 'fuelCostPerKm' | 'discount'>;
  packs: BookingPack[];
  extras: BookingExtra[];
  selectedExtras: BookingSelectedExtras;
  customPackPrice?: number;
  manualTotalPrice?: number;
  invoiceRequired?: boolean;
  serviceLines?: BookingServiceLineFormInput[];
}

export function useBookingPricing({ form, packs, extras, selectedExtras, customPackPrice, manualTotalPrice, invoiceRequired = false, serviceLines = [] }: UseBookingPricingOptions) {
  const internalTravelCost = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    const rate = parseFloat(form.fuelCostPerKm) || DEFAULT_VEHICLE_COST_PER_KM;
    return calculateTravelCost(km, rate, INCLUDED_TRAVEL_KM);
  }, [form.distanceKm, form.fuelCostPerKm]);

  const travelCharge = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    return calculateTravelCharge(km, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM, TRAVEL_BLOCK_EUR);
  }, [form.distanceKm]);

  const billableKm = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    return calculateBillableTravelKm(km, INCLUDED_TRAVEL_KM);
  }, [form.distanceKm]);

  const travelBlocks = useMemo(() => {
    const km = parseFloat(form.distanceKm) || 0;
    return calculateTravelBlocks(km, INCLUDED_TRAVEL_KM, TRAVEL_BLOCK_KM);
  }, [form.distanceKm]);

  const selectedPack = useMemo(() => packs.find((pack) => pack.id === form.packId) || null, [packs, form.packId]);

  const operatorExtraPrice = useMemo(() => {
    if (!selectedPack) return 0;
    const recommended = Number(selectedPack.recommendedOperatorExtraHourPrice || 0);
    if (recommended > 0) return Number(recommended.toFixed(2));
    return Number(Math.max(OPERATOR_EXTRA_MIN_PRICE, selectedPack.extraHourPrice * OPERATOR_EXTRA_FACTOR).toFixed(2));
  }, [selectedPack]);

  const displayExtras = useMemo<BookingExtra[]>(() => {
    if (!selectedPack) return extras;
    const operatorExtra: BookingExtra = {
      id: OPERATOR_EXTRA_ID,
      slug: 'operator-support-hour',
      price: operatorExtraPrice,
      priceType: 'PER_HOUR',
      translations: [{ name: 'Operari extra (hora)' }],
      isOperatorExtra: true,
    };
    return [operatorExtra, ...extras];
  }, [extras, operatorExtraPrice, selectedPack]);

  const pricing = useMemo(() => {
    if (!selectedPack) return null;

    const packPrice = customPackPrice && customPackPrice > 0 ? customPackPrice : selectedPack.price;
    const explicitExtraHours = parseInt(form.extraHours, 10) || 0;
    const eventHours = calculateEventDuration(form.eventStartTime, form.eventEndTime);
    const derivedExtraHours = eventHours > selectedPack.djHours
      ? Math.ceil((eventHours - selectedPack.djHours) * 10) / 10
      : 0;
    const extraHoursCount = explicitExtraHours > 0 ? explicitExtraHours : derivedExtraHours;
    const extraHoursPrice = extraHoursCount * selectedPack.extraHourPrice;
    const extrasPrice = Object.values(selectedExtras).reduce((sum, extra) => sum + extra.price * extra.quantity, 0);
    const serviceLinesRevenue = serviceLines.reduce((sum, l) => sum + (l.revenueAmount || 0) * (l.quantity || 1), 0);
    const serviceLinesCost = serviceLines.reduce((sum, l) => sum + (l.costAmount || 0) * (l.quantity || 1), 0);
    const subtotal = packPrice + extraHoursPrice + extrasPrice + travelCharge + serviceLinesRevenue;
    const discount = parseFloat(form.discount) || 0;
    const baseAfterDiscount = subtotal - discount;
    const vatRate = calcVatRate(invoiceRequired);
    const manualTotal = manualTotalPrice && manualTotalPrice > 0 ? manualTotalPrice : null;
    const total = manualTotal ?? baseAfterDiscount + baseAfterDiscount * (vatRate / 100);
    const vatAmount = manualTotal !== null
      ? invoiceRequired ? total - total * 100 / (100 + vatRate) : 0
      : baseAfterDiscount * (vatRate / 100);
    const deposit = calcDeposit(total);

    return { packPrice, extraHoursPrice, extrasPrice, travelCharge, subtotal, discount, vatRate, vatAmount, total, deposit, serviceLinesRevenue, serviceLinesCost };
  }, [customPackPrice, form.discount, form.eventEndTime, form.eventStartTime, form.extraHours, invoiceRequired, manualTotalPrice, selectedExtras, selectedPack, travelCharge, serviceLines]);

  const marginEstimate = useMemo(() => {
    if (!pricing) return null;
    const packCost = pricing.packPrice * PROFITABILITY_MODEL_DEFAULTS.packCostRatio;
    const extrasCost = pricing.extrasPrice * PROFITABILITY_MODEL_DEFAULTS.extraCostRatio;
    const extraHoursCost = pricing.extraHoursPrice * PROFITABILITY_MODEL_DEFAULTS.extraHourCostRatio;
    const fixedCost = PROFITABILITY_MODEL_DEFAULTS.fixedOperationalCost;
    const travelCostEst = internalTravelCost;
    const serviceLinesCost = pricing.serviceLinesCost || 0;
    const directCost = packCost + extrasCost + extraHoursCost + fixedCost + travelCostEst + serviceLinesCost;
    const netMargin = pricing.total - directCost;
    const marginPct = pricing.total > 0 ? (netMargin / pricing.total) * 100 : 0;
    const tone: 'emerald' | 'amber' | 'rose' = marginPct >= 50 ? 'emerald' : marginPct >= 30 ? 'amber' : 'rose';
    return { directCost, netMargin, marginPct, tone };
  }, [internalTravelCost, pricing]);

  return {
    internalTravelCost,
    travelCharge,
    billableKm,
    travelBlocks,
    selectedPack,
    operatorExtraPrice,
    displayExtras,
    pricing,
    marginEstimate,
  };
}
