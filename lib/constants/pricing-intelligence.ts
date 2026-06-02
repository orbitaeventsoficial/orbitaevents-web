/**
 * PRICING INTELLIGENCE — Òrbita Events
 * ─────────────────────────────────────────────────────────────────────────────
 * Base canònica de negoci per a l'anàlisi de preus i marges.
 * Dissenyada per a DJ professional a Barcelona i rodalies.
 * Revisió: Opus MAX (4 rondes d'anàlisi + arquitectura completa), 2026-06.
 *
 * NORMES FONAMENTALS:
 * 1. Tots els marges es calculen sobre el preu NET (sense IVA 21%).
 * 2. El preu per hora es calcula sobre hores FACTURABLES reals (inici → fi),
 *    perquè muntatge i desmuntatge no facturat és cost real de temps.
 * 3. Quan el preu és PACTAT manualment, el pack és descriptor de servei,
 *    no font de preu. Cap recàlcul automàtic pot trepitjar el preu pactat.
 * 4. Aquesta és la font de veritat per a tots els semàfors, colors i consells.
 *    Cap component pot hardcodejar llindars locals.
 * 5. Si el preu final s'allunya del preu recomanat per les hores i el mercat,
 *    el sistema ha d'avisar per revisar preus.
 * 6. Els valors de BD (PricingConfig) sobreescriuen aquests fallbacks.
 *    Si la BD no té valor, s'usa el d'aquest fitxer.
 *
 * SOLIDARITAT DE CAMPS: tocar un camp propaga la cadena fins al color final.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM } from '@/lib/services/travelCost';

// ── Llindars de marge (% sobre preu net, sense IVA) ─────────────────────────
export const PRICING_INTELLIGENCE = {

  margin: {
    EXCELLENT_MARGIN_PCT: 60,  // Bolo rodó: marca + marge generós
    GOOD_MARGIN_PCT: 50,       // Zona de confort real a Barcelona
    TARGET_MARGIN_PCT: 40,     // Terra acceptable; per sota es negocia o es puja
    FAIR_MARGIN_PCT: 34,       // Just: vigilar de prop
    LOW_MARGIN_PCT: 25,        // Risc: un imprevist s'ho menja tot
    CRITICAL_MARGIN_PCT: 15,   // Quasi feina gratis
    LOSS_MARGIN_PCT: 0,        // Pèrdua directa
  },

  // Tarifa global de referència (fallback si no hi ha SERVICE_HOURLY_RATES)
  hourlyRate: {
    MIN_MARKET_EUR_PER_HOUR: 90,
    RECOMMENDED_MIN_EUR_PER_HOUR: 110,
    MID_MARKET_EUR_PER_HOUR: 160,
    PREMIUM_EUR_PER_HOUR: 220,
    MAX_MARKET_EUR_PER_HOUR: 300,
  },

  priceDeviation: {
    ALERT_PCT: 15,
    CRITICAL_PCT: 30,
  },

  business: {
    DEPOSIT_PCT_RECOMMENDED: 30,
    COLLABORATOR_COST_PCT_MAX: 50,
    COST_PER_KM_THRESHOLD: 0.45,
    OVERRIDE_DISCOUNT_PCT_ALERT: 15,
  },

} as const;

// ── Tarifes €/h per tipus de servei (mercat DJ/animació BCN 2026) ─────────────
// Franja: min (sòl professional) · recommended (preu sa) · premium (alta gamma)
export const SERVICE_HOURLY_RATES = {
  fiesta_privada:    { min: 95,  recommended: 130, premium: 180 },
  boda:              { min: 160, recommended: 220, premium: 300 }, // cerimònia + festa + so
  empresa:           { min: 150, recommended: 200, premium: 280 }, // corporatiu, factura IVA
  animacion_infantil:{ min: 70,  recommended: 95,  premium: 130 }, // animador + material
  extra_hora:        { min: 80,  recommended: 110, premium: 150 }, // hora addicional sobre pack
} as const;
export type ServicePricingKey = keyof typeof SERVICE_HOURLY_RATES;

// Pont EventType Prisma → clau de tarifa. Monocapa: cap mapa local als components.
export const EVENT_TYPE_TO_PRICING_KEY: Record<string, ServicePricingKey> = {
  WEDDING: 'boda', BODA: 'boda',
  CORPORATE: 'empresa', EMPRESA: 'empresa',
  KIDS: 'animacion_infantil', INFANTIL: 'animacion_infantil', COMUNION: 'animacion_infantil',
  PARTY: 'fiesta_privada', FIESTA: 'fiesta_privada', PRIVATE: 'fiesta_privada',
  PRIVATE_PARTY: 'fiesta_privada', BIRTHDAY: 'fiesta_privada',
};
export function resolveServicePricingKey(eventType?: string | null): ServicePricingKey {
  if (!eventType) return 'fiesta_privada';
  return EVENT_TYPE_TO_PRICING_KEY[eventType.toUpperCase()] ?? 'fiesta_privada';
}

// ── Cost real €/hora d'equip per amortització ────────────────────────────────
// Fallback per categoria si l'ítem no porta dades reals de compra.
// cost/h = preu_compra / vida_útil_hores
export const EQUIPMENT_AMORTIZATION = {
  SOUND:     { value: 2400, lifeHours: 4000 }, // PA actiu (parell altaveus + subs)
  LIGHTING:  { value: 1800, lifeHours: 3000 }, // moving heads + par LED
  EFFECTS:   { value: 600,  lifeHours: 2000 }, // màquina fum / CO2 / confeti
  STRUCTURE: { value: 900,  lifeHours: 8000 }, // truss + peanyes
  CABLING:   { value: 400,  lifeHours: 5000 }, // cables, multis, DI
  TECH:      { value: 1500, lifeHours: 3500 }, // taula de mescles + micros
} as const;
export const DEFAULT_EQUIPMENT_LIFE_HOURS = 2000; // igual que expectedLifeHours al schema

/** Retorna el cost €/h d'un ítem d'inventari. Usa dades reals; sinó, fallback per categoria. */
export function getEquipmentCostPerHour(
  item: { value?: number | null; purchasePrice?: number | null; expectedLifeHours?: number | null; category?: string | null },
): number {
  const cat = (item.category ?? '') as keyof typeof EQUIPMENT_AMORTIZATION;
  const fb = EQUIPMENT_AMORTIZATION[cat];
  const price = Number(item.purchasePrice ?? item.value ?? fb?.value ?? 0);
  const life = Number(item.expectedLifeHours ?? fb?.lifeHours ?? DEFAULT_EQUIPMENT_LIFE_HOURS);
  return life > 0 ? Math.round((price / life) * 100) / 100 : 0;
}

