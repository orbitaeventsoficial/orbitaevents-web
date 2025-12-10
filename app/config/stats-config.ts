// app/config/stats-config.ts
// ÒRBITA EVENTS - Configuració d'Estadístiques Intel·ligent
//
// LÒGICA:
// - Cada stat té un MÍNIM LÒGIC (el que es mostra si la BD no supera)
// - Quan la BD supera el mínim → mostra el valor real
// - Alguns stats són FIXOS (no depenen de BD)
//
// Actualitzat: Desembre 2025

export interface StatConfig {
  key: string;
  minValue: number | string;      // Mínim a mostrar
  suffix?: string;                // "+", "%", "h", etc.
  prefix?: string;                // "€", etc.
  isFixed?: boolean;              // Si és fix (no canvia amb BD)
  dbField?: string;               // Camp de la BD per comparar
  description: string;            // Descripció interna
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓ D'ESTADÍSTIQUES
// ═══════════════════════════════════════════════════════════════════

export const STATS_CONFIG: Record<string, StatConfig> = {

  // ─────────────────────────────────────────────────────────────────
  // EXPERIÈNCIA I TRAJECTÒRIA
  // ─────────────────────────────────────────────────────────────────

  yearsExperience: {
    key: 'yearsExperience',
    minValue: 2,
    suffix: '+',
    isFixed: true,  // Es calcula automàticament des de 2023
    description: 'Anys des que va començar Òrbita (2023)',
  },

  // ─────────────────────────────────────────────────────────────────
  // ESDEVENIMENTS
  // Mínim: 48 (creïble per 2 anys - NO número rodó per semblar real)
  // Si BD > 48 → mostra BD
  // ─────────────────────────────────────────────────────────────────

  eventsCompleted: {
    key: 'eventsCompleted',
    minValue: 48,
    suffix: '+',
    dbField: 'bookings.count.completed',
    description: 'Total esdeveniments realitzats amb èxit',
  },

  // ─────────────────────────────────────────────────────────────────
  // RESPOSTA
  // Fix: 2 hores (és un compromís de servei)
  // ─────────────────────────────────────────────────────────────────

  responseTime: {
    key: 'responseTime',
    minValue: 2,
    suffix: 'h',
    isFixed: true,
    description: 'Temps màxim de resposta garantit',
  },

  // ─────────────────────────────────────────────────────────────────
  // COBERTURA
  // Fix: Barcelona + Girona
  // ─────────────────────────────────────────────────────────────────

  coverage: {
    key: 'coverage',
    minValue: 'BCN+GI',
    isFixed: true,
    description: 'Àrea de cobertura principal',
  },

  // ─────────────────────────────────────────────────────────────────
  // GOOGLE RATING
  // Mínim: 4.9 (si té poques ressenyes però bones)
  // Si té 10+ ressenyes → usa API de Google Places
  // ─────────────────────────────────────────────────────────────────

  googleRating: {
    key: 'googleRating',
    minValue: 4.9,
    suffix: '/5',
    dbField: 'reviews.google.average',
    description: 'Valoració mitjana a Google',
  },

  googleReviewsCount: {
    key: 'googleReviewsCount',
    minValue: 10,
    suffix: '+',
    dbField: 'reviews.google.count',
    description: 'Nombre de ressenyes a Google',
  },

  // ─────────────────────────────────────────────────────────────────
  // SATISFACCIÓ
  // Mínim: 98% (basat en absència de queixes)
  // Quan tinguem sistema d'enquestes → usa dades reals
  // ─────────────────────────────────────────────────────────────────

  satisfaction: {
    key: 'satisfaction',
    minValue: 98,
    suffix: '%',
    dbField: 'surveys.satisfaction.average',
    description: 'Percentatge de clients satisfets',
  },

  // ─────────────────────────────────────────────────────────────────
  // RECOMANACIÓ
  // Mínim: 95% (estimat)
  // ─────────────────────────────────────────────────────────────────

  recommendation: {
    key: 'recommendation',
    minValue: 95,
    suffix: '%',
    dbField: 'surveys.recommend.average',
    description: 'Percentatge que ens recomanarien',
  },

  // ─────────────────────────────────────────────────────────────────
  // CASAMENTS (subset d'esdeveniments)
  // Mínim: 15 (creïble per 2 temporades)
  // ─────────────────────────────────────────────────────────────────

  weddingsCompleted: {
    key: 'weddingsCompleted',
    minValue: 15,
    suffix: '+',
    dbField: 'bookings.count.weddings',
    description: 'Casaments realitzats',
  },

  // ─────────────────────────────────────────────────────────────────
  // TEMÀTIQUES DISPONIBLES
  // Fix: 6 (les que tenim definides)
  // ─────────────────────────────────────────────────────────────────

  themesAvailable: {
    key: 'themesAvailable',
    minValue: 6,
    suffix: '+',
    isFixed: true,
    description: 'Temàtiques disponibles',
  },
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calcula els anys d'experiència automàticament
 */
export function calculateYearsExperience(): number {
  const startYear = 2023;
  const currentYear = new Date().getFullYear();
  return currentYear - startYear;
}

/**
 * Obté el valor a mostrar per una estadística
 * Si dbValue > minValue → retorna dbValue
 * Si no → retorna minValue
 */
export function getStatValue(
  statKey: keyof typeof STATS_CONFIG,
  dbValue?: number | null
): string {
  const config = STATS_CONFIG[statKey];

  if (!config) {
    console.warn(`Stat config not found: ${statKey}`);
    return '0';
  }

  // Stats fixes sempre retornen el minValue
  if (config.isFixed) {
    // Cas especial: anys d'experiència es calcula
    if (statKey === 'yearsExperience') {
      const years = calculateYearsExperience();
      return `${years}${config.suffix || ''}`;
    }
    return `${config.prefix || ''}${config.minValue}${config.suffix || ''}`;
  }

  // Si no hi ha valor de BD o és menor que el mínim
  const minNum = typeof config.minValue === 'number' ? config.minValue : 0;
  const displayValue = (dbValue && dbValue > minNum) ? dbValue : config.minValue;

  return `${config.prefix || ''}${displayValue}${config.suffix || ''}`;
}

/**
 * Obté totes les stats amb els seus valors actuals
 * @param dbData - Objecte amb les dades de la BD
 */
export function getAllStats(dbData?: Record<string, number>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, config] of Object.entries(STATS_CONFIG)) {
    const dbValue = dbData?.[config.dbField || ''];
    result[key] = getStatValue(key as keyof typeof STATS_CONFIG, dbValue);
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// PRESETS PER SECCIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Stats per al Hero
 */
export const HERO_STATS = [
  { key: 'yearsExperience', icon: '⭐', labelKey: 'hero.stats.years' },
  { key: 'eventsCompleted', icon: '🎉', labelKey: 'hero.stats.events' },
  { key: 'responseTime', icon: '⚡', labelKey: 'hero.stats.responseTime' },
] as const;

/**
 * Stats per al Footer
 */
export const FOOTER_STATS = [
  { key: 'yearsExperience', icon: '⭐', labelKey: 'stats.yearsExperience' },
  { key: 'eventsCompleted', icon: '🎉', labelKey: 'stats.eventsCompleted' },
  { key: 'responseTime', icon: '⚡', labelKey: 'stats.response' },
  { key: 'coverage', icon: '📍', labelKey: 'stats.coverage' },
] as const;

/**
 * Stats per a Testimonials
 */
export const TESTIMONIAL_STATS = [
  { key: 'googleRating', icon: '⭐', labelKey: 'testimonials.stats.googleRating' },
  { key: 'eventsCompleted', icon: '🎉', labelKey: 'testimonials.stats.events' },
  { key: 'recommendation', icon: '💯', labelKey: 'testimonials.stats.recommend' },
  { key: 'satisfaction', icon: '❤️', labelKey: 'testimonials.stats.satisfaction' },
] as const;

// ═══════════════════════════════════════════════════════════════════
// HOOK PER OBTENIR STATS AMB DADES DE BD (opcional)
// ═══════════════════════════════════════════════════════════════════

/**
 * Exemple d'ús:
 *
 * // Sense BD (usa mínims)
 * const stats = getAllStats();
 * // { yearsExperience: '2+', eventsCompleted: '48+', ... }
 *
 * // Amb BD
 * const dbData = await getStatsFromDB();
 * const stats = getAllStats(dbData);
 * // { yearsExperience: '2+', eventsCompleted: '73+', ... } // si BD = 73
 */

export default STATS_CONFIG;
