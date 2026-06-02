/**
 * PRICING INTELLIGENCE — Òrbita Events
 * ─────────────────────────────────────────────────────────────────────────────
 * Base canònica de negoci per a l'anàlisi de preus i marges.
 * Dissenyada per a DJ professional a Barcelona i rodalies.
 *
 * NORMA:
 * - Tots els marges es calculen sobre el preu NET (sense IVA 21%, que no és ingrés real).
 * - El preu per hora es calcula sobre hores FACTURABLES reals (inici → fi de servei),
 *   no només les hores de música, perquè el muntatge i desmuntatge no facturat
 *   és cost real de temps.
 * - Quan el preu és PACTAT manualment, el pack deixa de ser font de preu i passa
 *   a ser descriptor de servei. Cap recàlcul automàtic pot trepitjar el preu pactat.
 * - Aquesta és la font de veritat per a tots els semàfors, alerts i consells
 *   econòmics de l'admin. Cap component pot definir llindars locals.
 *
 * Última revisió: 2026-06 (base Opus MAX)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const PRICING_INTELLIGENCE = {

  // ── Llindars de marge (% sobre preu net sense IVA) ───────────────────────
  // El 40% objectiu absorbeix combustible + temps mort de muntatge/desmuntatge
  // no facturat. Per sota del 25% la reserva no cobreix estructura indirecta.
  margin: {
    GOOD_MARGIN_PCT: 55,    // Zona de confort — marge sa, negoci sostenible
    TARGET_MARGIN_PCT: 40,  // Objectiu mínim — rendible amb costs reals inclosos
    LOW_MARGIN_PCT: 25,     // Zona de risc — marge erosionat, poc coixí
    CRITICAL_MARGIN_PCT: 0, // Pèrdua directa
  },

  // ── Preu per hora DJ professional Barcelona (€/h net facturable) ─────────
  // €/h = preu net cobrat ÷ hores facturables reals (inici → fi servei)
  // Per sota de 80€/h es competeix amb amateurs, no amb professionals.
  hourlyRate: {
    MIN_MARKET_EUR_PER_HOUR: 80,        // Sòl de mercat professional
    RECOMMENDED_MIN_EUR_PER_HOUR: 100,  // No baixar sense raó estratègica clara
    MID_MARKET_EUR_PER_HOUR: 150,       // Festa privada / empresa estàndard amb equip
    MAX_MARKET_EUR_PER_HOUR: 280,       // Premium: boda completa + cerimònia + so
  },

  // ── Semàfor per KPI de marge (%) ─────────────────────────────────────────
  marginSemaphore: (pct: number, isNegative: boolean) => {
    if (isNegative || pct < 0)                              return 'danger' as const;
    if (pct < PRICING_INTELLIGENCE.margin.LOW_MARGIN_PCT)   return 'danger' as const;
    if (pct < PRICING_INTELLIGENCE.margin.TARGET_MARGIN_PCT) return 'warn' as const;
    if (pct < PRICING_INTELLIGENCE.margin.GOOD_MARGIN_PCT)   return 'warn' as const;
    return 'ok' as const;
  },

  // ── Semàfor per KPI de preu per hora (€/h) ───────────────────────────────
  hourlySemaphore: (eurPerHour: number) => {
    const { MIN_MARKET_EUR_PER_HOUR, RECOMMENDED_MIN_EUR_PER_HOUR } = PRICING_INTELLIGENCE.hourlyRate;
    if (eurPerHour < MIN_MARKET_EUR_PER_HOUR)       return 'danger' as const;
    if (eurPerHour < RECOMMENDED_MIN_EUR_PER_HOUR)  return 'warn' as const;
    return 'ok' as const;
  },

  // ── Missatges de consell per nivell (màx 8 paraules) ─────────────────────
  advice: {
    GOOD:     'Marge excel·lent — mantén aquest preu de referència',
    TARGET:   'Marge correcte — vigila el cost de transport',
    LOW:      'Marge just — revisa col·laborador o apuja preu',
    CRITICAL: 'Pèrdua directa — renegocia o rebutja aquest bolo',
  },

  // ── Mètriques addicionals de negoci ──────────────────────────────────────
  business: {
    DEPOSIT_PCT_RECOMMENDED: 30,        // % senyal recomanat per cobrir cancel·lacions
    COLLABORATOR_COST_PCT_MAX: 50,      // Alerta si col·lab > 50% del marge net
    OVERRIDE_DISCOUNT_PCT_ALERT: 15,    // Descompte sobre catàleg que dispara alerta
    COST_PER_KM_THRESHOLD: 0.45,        // €/km; alerta si transport erosiona marge
  },

} as const;

export type MarginKind = 'danger' | 'warn' | 'ok' | 'info';
