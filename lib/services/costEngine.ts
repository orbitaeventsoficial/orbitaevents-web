/**
 * costEngine.ts — Motor de cost unificat
 *
 * Centralitza el càlcul de costos i marges per a qualsevol reserva.
 * - Si la reserva té pack amb inventari assignat → cost REAL (amortització + labor)
 * - Si no → cost estimat via ratis de profitabilityConfig
 * - Sempre suma: cost operacional fix + cost viatge + cost extres
 */

import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import type { ProfitabilityConfig } from './profitabilityService';
import { calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM } from './travelCost';
import { getMarginTone, type MarginTone } from '@/lib/margin-utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BookingCostInput {
  total: number;
  packPrice: number;
  extrasTotal: number;
  extraHours: number;
  extraHourPrice: number;
  distanceKm: number;
  vehicleCostPerKm?: number | null;
  travelCost?: number | null;
  source?: string | null;
  /** Cost real del pack calculat des d'inventari (amortització + labor) */
  inventoryCostReal?: number | null;
  /** Ingrés explícit de línies del bolo quan la reserva es construeix per línies. */
  serviceLinesRevenue?: number | null;
  /** Cost explícit de línies del bolo. No duplicar amb CollaboratorBooking. */
  serviceLinesCost?: number | null;
}

interface BookingFinancialSummary {
  // Costos desglossats
  packCost: number;
  packCostIsReal: boolean;
  extrasCost: number;
  extraHoursCost: number;
  fixedOperationalCost: number;
  travelCost: number;
  serviceLinesRevenue: number;
  serviceLinesCost: number;
  directCost: number;
  // CAC
  acquisitionCost: number;
  // Marge
  netMargin: number;
  marginPct: number;
  marginTone: MarginTone;
  // Ingrés
  total: number;
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Calcula el resum financer complet d'una reserva.
 * Font única de veritat per a tots els càlculs de marge/cost.
 */
export function computeBookingFinancialSummary(
  input: BookingCostInput,
  config: ProfitabilityConfig,
): BookingFinancialSummary {
  // Pack cost: real si disponible, estimat si no
  const packCostIsReal =
    typeof input.inventoryCostReal === 'number' && input.inventoryCostReal > 0;
  const packCost = packCostIsReal
    ? input.inventoryCostReal!
    : input.packPrice * config.packCostRatio;

  const extrasCost = input.extrasTotal * config.extraCostRatio;
  const extraHoursCost =
    input.extraHours * input.extraHourPrice * config.extraHourCostRatio;
  const fixedOperationalCost = config.fixedOperationalCost;

  // Cost de viatge: usar valor explícit si ve donat, sinó calcular
  const effectiveVehicleCostPerKm =
    input.vehicleCostPerKm ?? DEFAULT_VEHICLE_COST_PER_KM;
  const travelCost =
    typeof input.travelCost === 'number' && input.travelCost > 0
      ? input.travelCost
      : calculateTravelCost(input.distanceKm, effectiveVehicleCostPerKm);

  const serviceLinesRevenue =
    typeof input.serviceLinesRevenue === 'number' && input.serviceLinesRevenue > 0
      ? input.serviceLinesRevenue
      : 0;
  const serviceLinesCost =
    typeof input.serviceLinesCost === 'number' && input.serviceLinesCost > 0
      ? input.serviceLinesCost
      : 0;

  const directCost =
    packCost + extrasCost + extraHoursCost + fixedOperationalCost + travelCost + serviceLinesCost;

  // CAC
  const acquisitionCost =
    config.channelCac[input.source || 'UNKNOWN'] ??
    config.channelCac.UNKNOWN ??
    20;

  const total = input.total > 0 ? input.total : serviceLinesRevenue;
  const netMargin = total - directCost - acquisitionCost;
  const marginPct = total > 0 ? (netMargin / total) * 100 : 0;
  const marginTone = getMarginTone(marginPct);

  return {
    packCost,
    packCostIsReal,
    extrasCost,
    extraHoursCost,
    fixedOperationalCost,
    travelCost,
    serviceLinesRevenue,
    serviceLinesCost,
    directCost,
    acquisitionCost,
    netMargin,
    marginPct,
    marginTone,
    total,
  };
}

/**
 * Calcula el marge % simplificat (sense CAC) per a llistes/dashboards.
 * Substitueix calculateSimpleMarginPct quan es vol usar costEngine.
 */
export function computeSimpleMarginPct(
  input: BookingCostInput,
  config: ProfitabilityConfig = PROFITABILITY_MODEL_DEFAULTS,
): number {
  const summary = computeBookingFinancialSummary(input, config);
  // Retornem el marge sense CAC per coherència amb la vista simplificada
  if (input.total <= 0) return 0;
  return ((input.total - summary.directCost) / input.total) * 100;
}

// ─── Col·laboradors ────────────────────────────────────────────────────────

interface CollaboratorCostInput {
  commissionPct: number;
  pricingModel: 'NET_PLUS_COMMISSION' | 'DISCOUNT';
}

/**
 * Calcula el marge NET d'una reserva amb col·laborador.
 * Descompta la comissió del col·laborador del marge.
 */
export function computeCollaboratorNetMargin(
  summary: BookingFinancialSummary,
  collaborator: CollaboratorCostInput,
): { netMarginAfterCommission: number; commissionAmount: number; collaboratorPrice: number; marginPctAfterCommission: number } {
  const commissionAmount =
    collaborator.pricingModel === 'DISCOUNT'
      ? Math.round(summary.total * (collaborator.commissionPct / 100))
      : Math.round(summary.total * (collaborator.commissionPct / 100));

  const collaboratorPrice =
    collaborator.pricingModel === 'DISCOUNT'
      ? summary.total - commissionAmount
      : summary.total; // en model NET, el col·lab rep el preu net

  const netMarginAfterCommission = summary.netMargin - commissionAmount;
  const marginPctAfterCommission =
    summary.total > 0 ? (netMarginAfterCommission / summary.total) * 100 : 0;

  return { netMarginAfterCommission, commissionAmount, collaboratorPrice, marginPctAfterCommission };
}