// ── Tipus ────────────────────────────────────────────────────────────────────
export type MarginKind = 'excellent' | 'good' | 'target' | 'fair' | 'low' | 'warn' | 'critical' | 'loss' | 'info';
export type PriceTone = { hex: string; name: string; kind: MarginKind };
export type AlertLevel = 'info' | 'warn' | 'critical';
export interface PricingAlert { level: AlertLevel; code: string; message: string; }

// ── Gradient tèrmic de marge (8 tonalitats) ──────────────────────────────────
// A pitjor marge → vermell MÉS BRILLANT. Fosc = tranquil. Brillant = alarma.
export const MARGIN_TONES: { min: number; tone: PriceTone }[] = [
  { min: 60,        tone: { hex: '#16a34a', name: 'Verd brillant',   kind: 'excellent' } },
  { min: 50,        tone: { hex: '#65a30d', name: 'Verd-or',         kind: 'good'      } },
  { min: 42,        tone: { hex: '#a3a30d', name: 'Or',              kind: 'target'    } },
  { min: 34,        tone: { hex: '#ca8a04', name: 'Ambre-or',        kind: 'fair'      } },
  { min: 25,        tone: { hex: '#d97706', name: 'Ambre',           kind: 'low'       } },
  { min: 15,        tone: { hex: '#ea580c', name: 'Taronja fort',    kind: 'warn'      } },
  { min: 1,         tone: { hex: '#dc2626', name: 'Vermell',         kind: 'critical'  } },
  { min: -Infinity, tone: { hex: '#ef4444', name: 'Vermell brillant',kind: 'loss'      } },
];

