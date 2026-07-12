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
import { isIncludedSoundTechSettlementLine } from '@/lib/services/serviceLineCostRules';
import { TRAVEL_COST_LINE_MARKER } from '@/lib/services/travelLaborCost';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BookingCostInput {
  total: number;
  packPrice: number;
  extrasTotal: number;
  extraHours: number;
  extraHourPrice: number;
  distanceKm: number;
  vehicleCostPerKm?: number | null;
  /** Ingrés/càrrec de transport repercutit al client, separat del total global. */
  travelRevenue?: number | null;
  travelCost?: number | null;
  source?: string | null;
  /** Cost real del pack calculat des d'inventari (amortització + labor) */
  inventoryCostReal?: number | null;
  /** Ingrés explícit de línies del bolo quan la reserva es construeix per línies. */
  serviceLinesRevenue?: number | null;
  /** Cost explícit de línies del bolo (cost real de col·laborador subcontractat). */
  serviceLinesCost?: number | null;
  /** Línies del bolo/reserva. Si existeixen, el motor en calcula ingrés, cost i lectures comercials. */
  serviceLines?: ServiceLineLike[] | null;
  /** Ràtio de cost per línies pròpies sense cost explícit quan `serviceLines` ve definit. */
  serviceLinesOwnCostRatio?: number | null;
  /** Ajustos de cost que pertanyen a les línies però no són una línia visible (p.ex. recollida de material llogat). */
  serviceLinesCostAdjustment?: number | null;
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
  ownServiceMargin: MarginBucket;
  subcontractedMarkup: SubcontractedMarkupSummary;
  transportMargin: MarginBucket;
  orbitaTechIncome: number;
  // Ingrés
  total: number;
}

/** Línia de servei mínima per agregar ingrés/cost (bolo del lead o reserva). */
export interface ServiceLineLike {
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
  collaboratorId?: string | null;
  kind?: string | null;
  label?: string | null;
  notes?: string | null;
}

export const SUBCONTRACTED_MARKUP_TARGET_PCT = 20;

export type SubcontractedMarkupSummary = {
  revenue: number;
  cost: number;
  markupAmount: number;
  markupPct: number;
  targetPct: number;
  ok: boolean;
};

export type MarginBucket = {
  revenue: number;
  cost: number;
  marginAmount: number;
  marginPct: number;
};

export type ServiceLineEconomics = {
  revenue: number;
  cost: number;
  ownServiceMargin: MarginBucket;
  subcontractedMarkup: SubcontractedMarkupSummary;
  orbitaTechIncome: number;
};

// ─── Agregació de línies ──────────────────────────────────────────────────────

/**
 * Suma l'ingrés i el cost d'un conjunt de línies de servei.
 * Font ÚNICA de la regla de cost per línia (no duplicar inline):
 * - les línies `[travel-cost]` són atribució de repartiment; el seu cost econòmic
 *   viu a `booking.travelCost`/`travelCost` per no duplicar ruta;
 * - cost explícit si la línia en porta (partners → costAmount del catàleg) o té
 *   `collaboratorId` (el cost es gestiona a la seva fitxa, mai imputat);
 * - si és una línia pròpia d'Òrbita sense cost, s'imputa cost intern via
 *   `orbitaServiceCostRatio` (el DJ/tècnic no és cost 0: temps, equip, operativa).
 */
