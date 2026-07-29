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
  dj:                { min: 100, recommended: 145, premium: 210 }, // DJ professional sense reforç tècnic extra
  sonorizacion:      { min: 75,  recommended: 110, premium: 160 }, // PA + micro/tècnic, sense sessió DJ
  dj_sonorizacion:   { min: 125, recommended: 175, premium: 245 }, // DJ + PA/llum bàsica
  boda_dj:           { min: 150, recommended: 210, premium: 290 }, // festa de boda amb DJ
  boda_sonorizacion: { min: 95,  recommended: 140, premium: 200 }, // cerimònia/còctel sonoritzat, sense DJ festa
  boda_completa:     { min: 170, recommended: 240, premium: 330 }, // cerimònia + festa + so
  fiesta_privada:    { min: 95,  recommended: 130, premium: 180 },
  boda:              { min: 160, recommended: 220, premium: 300 }, // cerimònia + festa + so
  empresa:           { min: 150, recommended: 200, premium: 280 }, // corporatiu, factura IVA
  animacion_infantil:{ min: 70,  recommended: 95,  premium: 130 }, // animador + material
  extra_hora:        { min: 80,  recommended: 110, premium: 150 }, // hora addicional sobre pack
} as const;
export type ServicePricingKey = keyof typeof SERVICE_HOURLY_RATES;

// Pont EventType Prisma → clau de tarifa. Monocapa: cap mapa local als components.
export const EVENT_TYPE_TO_PRICING_KEY: Record<string, ServicePricingKey> = {
  WEDDING: 'boda_completa', BODA: 'boda_completa',
  CORPORATE: 'empresa', EMPRESA: 'empresa',
  KIDS: 'animacion_infantil', INFANTIL: 'animacion_infantil', COMUNION: 'animacion_infantil',
  PARTY: 'fiesta_privada', FIESTA: 'fiesta_privada', PRIVATE: 'fiesta_privada',
  PRIVATE_PARTY: 'fiesta_privada', BIRTHDAY: 'fiesta_privada',
};

export interface ServicePricingResolutionInput {
  eventType?: string | null;
  packService?: string | null;
  packSlug?: string | null;
  packName?: string | null;
  extraSlugs?: string[];
  soundWatts?: number | null;
  djHours?: number | null;
}

function hasAnyToken(text: string, tokens: string[]) {
  return tokens.some((token) => text.includes(token));
}

// Resol servei real, no només EventType. Manté fallback conservador per dades antigues.
export function resolveServicePricingKey(input?: string | ServicePricingResolutionInput | null): ServicePricingKey {
  const ctx: ServicePricingResolutionInput = typeof input === 'string'
    ? { eventType: input }
    : input ?? {};
  const text = [
    ctx.eventType, ctx.packService, ctx.packSlug, ctx.packName, ...(ctx.extraSlugs ?? []),
  ].filter(Boolean).join(' ').toLowerCase();
  const event = ctx.eventType?.toUpperCase();
  const isWedding = event === 'WEDDING' || event === 'BODA' || hasAnyToken(text, ['boda', 'wedding', 'casament']);
  const hasDj = Number(ctx.djHours ?? 0) > 0 || hasAnyToken(text, ['dj', 'discomovil', 'discoteca', 'festa', 'fiesta']);
  const hasSound = Number(ctx.soundWatts ?? 0) > 0 || hasAnyToken(text, [
    'sonor', 'sonid', 'sound', 'pa ', 'micro', 'cerimon', 'ceremon', 'cocktail', 'coctel',
  ]);

  if (isWedding && hasDj && hasSound) return 'boda_completa';
  if (isWedding && hasDj) return 'boda_dj';
  if (isWedding && hasSound) return 'boda_sonorizacion';
  if (hasDj && hasSound) return 'dj_sonorizacion';
  if (hasSound) return 'sonorizacion';
  if (hasDj) return 'dj';
  if (!event) return 'fiesta_privada';
  return EVENT_TYPE_TO_PRICING_KEY[event] ?? 'fiesta_privada';
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
  amortization: Record<string, { value: number; lifeHours: number }> = EQUIPMENT_AMORTIZATION,
): number {
  const cat = item.category ?? '';
  const fb = amortization[cat];
  const price = Number(item.purchasePrice ?? item.value ?? fb?.value ?? 0);
  const life = Number(item.expectedLifeHours ?? fb?.lifeHours ?? DEFAULT_EQUIPMENT_LIFE_HOURS);
  return life > 0 ? Math.round((price / life) * 100) / 100 : 0;
}

// ── Tipus ────────────────────────────────────────────────────────────────────
export type MarginKind = 'excellent' | 'good' | 'target' | 'fair' | 'low' | 'warn' | 'critical' | 'loss' | 'info';
export type PriceTone = { hex: string; name: string; kind: MarginKind };

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