export function getMarginColor(pct: number): PriceTone {
  return (MARGIN_TONES.find((t) => pct >= t.min) ?? MARGIN_TONES.at(-1)!).tone;
}

// ── Gradient tèrmic de preu per hora (6 tonalitats) ──────────────────────────
const HOURLY_TONES: { min: number; tone: PriceTone }[] = [
  { min: 220,       tone: { hex: '#16a34a', name: 'Premium',     kind: 'excellent' } },
  { min: 160,       tone: { hex: '#65a30d', name: 'Mercat alt',  kind: 'good'      } },
  { min: 110,       tone: { hex: '#a3a30d', name: 'Recomanat',   kind: 'target'    } },
  { min: 90,        tone: { hex: '#ca8a04', name: 'Mínim',       kind: 'fair'      } },
  { min: 60,        tone: { hex: '#d97706', name: 'Just',        kind: 'low'       } },
  { min: -Infinity, tone: { hex: '#dc2626', name: 'Insuficient', kind: 'critical'  } },
];

export function getHourlyColor(eur: number): PriceTone {
  return (HOURLY_TONES.find((t) => eur >= t.min) ?? HOURLY_TONES.at(-1)!).tone;
}

// ── Funció pura: càlcul complet de cost i marge d'un bolo ────────────────────
export interface FullBookingCostInput {
  total: number;
  billableHours: number | null;
  eventType?: string | null;
  distanceKm?: number | null;
  vehicleCostPerKm?: number | null;
  travelCost?: number | null;
  equipmentHourlyCost?: number | null; // suma de getEquipmentCostPerHour de l'inventari
  collaboratorCost?: number | null;
}
export interface FullBookingCostResult {
  costTransport: number;
  costEquip: number;
  costCollab: number;
  costTotal: number;
  margin: number;
  marginPct: number;
  pricePerHour: number;
  recommendedPrice: number;
  deviationPct: number;
  marginColor: PriceTone;
  alerts: PricingAlert[];
}

export function computeFullBookingCost(input: FullBookingCostInput): FullBookingCostResult {
  const hours = input.billableHours && input.billableHours > 0 ? input.billableHours : 0;
  const key = resolveServicePricingKey(input.eventType);
  const rate = SERVICE_HOURLY_RATES[key];
  const m = PRICING_INTELLIGENCE.margin;
  const dev = PRICING_INTELLIGENCE.priceDeviation;

  const costTransport = typeof input.travelCost === 'number' && input.travelCost > 0
    ? input.travelCost
    : calculateTravelCost(input.distanceKm ?? 0, input.vehicleCostPerKm ?? DEFAULT_VEHICLE_COST_PER_KM);
  const costEquip = Math.round((input.equipmentHourlyCost ?? 0) * hours * 100) / 100;
  const costCollab = Math.max(0, input.collaboratorCost ?? 0);
  const costTotal = Math.round((costTransport + costEquip + costCollab) * 100) / 100;

  const margin = Math.round((input.total - costTotal) * 100) / 100;
  const marginPct = input.total > 0 ? Math.round((margin / input.total) * 100) : 0;
  const pricePerHour = hours > 0 ? Math.round(input.total / hours) : 0;
  const recommendedPrice = hours > 0 ? hours * rate.recommended : 0;
  const deviationPct = recommendedPrice > 0
    ? Math.round(((recommendedPrice - input.total) / recommendedPrice) * 100)
    : 0;

  const alerts: PricingAlert[] = [];
  if (margin < 0)
    alerts.push({ level: 'critical', code: 'MARGIN_LOSS', message: `Perdent ${Math.abs(margin).toFixed(0)}€. Preu per sota del cost.` });
  else if (marginPct < m.LOW_MARGIN_PCT)
    alerts.push({ level: 'critical', code: 'MARGIN_LOW', message: `Marge ${marginPct}% sota el llindar de risc (${m.LOW_MARGIN_PCT}%).` });
  else if (marginPct < m.TARGET_MARGIN_PCT)
    alerts.push({ level: 'warn', code: 'MARGIN_BELOW_TARGET', message: `Marge ${marginPct}% sota l'objectiu (${m.TARGET_MARGIN_PCT}%).` });

  if (hours > 0 && pricePerHour > 0 && pricePerHour < rate.min)
    alerts.push({ level: 'warn', code: 'RATE_BELOW_MIN', message: `${pricePerHour}€/h és sota el mínim per ${key} (${rate.min}€/h).` });

  if (deviationPct > dev.CRITICAL_PCT)
    alerts.push({ level: 'critical', code: 'PRICE_DEVIATION_CRITICAL', message: `Preu ${deviationPct}% per sota del recomanat (${recommendedPrice.toFixed(0)}€).` });
  else if (deviationPct > dev.ALERT_PCT)
    alerts.push({ level: 'warn', code: 'PRICE_DEVIATION', message: `Preu ${deviationPct}% per sota del recomanat.` });

  if (costCollab > 0 && costCollab > margin && margin > 0)
    alerts.push({ level: 'warn', code: 'COLLAB_HEAVY', message: 'El col·laborador s\'emporta més que el marge net.' });

  return { costTransport, costEquip, costCollab, costTotal, margin, marginPct,
    pricePerHour, recommendedPrice, deviationPct, marginColor: getMarginColor(marginPct), alerts };
}