export function aggregateServiceLines(
  lines: ServiceLineLike[],
  ownCostRatio: number = PROFITABILITY_MODEL_DEFAULTS.orbitaServiceCostRatio,
): { revenue: number; cost: number } {
  const { revenue, cost } = computeServiceLineEconomics(lines, ownCostRatio);
  return { revenue, cost };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function quantityOf(line: ServiceLineLike): number {
  return typeof line.quantity === 'number' && Number.isFinite(line.quantity) && line.quantity > 0
    ? line.quantity
    : 1;
}

function isTravelCostLine(line: ServiceLineLike): boolean {
  return Boolean(line.notes?.includes(TRAVEL_COST_LINE_MARKER));
}

function emptySubcontractedMarkup(): SubcontractedMarkupSummary {
  return {
    revenue: 0,
    cost: 0,
    markupAmount: 0,
    markupPct: 0,
    targetPct: SUBCONTRACTED_MARKUP_TARGET_PCT,
    ok: true,
  };
}

function marginBucket(revenue: number, cost: number): MarginBucket {
  const roundedRevenue = round2(revenue);
  const roundedCost = round2(cost);
  const marginAmount = round2(roundedRevenue - roundedCost);
  return {
    revenue: roundedRevenue,
    cost: roundedCost,
    marginAmount,
    marginPct: roundedRevenue > 0 ? round2((marginAmount / roundedRevenue) * 100) : 0,
  };
}

export function computeServiceLineEconomics(
  lines: ServiceLineLike[],
  ownCostRatio: number = PROFITABILITY_MODEL_DEFAULTS.orbitaServiceCostRatio,
): ServiceLineEconomics {
  let revenue = 0;
  let cost = 0;
  let subcontractedRevenue = 0;
  let subcontractedCost = 0;
  let ownRevenue = 0;
  let ownCost = 0;
  let orbitaTechIncome = 0;

  for (const line of lines) {
    if (isTravelCostLine(line)) continue;
    const qty = quantityOf(line);
    const rev = (line.revenueAmount || 0) * qty;
    revenue += rev;
    const explicit = (line.costAmount || 0) * qty;
    const lineCost = explicit > 0 || line.collaboratorId ? explicit : rev * ownCostRatio;
    cost += lineCost;

    if (explicit < 0 && isIncludedSoundTechSettlementLine(line)) {
      orbitaTechIncome += Math.abs(explicit);
      continue;
    }
    if (!line.collaboratorId && rev > 0) {
      ownRevenue += rev;
      ownCost += lineCost;
    }
    if (line.kind !== 'PROVIDER_SERVICE' || !line.collaboratorId || explicit <= 0 || rev <= 0) {
      continue;
    }
    subcontractedCost += explicit;
    subcontractedRevenue += rev;
  }

  const markupAmount = round2(subcontractedRevenue - subcontractedCost);
  const markupPct = subcontractedCost > 0 ? round2((markupAmount / subcontractedCost) * 100) : 0;
  return {
    revenue: round2(revenue),
    cost: round2(cost),
    ownServiceMargin: marginBucket(ownRevenue, ownCost),
    subcontractedMarkup: subcontractedCost > 0
      ? {
          revenue: round2(subcontractedRevenue),
          cost: round2(subcontractedCost),
          markupAmount,
          markupPct,
          targetPct: SUBCONTRACTED_MARKUP_TARGET_PCT,
          ok: markupPct >= SUBCONTRACTED_MARKUP_TARGET_PCT,
        }
      : emptySubcontractedMarkup(),
    orbitaTechIncome: round2(orbitaTechIncome),
  };
}

/** Línia mínima per classificar el tipus de cost operatiu que genera. */
export interface BoloLineLike {
  collaboratorId?: string | null;
  kind?: string | null;
}

/**
 * Classifica les línies del bolo per decidir el cost operatiu REAL d'Òrbita:
 * - **Equip propi** (`DJ` o material propi `EQUIPMENT` SENSE `collaboratorId`):
 *   Òrbita hi va amb cotxe i equip propis → s'aplica el cost fix (desgast +
 *   amortització + consumibles).
 * - **Lloguer de material** (`EQUIPMENT` AMB `collaboratorId`, p.ex. Tino):
 *   s'ha d'anar a buscar i tornar; el transport el carrega la pròpia línia.
 * - **Servei presencial** (`PROVIDER_SERVICE`, Masquerade) o **tècnic de so**
 *   (`SOUND_TECH`): Òrbita no mou res seu → cap cost operatiu propi.
 */
export function classifyBoloLines(lines: BoloLineLike[]): {
  hasOwnEquipment: boolean;
  hasEquipmentRental: boolean;
} {
  let hasOwnEquipment = false;
  let hasEquipmentRental = false;
  for (const l of lines) {
    const kind = l.kind || '';
    if (!l.collaboratorId && (kind === 'DJ' || kind === 'EQUIPMENT')) hasOwnEquipment = true;
    if (l.collaboratorId && kind === 'EQUIPMENT') hasEquipmentRental = true;
  }
  return { hasOwnEquipment, hasEquipmentRental };
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Calcula el resum financer complet d'una reserva.
 * Font única de veritat per a tots els càlculs de marge/cost.
 */
/** Desglossament dels components del cost directe d'un bolo. */
export interface DirectCostBreakdown {
  packCost: number;
  packCostIsReal: boolean;
  extrasCost: number;
  extraHoursCost: number;
  fixedOperationalCost: number;
  travelCost: number;
  travelRevenue: number;
  transportMargin: MarginBucket;
  serviceLinesRevenue: number;
  serviceLinesCost: number;
  ownServiceMargin: MarginBucket;
  subcontractedMarkup: SubcontractedMarkupSummary;
  orbitaTechIncome: number;
  directCost: number;
}

/**
 * Font ÚNICA del càlcul del cost directe d'un bolo (sense CAC). La usen tant
 * `computeBookingFinancialSummary` (servidor) com els components de marge en viu
 * del client (`useBookingPricing`, `BookingMarginCard`), per no reimplementar la
 * mateixa fórmula a 3 llocs i evitar que divergeixin.
 */
export function computeDirectCostBreakdown(
  input: BookingCostInput,
  config: ProfitabilityConfig,
): DirectCostBreakdown {
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
  const travelRevenue =
    typeof input.travelRevenue === 'number' && Number.isFinite(input.travelRevenue)
      ? input.travelRevenue
      : 0;
  const transportMargin = marginBucket(travelRevenue, travelCost);

  const lineEconomics = Array.isArray(input.serviceLines)
    ? computeServiceLineEconomics(
        input.serviceLines,
        typeof input.serviceLinesOwnCostRatio === 'number' && Number.isFinite(input.serviceLinesOwnCostRatio)
          ? input.serviceLinesOwnCostRatio
          : PROFITABILITY_MODEL_DEFAULTS.orbitaServiceCostRatio,
      )
    : null;
  const serviceLinesRevenue = lineEconomics
    ? lineEconomics.revenue
    : typeof input.serviceLinesRevenue === 'number' && input.serviceLinesRevenue > 0
      ? input.serviceLinesRevenue
      : 0;
  const serviceLinesCostBase = lineEconomics
    ? lineEconomics.cost
    : typeof input.serviceLinesCost === 'number' && Number.isFinite(input.serviceLinesCost)
      ? input.serviceLinesCost
      : 0;
  const serviceLinesCostAdjustment =
    typeof input.serviceLinesCostAdjustment === 'number' && Number.isFinite(input.serviceLinesCostAdjustment)
      ? input.serviceLinesCostAdjustment
      : 0;
  const serviceLinesCost = serviceLinesCostBase + serviceLinesCostAdjustment;
  const subcontractedMarkup = lineEconomics?.subcontractedMarkup ?? emptySubcontractedMarkup();
  const ownServiceMargin = lineEconomics?.ownServiceMargin ?? marginBucket(0, 0);
  const orbitaTechIncome = lineEconomics?.orbitaTechIncome ?? 0;

  const directCost =
    packCost + extrasCost + extraHoursCost + fixedOperationalCost + travelCost + serviceLinesCost;

  return {
    packCost, packCostIsReal, extrasCost, extraHoursCost, fixedOperationalCost,
    travelCost, travelRevenue, transportMargin, serviceLinesRevenue, serviceLinesCost,
    ownServiceMargin, subcontractedMarkup, orbitaTechIncome, directCost,
  };
}

export function computeBookingFinancialSummary(
  input: BookingCostInput,
  config: ProfitabilityConfig,
): BookingFinancialSummary {
  const {
    packCost, packCostIsReal, extrasCost, extraHoursCost, fixedOperationalCost,
    travelCost, travelRevenue, transportMargin, serviceLinesRevenue, serviceLinesCost,
    ownServiceMargin, subcontractedMarkup, orbitaTechIncome, directCost,
  } = computeDirectCostBreakdown(input, config);

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
    ownServiceMargin,
    subcontractedMarkup,
    transportMargin,
    orbitaTechIncome,
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
