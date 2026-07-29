import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { formatCurrency } from '@/lib/constants';
import { DEFAULT_VEHICLE_COST_PER_KM, INCLUDED_TRAVEL_KM } from '@/lib/services/travelCost';
import { getMarginBand, getMarginLabel, type MarginBand } from '@/lib/margin-utils';
import {
  computeBookingFinancialSummary,
  SUBCONTRACTED_MARKUP_TARGET_PCT,
  type ServiceLineLike,
} from '@/lib/services/costEngine';
import { computeBoloTransport } from '@/lib/services/travelLaborCost';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';

/**
 * Convenció pre-venda del dossier: abans de tenir reserva i headcount real,
 * el desplaçament es pressuposta amb 2 persones. La font del càlcul continua
 * sent `computeBoloTransport`; aquesta constant només fixa la hipòtesi inicial.
 */
export const DOSSIER_TRAVEL_HEADCOUNT = 2;

export type DossierTransportBudget = {
  km: number;
  cost: number;
  clientCharge: number;
  headcount: number;
  chargeableHours: number;
  vehicleKm: number;
  vehicleCostPerKm: number;
  clientVehicleCost: number;
  peopleCost: number;
  tollsCost: number;
  mealAllowance: number;
};

export type DossierMarginGuard = {
  band: MarginBand;
  label: string;
  marginPct: number;
  netMargin: number;
  totalRevenue: number;
  directCost: number;
  acquisitionCost: number;
  servicesRevenue: number;
  servicesCost: number;
  travelRevenue: number;
  travelCost: number;
  subcontractedMarkupPct: number;
  subcontractedMarkupOk: boolean;
  warnings: string[];
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function pct(value: number): string {
  return `${round1(value)}%`;
}

export function computeDossierTransportBudget(roundTripKm?: number | null, tollsEur?: number | null): DossierTransportBudget {
  const transport = computeBoloTransport({
    roundTripKm: roundTripKm ?? 0,
    headcountOverride: DOSSIER_TRAVEL_HEADCOUNT,
    tollsEur,
  });
  const peopleCost = transport.breakdown.peopleCost;
  const tollsCost = transport.tollsEur;
  const vehicleKm = Math.max(0, transport.roundTripKm - INCLUDED_TRAVEL_KM);
  const vehicleCostPerKm = DEFAULT_VEHICLE_COST_PER_KM;
  const clientVehicleCost = round2(Math.max(
    0,
    transport.clientCharge - peopleCost - tollsCost - transport.mealAllowance,
  ));
  return {
    km: transport.roundTripKm,
    cost: transport.cost,
    clientCharge: transport.clientCharge,
    headcount: transport.headcount,
    chargeableHours: transport.chargeableHours,
    vehicleKm,
    vehicleCostPerKm,
    clientVehicleCost,
    peopleCost,
    tollsCost,
    mealAllowance: transport.mealAllowance,
  };
}

export function computeDossierMarginGuard(input: {
  serviceLines: ServiceLineLike[];
  travelKm?: number | null;
  travelTollsEur?: number | null;
  source?: string | null;
  config?: ProfitabilityConfig;
}): DossierMarginGuard {
  const config = input.config ?? PROFITABILITY_MODEL_DEFAULTS;
  const transport = computeDossierTransportBudget(input.travelKm ?? 0, input.travelTollsEur ?? 0);
  const servicesRevenue = input.serviceLines.reduce(
    (sum, line) => sum + (line.revenueAmount || 0) * (line.quantity || 1),
    0,
  );
  const totalRevenue = servicesRevenue + transport.clientCharge;
  const summary = computeBookingFinancialSummary({
    total: totalRevenue,
    packPrice: 0,
    extrasTotal: 0,
    extraHours: 0,
    extraHourPrice: 0,
    distanceKm: 0,
    travelRevenue: transport.clientCharge,
    travelCost: transport.cost,
    serviceLines: input.serviceLines,
    source: input.source ?? 'OTHER',
  }, config);
  const band = getMarginBand(summary.marginPct);
  const warnings: string[] = [];

  if (band === 'critical') {
    warnings.push('Marge crític: revisa preu, serveis o condicions abans d\'enviar.');
  } else if (band === 'watch') {
    warnings.push('Marge just: acceptable només si el bolo té valor estratègic.');
  }
  if (!summary.subcontractedMarkup.ok) {
    warnings.push(`Markup subcontractat ${pct(summary.subcontractedMarkup.markupPct)}; objectiu mínim ${SUBCONTRACTED_MARKUP_TARGET_PCT}%.`);
  }
  if (transport.km > 0 && summary.transportMargin.marginAmount < 0) {
    warnings.push(`Desplaçament per sota cost: ${formatCurrency(summary.transportMargin.marginAmount, 'ca-ES')}.`);
  }

  return {
    band,
    label: getMarginLabel(summary.marginPct),
    marginPct: round1(summary.marginPct),
    netMargin: summary.netMargin,
    totalRevenue,
    directCost: summary.directCost,
    acquisitionCost: summary.acquisitionCost,
    servicesRevenue,
    servicesCost: summary.serviceLinesCost,
    travelRevenue: transport.clientCharge,
    travelCost: transport.cost,
    subcontractedMarkupPct: summary.subcontractedMarkup.markupPct,
    subcontractedMarkupOk: summary.subcontractedMarkup.ok,
    warnings,
  };
}
