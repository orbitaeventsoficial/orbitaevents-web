import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { bookingOutstandingAmount } from '@/lib/payment-status';
import { getMarginBand, getMarginLabel, type MarginBand } from '@/lib/margin-utils';
import { computeDirectCostBreakdown, type ServiceLineLike } from '@/lib/services/costEngine';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';
import { calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM } from '@/lib/services/travelCost';

export type BookingOutstandingBand = 'ok' | 'warn' | 'err';

export type BookingEconomicGuard = {
  outstandingAmount: number;
  outstandingBand: BookingOutstandingBand;
  directCost: number;
  netMargin: number;
  marginPct: number;
  marginBand: MarginBand;
  marginLabel: string;
};

export type BookingEconomicGuardInput = {
  total: number;
  depositAmount: number;
  remainingAmount?: number | null;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount?: number | null;
  packPrice: number;
  extrasTotal: number;
  extraHours: number;
  extraHourPrice: number;
  distanceKm?: number | null;
  vehicleCostPerKm?: number | null;
  travelCost?: number | null;
  inventoryCostReal?: number | null;
  serviceLines?: ServiceLineLike[];
};

function money(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveProfitabilityConfig(config: Partial<ProfitabilityConfig>): ProfitabilityConfig {
  return {
    ...PROFITABILITY_MODEL_DEFAULTS,
    ...config,
    channelCac: {
      ...PROFITABILITY_MODEL_DEFAULTS.channelCac,
      ...(config.channelCac ?? {}),
    },
  };
}

function getOutstandingBand(outstandingAmount: number, total: number): BookingOutstandingBand {
  if (outstandingAmount <= 0) return 'ok';
  if (total <= 0) return 'warn';
  return outstandingAmount / total <= 0.3 ? 'warn' : 'err';
}

export function computeBookingEconomicGuard(
  input: BookingEconomicGuardInput,
  config: Partial<ProfitabilityConfig>,
): BookingEconomicGuard {
  const total = money(input.total);
  const distanceKm = money(input.distanceKm);
  const vehicleCostPerKm = money(input.vehicleCostPerKm) || DEFAULT_VEHICLE_COST_PER_KM;
  const travelCost = money(input.travelCost) > 0 ? money(input.travelCost) : calculateTravelCost(distanceKm, vehicleCostPerKm);
  const resolvedConfig = resolveProfitabilityConfig(config);

  const cost = computeDirectCostBreakdown({
    total,
    packPrice: money(input.packPrice),
    extrasTotal: money(input.extrasTotal),
    extraHours: money(input.extraHours),
    extraHourPrice: money(input.extraHourPrice),
    distanceKm,
    vehicleCostPerKm,
    travelCost,
    inventoryCostReal: input.inventoryCostReal,
    serviceLines: input.serviceLines ?? [],
  }, resolvedConfig);

  const netMargin = round2(total - cost.directCost);
  const marginPct = total > 0 ? round2((netMargin / total) * 100) : 0;
  const outstandingAmount = bookingOutstandingAmount({
    total,
    depositAmount: money(input.depositAmount),
    remainingAmount: input.remainingAmount,
    depositPaid: input.depositPaid,
    remainingPaid: input.remainingPaid,
    cashAmount: input.cashAmount,
  });

  return {
    outstandingAmount,
    outstandingBand: getOutstandingBand(outstandingAmount, total),
    directCost: round2(cost.directCost),
    netMargin,
    marginPct,
    marginBand: getMarginBand(marginPct),
    marginLabel: getMarginLabel(marginPct),
  };
}
