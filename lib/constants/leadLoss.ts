export const LEAD_LOST_REASONS = [
  'PRICE_TOO_HIGH',
  'DATE_UNAVAILABLE',
  'COMPETITOR_CHOSEN',
  'EVENT_CANCELLED',
  'EVENT_PASSED',
  'NO_RESPONSE',
  'NOT_QUALIFIED',
  'OUT_OF_AREA',
  'OTHER',
] as const;

export type LeadLostReason = (typeof LEAD_LOST_REASONS)[number];

export const LEAD_LOST_REASON_LABELS: Record<LeadLostReason, string> = {
  PRICE_TOO_HIGH: 'Preu massa alt',
  DATE_UNAVAILABLE: 'Data no disponible',
  COMPETITOR_CHOSEN: 'Va escollir un competidor',
  EVENT_CANCELLED: 'Esdeveniment cancel·lat',
  EVENT_PASSED: "Data d'esdeveniment passada sense conversió",
  NO_RESPONSE: 'Sense resposta',
  NOT_QUALIFIED: 'Lead no qualificat',
  OUT_OF_AREA: 'Fora de zona de servei',
  OTHER: 'Altres',
};

export function isLeadLostReason(value: unknown): value is LeadLostReason {
  return typeof value === 'string' && (LEAD_LOST_REASONS as readonly string[]).includes(value);
}

export const AUTO_LOST_REASONS = ['EVENT_PASSED'] as const;

export type AutoLostReason = (typeof AUTO_LOST_REASONS)[number];

export function isAutoLossReason(value: unknown): value is AutoLostReason {
  return typeof value === 'string' && (AUTO_LOST_REASONS as readonly string[]).includes(value);
}
