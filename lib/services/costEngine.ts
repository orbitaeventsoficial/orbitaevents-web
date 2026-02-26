/**
 * costEngine.ts — Motor de cost unificat
 *
 * Centralitza el càlcul de costos i marges per a qualsevol reserva.
 * - Si la reserva té pack amb inventari assignat → cost REAL (amortització + labor)
 * - Si no → cost estimat via ratis de profitabilityConfig
 * - Sempre suma: cost operacional fix + cost viatge + cost extres
 */

import type { ProfitabilityConfig } from './profitabilityService';
import { DEFAULT_PROFITABILITY_CONFIG, getProfitabilityConfig } from './profitabilityService';
import { calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM } from './travelCost';
import { getMarginTone, type MarginTone } from '@/lib/margin-utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BookingCostInput {
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
}

export interface BookingFinancialSummary {
  // Costos desglossats
  packCost: number;
  packCostIsReal: boolean;
  extrasCost: number;
  extraHoursCost: number;
  fixedOperationalCost: number;
  travelCost: number;
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

  const directCost =
    packCost + extrasCost + extraHoursCost + fixedOperationalCost + travelCost;

  // CAC
  const acquisitionCost =
    config.channelCac[input.source || 'UNKNOWN'] ??
    config.channelCac.UNKNOWN ??
    20;

  const netMargin = input.total - directCost - acquisitionCost;
  const marginPct = input.total > 0 ? (netMargin / input.total) * 100 : 0;
  const marginTone = getMarginTone(marginPct);

  return {
    packCost,
    packCostIsReal,
    extrasCost,
    extraHoursCost,
    fixedOperationalCost,
    travelCost,
    directCost,
    acquisitionCost,
    netMargin,
    marginPct,
    marginTone,
    total: input.total,
  };
}

/**
 * Versió async que carrega la config de BD automàticament.
 */
export async function getBookingFinancialSummary(
  input: BookingCostInput,
): Promise<BookingFinancialSummary> {
  const config = await getProfitabilityConfig();
  return computeBookingFinancialSummary(input, config);
}

/**
 * Calcula el marge % simplificat (sense CAC) per a llistes/dashboards.
 * Substitueix calculateSimpleMarginPct quan es vol usar costEngine.
 */
export function computeSimpleMarginPct(
  input: BookingCostInput,
  config: ProfitabilityConfig = DEFAULT_PROFITABILITY_CONFIG,
): number {
  const summary = computeBookingFinancialSummary(input, config);
  // Retornem el marge sense CAC per coherència amb la vista simplificada
  if (input.total <= 0) return 0;
  return ((input.total - summary.directCost) / input.total) * 100;
}
