/**
 * PRICING INTELLIGENCE — Òrbita Events
 * ─────────────────────────────────────────────────────────────────────────────
 * Base canònica de negoci per a l'anàlisi de preus i marges.
 * Dissenyada per a DJ professional a Barcelona i rodalies.
 * Revisió: Opus MAX (4 rondes d'anàlisi), 2026-06.
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
 *
 * SOLIDARITAT DE CAMPS (SOLIDARITY_RULES):
 * Tocar un camp propaga la cadena fins al color final. Veure baix.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Llindars de marge (% sobre preu net, sense IVA) ─────────────────────────
// Un bolo sa viu al 45-55%. El 40% és el terra acceptable.
// Per sota del 25%, un imprevist (avaria, hora extra no cobrada) erosiona tot.
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

  // ── Preu per hora DJ professional Barcelona (€/h facturable) ──────────────
  // Per sota de 90€/h no es cobreix muntatge, desplaçament i amortització d'equip.
  hourlyRate: {
    MIN_MARKET_EUR_PER_HOUR: 90,         // Terra: per sota no és rendible professionalment
    RECOMMENDED_MIN_EUR_PER_HOUR: 110,   // Mínim a defensar sense excuses
    MID_MARKET_EUR_PER_HOUR: 160,        // Bodes i empreses estàndard
    PREMIUM_EUR_PER_HOUR: 220,           // Premium / cap de setmana alta temporada
    MAX_MARKET_EUR_PER_HOUR: 300,        // Sostre de mercat BCN (boda completa + so)
  },

  // ── Alerta de desviació de preu ────────────────────────────────────────────
  // Si el preu final s'allunya del recomanat (hores × €/h mínim) en més d'aquest %,
  // s'activa un avís "Revisa el preu".
  priceDeviation: {
    ALERT_PCT: 15,             // Desviació > 15% sobre preu recomanat → alerta
    CRITICAL_PCT: 30,          // Desviació > 30% → alerta crítica
  },

  // ── Mètriques de negoci addicionals ───────────────────────────────────────
  business: {
    DEPOSIT_PCT_RECOMMENDED: 30,        // % senyal per cobrir cancel·lacions
    COLLABORATOR_COST_PCT_MAX: 50,      // Si col·lab > 50% del marge net → alerta
    COST_PER_KM_THRESHOLD: 0.45,        // €/km límit; per sobre erosiona marge
    OVERRIDE_DISCOUNT_PCT_ALERT: 15,    // Descompte sobre catàleg → alerta
  },

} as const;

// ── Tipus ────────────────────────────────────────────────────────────────────
export type MarginKind = 'excellent' | 'good' | 'target' | 'fair' | 'low' | 'warn' | 'critical' | 'loss' | 'info';
export type PriceTone = { hex: string; name: string; kind: MarginKind };

// ── Gradient tèrmic de marge (8 tonalitats) ──────────────────────────────────
// Interpolació natural: vermell fosc (pèrdua) → ambre fosc → or → verd brillant.
// No hi ha salt brusc: cada tram té el seu hex i nom descriptiu.
// Escala tèrmica: a pitjor marge → vermell MÉS BRILLANT (no fosc)
// Fosc = subtil, tranquil. Brillant = alarma, perill real.
const MARGIN_TONES: { min: number; tone: PriceTone }[] = [
  { min: 60,        tone: { hex: '#16a34a', name: 'Verd brillant',  kind: 'excellent' } },
  { min: 50,        tone: { hex: '#65a30d', name: 'Verd-or',        kind: 'good'      } },
  { min: 42,        tone: { hex: '#a3a30d', name: 'Or',             kind: 'target'    } },
  { min: 34,        tone: { hex: '#ca8a04', name: 'Ambre-or',       kind: 'fair'      } },
  { min: 25,        tone: { hex: '#d97706', name: 'Ambre',          kind: 'low'       } },
  { min: 15,        tone: { hex: '#ea580c', name: 'Taronja fort',   kind: 'warn'      } },
  { min: 1,         tone: { hex: '#dc2626', name: 'Vermell',        kind: 'critical'  } },
  { min: -Infinity, tone: { hex: '#ef4444', name: 'Vermell brillant', kind: 'loss'    } },
];

export function getMarginColor(pct: number): PriceTone {
  return (MARGIN_TONES.find((t) => pct >= t.min) ?? MARGIN_TONES.at(-1)!).tone;
}

// ── Gradient tèrmic de preu per hora (6 tonalitats) ──────────────────────────
const HOURLY_TONES: { min: number; tone: PriceTone }[] = [
  { min: 220,       tone: { hex: '#16a34a', name: 'Premium',      kind: 'excellent' } },
  { min: 160,       tone: { hex: '#65a30d', name: 'Mercat alt',   kind: 'good'      } },
  { min: 110,       tone: { hex: '#a3a30d', name: 'Recomanat',    kind: 'target'    } },
  { min: 90,        tone: { hex: '#ca8a04', name: 'Mínim',        kind: 'fair'      } },
  { min: 60,        tone: { hex: '#d97706', name: 'Just',         kind: 'low'       } },
  { min: -Infinity, tone: { hex: '#dc2626', name: 'Insuficient',  kind: 'critical'  } },
];

export function getHourlyColor(eur: number): PriceTone {
  return (HOURLY_TONES.find((t) => eur >= t.min) ?? HOURLY_TONES.at(-1)!).tone;
}

// ── Alerta de desviació entre preu recomanat i preu final ─────────────────────
// Preu recomanat = hores × RECOMMENDED_MIN_EUR_PER_HOUR.
// Si el preu final s'allunya més del llindar configurat → avís de revisió.
export function getPriceDeviationAlert(
  finalPrice: number,
  hours: number | null,
): { kind: 'none' | 'alert' | 'critical'; deviationPct: number; recommended: number } {
  if (!hours || hours <= 0) return { kind: 'none', deviationPct: 0, recommended: 0 };
  const recommended = hours * PRICING_INTELLIGENCE.hourlyRate.RECOMMENDED_MIN_EUR_PER_HOUR;
  const deviationPct = Math.round(((recommended - finalPrice) / recommended) * 100);
  const { ALERT_PCT, CRITICAL_PCT } = PRICING_INTELLIGENCE.priceDeviation;
  const kind = deviationPct > CRITICAL_PCT ? 'critical'
    : deviationPct > ALERT_PCT ? 'alert'
    : 'none';
  return { kind, deviationPct, recommended };
}

// ── Consells per nivell (≤ 8 paraules, directes) ─────────────────────────────
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
// Quan canvia un camp de la fitxa, s'han de recalcular els camps derivats.
// Ordre de propagació: camp tocada → camps afectats → colors finals.
export const SOLIDARITY_RULES = {
  totalPrice:   ['margin', 'eurPerHour', 'deviationAlert', 'marginColor'],
  hours:        ['eurPerHour', 'hourlyColor', 'deviationAlert'],
  collaborator: ['netMargin', 'marginColor'],
  invoiceReq:   ['taxableBase', 'vatAmount', 'netTotal', 'margin', 'marginColor'],
  distanceKm:   ['vehicleCost', 'netMargin', 'marginColor'],
  packId:       ['baseCost', 'netMargin', 'marginColor'],
} as const;
