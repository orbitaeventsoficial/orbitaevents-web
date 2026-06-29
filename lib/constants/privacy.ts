export const PRIVACY_CONSENT_LABELS: Record<string, string> = {
  GDPR_BASIC: 'RGPD bàsic',
  MARKETING_EMAIL: 'Email màrqueting',
  MARKETING_SMS: 'SMS màrqueting',
  MARKETING_WHATSAPP: 'WhatsApp màrqueting',
  TERMS_OF_SERVICE: 'Termes de servei',
  PRIVACY_POLICY: 'Política privacitat',
  COOKIE_CONSENT: 'Cookies',
  COOKIE_ANALYTICS: 'Cookies analítiques',
  COOKIE_MARKETING: 'Cookies màrqueting',
  DATA_PROCESSING: 'Processament dades',
  THIRD_PARTY: 'Tercers',
  PROFILING: 'Perfilat',
};

export const PRIVACY_CONSENT_STATUS_VALUES = ['active', 'revoked', 'all'] as const;
export type PrivacyConsentStatus = (typeof PRIVACY_CONSENT_STATUS_VALUES)[number];

export const PRIVACY_REQUEST_TYPE_LABELS: Record<string, string> = {
  ACCESS: 'Accés',
  RECTIFICATION: 'Rectificació',
  ERASURE: 'Supressió',
  RESTRICTION: 'Limitació',
  PORTABILITY: 'Portabilitat',
  OBJECTION: 'Oposició',
  AUTOMATED: 'Decisions automatitzades',
};

export const PRIVACY_REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string; bg?: string; text?: string }> = {
  PENDING: { label: 'Pendent', color: 'admin-tone-text-warning', bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning' },
  IDENTITY_REQUIRED: { label: 'Identitat pendent', color: 'admin-tone-text-warning', bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning' },
  VERIFIED: { label: 'Verificada', color: 'admin-tone-text-info', bg: 'admin-tone-bg-info', text: 'admin-tone-text-info' },
  IN_PROGRESS: { label: 'En curs', color: 'admin-tone-text-info', bg: 'admin-tone-bg-info', text: 'admin-tone-text-info' },
  COMPLETED: { label: 'Completada', color: 'admin-tone-text-success', bg: 'admin-tone-bg-success', text: 'admin-tone-text-success' },
  REJECTED: { label: 'Rebutjada', color: 'admin-tone-text-danger', bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger' },
  CANCELLED: { label: 'Cancel·lada', color: 'admin-tone-text-neutral', bg: 'admin-tone-bg-neutral', text: 'admin-tone-text-neutral' },
};

export const PRIVACY_PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'Alta', color: 'admin-tone-text-danger' },
  MEDIUM: { label: 'Mitjana', color: 'admin-tone-text-warning' },
  LOW: { label: 'Baixa', color: 'admin-tone-text-neutral' },
};

export const PRIVACY_AUDIT_ACTION_LABELS: Record<string, string> = {
  DATA_ACCESSED: 'Dades consultades',
  DATA_EXPORTED: 'Dades exportades',
  DATA_CREATED: 'Dades creades',
  DATA_UPDATED: 'Dades actualitzades',
  DATA_DELETED: 'Dades eliminades',
  DATA_ANONYMIZED: 'Dades anonimitzades',
  CONSENT_GRANTED: 'Consentiment atorgat',
  CONSENT_REVOKED: 'Consentiment revocat',
  ACCOUNT_DELETED: 'Compte eliminat',
  RETENTION_APPLIED: 'Retenció aplicada',
};

export const PRIVACY_REQUEST_ARTICLES: Record<string, string> = {
  ACCESS: '15',
  RECTIFICATION: '16',
  ERASURE: '17',
  RESTRICTION: '18',
  PORTABILITY: '20',
  OBJECTION: '21',
  AUTOMATED: '22',
};

export function getPrivacyConsentLabel(consentType: string) {
  return PRIVACY_CONSENT_LABELS[consentType] || consentType;
}

export function getPrivacyRequestTypeLabel(requestType: string) {
  return PRIVACY_REQUEST_TYPE_LABELS[requestType] || requestType;
}

export function getPrivacyRequestStatusDisplay(status: string) {
  return PRIVACY_REQUEST_STATUS_CONFIG[status] || PRIVACY_REQUEST_STATUS_CONFIG.PENDING;
}

export function getPrivacyPriorityDisplay(priority: string) {
  return PRIVACY_PRIORITY_CONFIG[priority] || PRIVACY_PRIORITY_CONFIG.MEDIUM;
}

/**
 * Versió vigent del consentiment RGPD bàsic (GDPR_BASIC) que es registra quan un
 * client envia el formulari de contacte. Pujar quan canviï el text legal de privacitat.
 */
export const PRIVACY_CONSENT_VERSION = '1.0';
