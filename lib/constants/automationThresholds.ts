// lib/constants/automationThresholds.ts
// ═══════════════════════════════════════════════════════════════════════════
// LLINDARS D'AUTOMATITZACIÓ — font única canònica
// Centralitza els llindars temporals i de volum que governen les regles
// automàtiques del repo (tasques auto, forecast capacitat). Abans vivien
// hardcodejats inline a cada servei. Mantenir-los aquí permet:
//   1. Monocapa: un sol lloc per veure i ajustar els criteris.
//   2. Base per a configurabilitat futura des d'admin settings (§6.4) sense
//      reescriure la lògica dels serveis.
// Els valors actuals reprodueixen exactament els que tenien els serveis abans
// de la centralització — aquest mòdul NO canvia comportament.
// ═══════════════════════════════════════════════════════════════════════════

const DAY_MS = 24 * 60 * 60 * 1000;

/** Llindars de `taskAutomationService` (generació de tasques operatives). */
export const TASK_AUTOMATION_THRESHOLDS = {
  /** Lead NEW sense resposta més enllà d'aquest temps → tasca SLA URGENT. */
  slaBrokenMs: 1 * DAY_MS,
  /** Lead NEW/CONTACTED sense moviment més enllà d'aquest temps → tasca stale. */
  staleLeadMs: 7 * DAY_MS,
  /** Lead QUOTE_SENT sense resposta més enllà d'aquest temps → tasca quote follow-up. */
  quoteFollowupMs: 3 * DAY_MS,
  /** Reserva amb event dins d'aquests dies → tasca de preparació. */
  bookingPrepDaysAhead: 3,
  /** Client amb healthScore igual o inferior → tasca client en risc. */
  atRiskHealthScoreMax: 40,
} as const;

/** Llindars de `operationalForecastService` (forecast capacitat setmanal). */
export const CAPACITY_FORECAST_THRESHOLDS = {
  /** Reserves per dia per sobre d'això compten com a dia sobrecarregat. */
  maxBookingsPerDay: 2,
  /** Reserves per setmana iguals o superiors → alerta WARNING. */
  weekWarningBookings: 5,
  /** Reserves per setmana iguals o superiors → alerta CRITICAL. */
  weekCriticalBookings: 7,
  /** Setmanes de forecast per defecte. */
  defaultWeeksAhead: 4,
} as const;
