'use client';

import { useMemo } from 'react';
import {
  calcVatRate, calcDeposit, ceilToStep,
  OPERATOR_EXTRA_MIN_PRICE, OPERATOR_EXTRA_FACTOR,
} from '@/lib/constants/pricing';
import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { getMarginBand } from '@/lib/margin-utils';
import { aggregateServiceLines, computeDirectCostBreakdown } from '@/lib/services/costEngine';
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
    // Preu de venda → arrodonit a múltiple de 5 amunt (ordre del propietari).
    if (recommended > 0) return ceilToStep(recommended, 5);
    return ceilToStep(Math.max(OPERATOR_EXTRA_MIN_PRICE, selectedPack.extraHourPrice * OPERATOR_EXTRA_FACTOR), 5);
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
    // Bolo dossier-cèntric: pot no tenir pack (només serveis/productes). Si no hi
    // ha pack ni línies ni total, no hi ha res a mostrar.
    const hasLines = serviceLines.length > 0;
    const hasManual = !!(manualTotalPrice && manualTotalPrice > 0);
    if (!selectedPack && !hasLines && !hasManual) return null;

    const packPrice = selectedPack
      ? (customPackPrice && customPackPrice > 0 ? customPackPrice : selectedPack.price)
      : 0;
    const packDjHours = selectedPack?.djHours ?? 0;
    const packExtraHourPrice = selectedPack?.extraHourPrice ?? 0;
    const explicitExtraHours = parseInt(form.extraHours, 10) || 0;
    const eventHours = calculateEventDuration(form.eventStartTime, form.eventEndTime);
    const derivedExtraHours = eventHours > packDjHours
      ? Math.ceil((eventHours - packDjHours) * 10) / 10
      : 0;
    const extraHoursCount = explicitExtraHours > 0 ? explicitExtraHours : derivedExtraHours;
    const extraHoursPrice = extraHoursCount * packExtraHourPrice;
    const extrasPrice = Object.values(selectedExtras).reduce((sum, extra) => sum + extra.price * extra.quantity, 0);
    // Ingrés i cost de les línies via la font única (aggregateServiceLines):
    // cost explícit (partners) o imputat al rati propi d'Òrbita per línies pròpies.
    const { revenue: serviceLinesRevenue, cost: serviceLinesCost } = aggregateServiceLines(serviceLines);
    const subtotal = packPrice + extraHoursPrice + extrasPrice + travelCharge + serviceLinesRevenue;
    const discount = parseFloat(form.discount) || 0;
    const baseAfterDiscount = Math.max(0, subtotal - discount);
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
    // Cost directe via la font única (computeDirectCostBreakdown), no reimplementat.
    // extraHours=1 + extraHourPrice=extraHoursPrice perquè el preu d'hores extra ja ve
    // agregat (count×preu). travelCost explícit; si és 0, el helper el recalcula a 0.
    const { directCost } = computeDirectCostBreakdown({
      total: pricing.total,
      packPrice: pricing.packPrice,
      extrasTotal: pricing.extrasPrice,
      extraHours: 1,
      extraHourPrice: pricing.extraHoursPrice,
      distanceKm: 0,
      travelCost: internalTravelCost,
      serviceLinesRevenue: pricing.serviceLinesRevenue,
      serviceLinesCost: pricing.serviceLinesCost || 0,
    }, PROFITABILITY_MODEL_DEFAULTS);
    const netMargin = pricing.total - directCost; // marge en viu: sense CAC (per disseny)
    const marginPct = pricing.total > 0 ? (netMargin / pricing.total) * 100 : 0;
    // Semàfor de marge canònic (4 bandes, font única getMarginBand): Excel·lent/Acceptable/Vigilar/Crític.
    const band = getMarginBand(marginPct);
    const tone: 'emerald' | 'amber' | 'orange' | 'rose' =
      band === 'excellent' ? 'emerald' : band === 'acceptable' ? 'amber' : band === 'watch' ? 'orange' : 'rose';
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
