export const POST_EVENT_REVIEW_MARKERS = [
  'revisar consentiment',
  'dades personals',
  'no publicat automaticament',
] as const;

export const POST_EVENT_REVIEW_RESOLVED_NOTE = 'Revisió post-event resolta: permís, imatges i privacitat revisats.';

export const SOCIAL_REVIEW_GATED_STATUSES = new Set(['SCHEDULED', 'PUBLISHED']);

export const SOCIAL_REVIEW_BLOCKED_MESSAGE = 'Revisa consentiment, imatges i dades personals abans de programar o publicar.';