// ── Alerta desviació (compat amb codi existent) ───────────────────────────────
export function getPriceDeviationAlert(
  finalPrice: number,
  hours: number | null,
): { kind: 'none' | 'alert' | 'critical'; deviationPct: number; recommended: number } {
  if (!hours || hours <= 0) return { kind: 'none', deviationPct: 0, recommended: 0 };
  const recommended = hours * PRICING_INTELLIGENCE.hourlyRate.RECOMMENDED_MIN_EUR_PER_HOUR;
  const deviationPct = Math.round(((recommended - finalPrice) / recommended) * 100);
  const { ALERT_PCT, CRITICAL_PCT } = PRICING_INTELLIGENCE.priceDeviation;
  const kind = deviationPct > CRITICAL_PCT ? 'critical' : deviationPct > ALERT_PCT ? 'alert' : 'none';
  return { kind, deviationPct, recommended };
}

// ── Consells per nivell ───────────────────────────────────────────────────────
export const MARGIN_ADVICE: Record<MarginKind, string> = {
  excellent: 'Bolo rodó. Tanca i replica-ho.',
  good:      'Marge sa. Endavant sense por.',
  target:    'Acceptable. Mira de pujar una mica.',
  fair:      'Just. Retalla cost o apuja preu.',
  low:       'Risc real. Renegocia abans de tancar.',
  warn:      'Perillós. Un imprevist t\'ho menja.',
  critical:  'Quasi gratis. No ho acceptis així.',
  loss:      'Pèrdua. Refusa o reformula del tot.',
  info:      'Sense dades suficients per calcular.',
};

// ── Flux solidari de recàlculs ────────────────────────────────────────────────
export const SOLIDARITY_RULES = {
  totalPrice:   ['margin', 'eurPerHour', 'deviationAlert', 'marginColor'],
  hours:        ['eurPerHour', 'hourlyColor', 'deviationAlert'],
  collaborator: ['netMargin', 'marginColor'],
  invoiceReq:   ['taxableBase', 'vatAmount', 'netTotal', 'margin', 'marginColor'],
  distanceKm:   ['vehicleCost', 'netMargin', 'marginColor'],
  packId:       ['baseCost', 'netMargin', 'marginColor'],
  serviceType:  ['recommendedPrice', 'deviationAlert', 'rateBelowMin', 'marginColor'],
  equipmentSet: ['costEquip', 'costTotal', 'margin', 'marginColor'],
} as const;
