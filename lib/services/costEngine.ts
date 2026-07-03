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
import { getMarginTone, type MarginProfile, type MarginTone } from '@/lib/margin-utils';

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
  /** Cost explícit de línies del bolo (cost real de col·laborador subcontractat). */
  serviceLinesCost?: number | null;
  /** Perfil comercial del marge: propi o revenda/proveidor extern. */
  marginProfile?: MarginProfile | null;
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

/** Línia de servei mínima per agregar ingrés/cost (bolo del lead o reserva). */
export interface ServiceLineLike {
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
  collaboratorId?: string | null;
}

// ─── Agregació de línies ──────────────────────────────────────────────────────

/**
 * Suma l'ingrés i el cost d'un conjunt de línies de servei.
 * Font ÚNICA de la regla de cost per línia (no duplicar inline):
 * - cost explícit si la línia en porta (partners → costAmount del catàleg) o té
 *   `collaboratorId` (el cost es gestiona a la seva fitxa, mai imputat);
 * - si és una línia pròpia d'Òrbita sense cost, s'imputa cost intern via
 *   `orbitaServiceCostRatio` (el DJ/tècnic no és cost 0: temps, equip, operativa).
 */
export function aggregateServiceLines(
  lines: ServiceLineLike[],
  ownCostRatio: number = PROFITABILITY_MODEL_DEFAULTS.orbitaServiceCostRatio,
): { revenue: number; cost: number } {
  let revenue = 0;
  let cost = 0;
  for (const l of lines) {
    const qty = l.quantity || 1;
    const rev = (l.revenueAmount || 0) * qty;
    revenue += rev;
    const explicit = (l.costAmount || 0) * qty;
    cost += explicit > 0 || l.collaboratorId ? explicit : rev * ownCostRatio;
  }
  return { revenue, cost };
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

/**
 * Km de desplaçament que el marge del bolo pot assumir abans de deixar de
 * guanyar (net = 0). El desplaçament va EN CONTRA del marge a `costPerKm` real
 * (benzina MITECO + consum + manteniment). Retorna km totals (anada+tornada).
 */
export function computeSupportableTravelKm(netMargin: number, costPerKm: number): number {
  const rate = costPerKm > 0 ? costPerKm : DEFAULT_VEHICLE_COST_PER_KM;
  if (netMargin <= 0) return 0;
  return Math.floor(netMargin / rate);
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
  serviceLinesRevenue: number;
  serviceLinesCost: number;
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

  const serviceLinesRevenue =
    typeof input.serviceLinesRevenue === 'number' && input.serviceLinesRevenue > 0
      ? input.serviceLinesRevenue
      : 0;
  const serviceLinesCost =
    typeof input.serviceLinesCost === 'number' && Number.isFinite(input.serviceLinesCost)
      ? input.serviceLinesCost
      : 0;

  const directCost =
    packCost + extrasCost + extraHoursCost + fixedOperationalCost + travelCost + serviceLinesCost;

  return {
    packCost, packCostIsReal, extrasCost, extraHoursCost, fixedOperationalCost,
    travelCost, serviceLinesRevenue, serviceLinesCost, directCost,
  };
}

export function computeBookingFinancialSummary(
  input: BookingCostInput,
  config: ProfitabilityConfig,
): BookingFinancialSummary {
  const {
    packCost, packCostIsReal, extrasCost, extraHoursCost, fixedOperationalCost,
    travelCost, serviceLinesRevenue, serviceLinesCost, directCost,
  } = computeDirectCostBreakdown(input, config);

  // CAC
  const acquisitionCost =
    config.channelCac[input.source || 'UNKNOWN'] ??
    config.channelCac.UNKNOWN ??
    20;

  const total = input.total > 0 ? input.total : serviceLinesRevenue;
  const netMargin = total - directCost - acquisitionCost;
  const marginPct = total > 0 ? (netMargin / total) * 100 : 0;
  const marginTone = getMarginTone(marginPct, input.marginProfile ?? 'own');

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
  // La comissió es calcula igual als dos models: % sobre el total.
  // El que difereix entre models és el collaboratorPrice (preu que veu el col·lab):
  //  - DISCOUNT: el col·lab rep el total MENYS la comissió (preu amb descompte).
  //  - NET_PLUS_COMMISSION: el col·lab rep el total sencer (la comissió va a part).
  const commissionAmount = Math.round(summary.total * (collaborator.commissionPct / 100));

  const collaboratorPrice =
    collaborator.pricingModel === 'DISCOUNT'
      ? summary.total - commissionAmount
      : summary.total;

  const netMarginAfterCommission = summary.netMargin - commissionAmount;
  const marginPctAfterCommission =
    summary.total > 0 ? (netMarginAfterCommission / summary.total) * 100 : 0;

  return { netMarginAfterCommission, commissionAmount, collaboratorPrice, marginPctAfterCommission };
}


