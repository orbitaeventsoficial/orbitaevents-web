// lib/constants/index.ts
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Ã’RBITA EVENTS - CONSTANTES CENTRALIZADAS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

type StatusTone = {
  bg: string;
  text: string;
  border: string;
  label: string;
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONTACTO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const WHATSAPP_NUMBER = '34699121023';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_URL_WITH_MESSAGE = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LEAD STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const LEAD_STATUS_CONFIG: Record<string, StatusTone> = {
  NEW: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Nova entrada' },
  CONTACTED: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Contactat' },
  QUOTE_SENT: { bg: 'admin-tone-bg-violet', text: 'admin-tone-text-violet', border: 'admin-tone-border-violet', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'NegociaciÃ³' },
  WON: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Guanyat!' },
  LOST: { bg: 'admin-tone-bg-slate', text: 'admin-tone-text-slate', border: 'admin-tone-border-slate', label: 'Perdut' },
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BOOKING STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const BOOKING_STATUS_CONFIG: Record<string, StatusTone> = {
  PENDING: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Pendent' },
  CONFIRMED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Confirmada' },
  PREPARING: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Preparant' },
  COMPLETED: { bg: 'admin-tone-bg-teal', text: 'admin-tone-text-teal', border: 'admin-tone-border-teal', label: 'Completada' },
  CANCELLED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'CancelÂ·lada' },
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROPOSAL STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const PROPOSAL_STATUS_CONFIG: Record<string, StatusTone> = {
  DRAFT: { bg: 'admin-tone-bg-neutral', text: 'admin-tone-text-neutral', border: 'admin-tone-border-neutral', label: 'Esborrany' },
  SENT: { bg: 'admin-tone-bg-cyan', text: 'admin-tone-text-cyan', border: 'admin-tone-border-cyan', label: 'Enviat' },
  VIEWED: { bg: 'admin-tone-bg-violet', text: 'admin-tone-text-violet', border: 'admin-tone-border-violet', label: 'Vist' },
  ACCEPTED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Acceptat' },
  REJECTED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Rebutjat' },
  EXPIRED: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Caducat' },
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONTRACT STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const CONTRACT_STATUS_CONFIG: Record<string, StatusTone> = {
  DRAFT: { bg: 'admin-tone-bg-neutral', text: 'admin-tone-text-neutral', border: 'admin-tone-border-neutral', label: 'Esborrany' },
  SENT: { bg: 'admin-tone-bg-cyan', text: 'admin-tone-text-cyan', border: 'admin-tone-border-cyan', label: 'Enviat' },
  SIGNED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Signat' },
  CANCELLED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'CancelÂ·lat' },
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Esborrany',
  PENDING_SYNC: 'Sincronitzant...',
  SYNCED: 'Sincronitzada',
  SYNC_ERROR: 'Error sync',
  PAID: 'Pagada',
  CANCELLED: 'CancelÂ·lada',
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EVENT TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** Emoji + label (default display) */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'ðŸ’ Casament',
  BIRTHDAY: 'ðŸŽ‚ Aniversari',
  CORPORATE: 'ðŸŽ¯ Corporatiu',
  COMMUNION: 'â›ª ComuniÃ³',
  BAPTISM: 'ðŸ‘¶ Bateig',
  GRADUATION: 'ðŸŽ“ GraduaciÃ³',
  ANNIVERSARY: 'ðŸŽ‰ CelebraciÃ³',
  PRIVATE_PARTY: 'ðŸŽµ Festa privada',
  OTHER: 'ðŸ“‹ Altre',
};

/** Emoji only (for compact views like pipeline cards) */
export const EVENT_TYPE_ICONS: Record<string, string> = {
  WEDDING: 'ðŸ’',
  BIRTHDAY: 'ðŸŽ‚',
  CORPORATE: 'ðŸŽ¯',
  COMMUNION: 'â›ª',
  BAPTISM: 'ðŸ‘¶',
  GRADUATION: 'ðŸŽ“',
  ANNIVERSARY: 'ðŸŽ‰',
  PRIVATE_PARTY: 'ðŸŽµ',
  OTHER: 'ðŸ“‹',
};

/** Plain text labels without emoji (for selects and forms) */
export const EVENT_TYPE_PLAIN: Record<string, string> = {
  WEDDING: 'Casament',
  BIRTHDAY: 'Aniversari',
  CORPORATE: 'Corporatiu',
  COMMUNION: 'ComuniÃ³',
  BAPTISM: 'Bateig',
  GRADUATION: 'GraduaciÃ³',
  ANNIVERSARY: 'CelebraciÃ³',
  PRIVATE_PARTY: 'Festa privada',
  OTHER: 'Altre',
};

export function getEventTypeDisplay(eventType: string) {
  return {
    label: EVENT_TYPE_PLAIN[eventType] || eventType,
    icon: EVENT_TYPE_ICONS[eventType] || 'ðŸ“…',
  };
};

export const EVENT_TYPE_DOCUMENT_LABELS: Record<string, string> = {
  WEDDING: 'Boda',
  BIRTHDAY: 'Aniversari / CumpleaÃ±os',
  CORPORATE: 'Esdeveniment Corporatiu',
  COMMUNION: 'ComuniÃ³',
  BAPTISM: 'Bateig',
  GRADUATION: 'GraduaciÃ³',
  ANNIVERSARY: 'Aniversari',
  PRIVATE_PARTY: 'Festa Privada',
  OTHER: 'Esdeveniment',
};

export const RECENT_FEED_EVENT_TYPE_SERVICE_LABELS: Record<string, string> = {
  WEDDING: 'DJ + ProducciÃ³ Boda',
  BIRTHDAY: 'Festa Aniversari',
  CORPORATE: 'Event Corporatiu',
  COMMUNION: 'ComuniÃ³',
  BAPTISM: 'Bateig',
  GRADUATION: 'GraduaciÃ³',
  ANNIVERSARY: 'Aniversari',
  PRIVATE_PARTY: 'Festa Privada',
  OTHER: 'Event Especial',
};

export const RECENT_FEED_EVENT_TYPE_ICONS: Record<string, 'check' | 'sparkles' | 'heart' | 'building'> = {
  WEDDING: 'heart',
  BIRTHDAY: 'sparkles',
  CORPORATE: 'building',
  COMMUNION: 'sparkles',
  BAPTISM: 'heart',
  GRADUATION: 'sparkles',
  ANNIVERSARY: 'heart',
  PRIVATE_PARTY: 'sparkles',
  OTHER: 'check',
};

export const RECENT_FEED_BOOKING_STATUSES = ['CONFIRMED', 'PREPARING', 'COMPLETED'] as const;
export const RECENT_FEED_ANONYMOUS_NAMES: Record<string, readonly string[]> = {
  WEDDING: ['Marc & Laura', 'Pau & Maria', 'Joan & Anna', 'Albert & Carla'],
  BIRTHDAY: ['Sara', 'Marc', 'Laura', 'Pol', 'Maria'],
  CORPORATE: ['Empresa Tech', 'Start-up BCN', 'Consulting SL'],
  PRIVATE_PARTY: ['Marc', 'Laura', 'Joan', 'Anna'],
  COMMUNION: ['FamÃ­lia GarcÃ­a', 'FamÃ­lia LÃ³pez'],
  BAPTISM: ['FamÃ­lia MartÃ­', 'FamÃ­lia Puig'],
  OTHER: ['Client VIP', 'Reserva especial'],
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRIORITY (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const PRIORITY_CONFIG: Record<string, StatusTone> = {
  LOW: { bg: 'admin-tone-bg-slate', text: 'admin-tone-text-slate', border: 'admin-tone-border-slate', label: 'Baixa' },
  MEDIUM: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Mitjana' },
  HIGH: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Alta' },
  URGENT: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Urgent' },
};

/** Plain text priority labels (for selects and forms) */
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Mitjana',
  HIGH: 'Alta',
  URGENT: 'Urgent',
};

/** Plain text lead status labels (for selects and forms) */
export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Nou lead',
  CONTACTED: 'Contactat',
  QUOTE_SENT: 'Pressupost enviat',
  NEGOTIATING: 'En negociaciÃ³',
  WON: 'Guanyat',
  LOST: 'Perdut',
};

export const LEAD_STATUS_ANALYTICS_LABELS: Record<string, string> = {
  NEW: 'Nous',
  CONTACTED: 'Contactats',
  QUOTE_SENT: 'Pressupost',
  NEGOTIATING: 'Negociant',
  WON: 'Guanyats',
  LOST: 'Perduts',
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LOCALE MAPPING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const LOCALE_MAP: Record<string, string> = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
};

/** Convert a short locale ('ca', 'es', 'en') to its Intl equivalent ('ca-ES', etc.).
 *  If already a full locale (e.g. 'ca-ES'), returns as-is. */
export function toIntlLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? locale;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORMATTING HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const DEFAULT_LOCALE = 'ca-ES';

export function formatDate(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Short date without year: "24 feb" */
export function formatDateShort(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(toIntlLocale(locale), { day: '2-digit', month: 'short' });
}

/** Full date with weekday: "dl. 24 feb 2026" */
export function formatDateFull(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(toIntlLocale(locale), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Locale-default date (no specific options): "24/2/2026" */
export function formatDateSimple(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(toIntlLocale(locale));
}

/** Full datetime with seconds: "24/2/2026, 14:30:00" */
export function formatDateTimeFull(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleString(toIntlLocale(locale));
}

/** Number with locale formatting */
export function formatNumber(value: number | null | undefined, opts?: Intl.NumberFormatOptions, locale = 'ca-ES'): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString(toIntlLocale(locale), opts);
}

export function formatCurrency(amount: number | null | undefined, locale = 'ca-ES'): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Case-insensitive event type label lookup (DB uses UPPER, forms may use lower) */
export function getEventLabel(eventType: string, fallback?: string): string {
  return EVENT_TYPE_PLAIN[eventType] || EVENT_TYPE_PLAIN[eventType.toUpperCase()] || fallback || eventType;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BUSINESS DEFAULTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** Default expected life hours for inventory items */
export const DEFAULT_EXPECTED_LIFE_HOURS = 2000;

/** Sentinel email domain for leads without a real email */
export const PLACEHOLDER_EMAIL_DOMAIN = '@leads.orbitaevents.local';

/** Minimum total spent (EUR) to consider a customer VIP */
export const VIP_SPEND_THRESHOLD = 2000;










export const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'] as const;
export const ACTIVE_INVENTORY_BOOKING_STATUSES = ['CONFIRMED', 'PREPARING'] as const;


export const BOOKING_STATUS_OPTIONS = Object.entries(BOOKING_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export function getLeadStatusDisplay(status: string) {
  return LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.NEW;
}

export function getBookingStatusDisplay(status: string) {
  return BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG.PENDING;
}

export function getLeadPriorityDisplay(priority: string) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
}

export function getProposalStatusDisplay(status: string) {
  return PROPOSAL_STATUS_CONFIG[status] || PROPOSAL_STATUS_CONFIG.DRAFT;
}

export function getContractStatusDisplay(status: string) {
  return CONTRACT_STATUS_CONFIG[status] || CONTRACT_STATUS_CONFIG.DRAFT;
}

export function getContractStatusLabel(status: string | null, fallback = 'Pendent') {
  if (!status) return fallback;
  return getContractStatusDisplay(status).label;
}

export function getInvoiceStatusLabel(status: string) {
  return INVOICE_STATUS_LABELS[status] || status;
}

export function getBookingStatusLabel(status: string) {
  return getBookingStatusDisplay(status).label;
}

export function getTaskStatusLabel(status: string) {
  return TASK_STATUS_LABELS[status] || status;
}

export function getLeadStatusAnalyticsDisplay(status: string) {
  return {
    label: LEAD_STATUS_ANALYTICS_LABELS[status] || status,
    tone: LEAD_STATUS_CONFIG[status]?.bg || 'admin-tone-bg-neutral',
  };
}

export const PROPOSAL_FILTERABLE_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_PLAIN).map(([value, label]) => ({
  value,
  label,
}));

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'TelÃ¨fon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Boca-orella',
  GOOGLE: 'Google',
  OTHER: 'Altre',
};

export const SOURCE_ICONS: Record<string, string> = {
  WEBSITE: 'ðŸŒ',
  CONFIGURATOR: 'âš™ï¸',
  PHONE: 'ðŸ“ž',
  WHATSAPP: 'ðŸ’¬',
  INSTAGRAM: 'ðŸ“¸',
  WALLAPOP: 'ðŸŸ£',
  REFERRAL: 'ðŸ‘¥',
  GOOGLE: 'ðŸ”',
  OTHER: 'ðŸ“©',
};

export function getSourceDisplay(source: string) {
  return {
    label: SOURCE_LABELS[source] || 'Altre',
    icon: SOURCE_ICONS[source] || 'ðŸ“©',
  };
};

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const LEAD_STATUS_ACTION_OPTIONS = [
  { value: 'NEW', label: 'Nova entrada', tone: 'admin-tone-bg-info', icon: 'ðŸ†•' },
  { value: 'CONTACTED', label: 'Contactat', tone: 'admin-tone-bg-warning', icon: 'ðŸ“ž' },
  { value: 'QUOTE_SENT', label: 'Pressupost enviat', tone: 'admin-tone-bg-neutral', icon: 'ðŸ“„' },
  { value: 'NEGOTIATING', label: 'En negociaciÃ³', tone: 'admin-tone-bg-warning', icon: 'ðŸ¤' },
  { value: 'WON', label: 'Guanyat!', tone: 'admin-tone-bg-success', icon: 'âœ…' },
  { value: 'LOST', label: 'Perdut', tone: 'admin-tone-bg-danger', icon: 'âŒ' },
] as const;

export const LEAD_PIPELINE_COLUMNS = [
  { status: 'NEW', label: 'Noves', toneClass: 'admin-leads-tone admin-leads-tone--new', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--new' },
  { status: 'CONTACTED', label: 'Contactat', toneClass: 'admin-leads-tone admin-leads-tone--contacted', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--contacted' },
  { status: 'QUOTE_SENT', label: 'Pressupost enviat', toneClass: 'admin-leads-tone admin-leads-tone--quote', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--quote' },
  { status: 'NEGOTIATING', label: 'Negociant', toneClass: 'admin-leads-tone admin-leads-tone--negotiating', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--negotiating' },
  { status: 'WON', label: 'Guanyat', toneClass: 'admin-leads-tone admin-leads-tone--won', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--won' },
  { status: 'LOST', label: 'Perdut', toneClass: 'admin-leads-tone admin-leads-tone--lost', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--lost' },
] as const;

export const PRIORITY_DOT_CLASS: Record<string, string> = {
  LOW: 'admin-tone-bg-neutral',
  MEDIUM: 'admin-tone-bg-info',
  HIGH: 'admin-tone-bg-warning',
  URGENT: 'admin-tone-bg-danger',
};

export const LEAD_SCORE_BAND_LABELS: Record<string, string> = {
  LOW: 'BAIX',
  MEDIUM: 'MITJÃ€',
  HIGH: 'ALT',
};

export const BOOKING_STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;
export const DELETABLE_BOOKING_STATUSES = ['PENDING', 'CANCELLED'] as const;
export const BOOKING_CALENDAR_SYNC_FIELDS = ['status', 'eventDate', 'eventLocation', 'eventVenue', 'startTime', 'endTime', 'notes'] as const;

export const BOOKING_DETAIL_SECTIONS = [
  { id: 'sec-client', label: 'Client' },
  { id: 'sec-event', label: 'Event' },
  { id: 'sec-serveis', label: 'Serveis' },
  { id: 'sec-equipament', label: 'Equipament' },
  { id: 'sec-portal', label: 'Portal' },
  { id: 'sec-finances', label: 'Finances' },
  { id: 'sec-marge', label: 'Marge' },
  { id: 'sec-documents', label: 'Documents' },
  { id: 'sec-comunicacions', label: 'Comunicacions' },
  { id: 'sec-historial', label: 'Historial' },
  { id: 'sec-galeria', label: 'Galeria' },
] as const;

export const BOOKING_GALLERY_PORTFOLIO_CATEGORIES = [
  { slug: 'bodas', name: 'Bodas' },
  { slug: 'discomovil', name: 'Discomovil' },
  { slug: 'eventos-empresa', name: 'Eventos empresa' },
  { slug: 'fiestas-infantiles', name: 'Fiestas infantiles' },
  { slug: 'fiestas-privadas', name: 'Fiestas privadas' },
  { slug: 'produccion-tecnica', name: 'ProducciÃ³n tÃ©cnica' },
  { slug: 'alquiler-equipo', name: 'Alquiler equipo' },
  { slug: 'fiestas-tematicas-halloween', name: 'Fiestas temÃ¡ticas Halloween' },
  { slug: 'fiestas-tematicas-mon-magic', name: 'Fiestas temÃ¡ticas MÃ³n MÃ gic' },
] as const;

export const INVENTORY_CATEGORY_LABELS: Record<string, string> = {
  SOUND: 'ðŸ”Š So',
  LIGHTING: 'ðŸ’¡ IlÂ·lum.',
  EFFECTS: 'âœ¨ Efectes',
  STRUCTURE: 'ðŸ—ï¸ Estruct.',
  CABLING: 'ðŸ”Œ Cable',
  TECH: 'ðŸ’» Tech',
  DECORATION_HP: 'ðŸŽƒ Deco HP',
  DECORATION_HW: 'ðŸŽ„ Deco HW',
  DECORATION_GEN: 'ðŸŽ¨ Deco Gen',
  CONSUMABLE: 'ðŸ“¦ Consum.',
};

export const INVENTORY_CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Nou' },
  { value: 'EXCELLENT', label: 'ExcelÂ·lent' },
  { value: 'GOOD', label: 'Bo' },
  { value: 'FAIR', label: 'Acceptable' },
  { value: 'POOR', label: 'Dolent' },
] as const;

export const SETTINGS_SENSITIVE_KEY_FRAGMENTS = ['refreshToken', 'accessToken', 'secret', 'password', 'apiKey'] as const;

export const SETTINGS_TYPE_LABELS = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
} as const;

export const SETTINGS_CATEGORY_CONFIG: Record<string, { label: string; icon: string; description: string }> = {
  stats: {
    label: 'EstadÃ­stiques PÃºbliques',
    icon: 'ðŸ“Š',
    description: 'NÃºmeros que apareixen a la web (esdeveniments, persones, etc.)',
  },
  company: {
    label: 'Empresa',
    icon: 'ðŸ¢',
    description: 'Dades legals i nom comercial (edita a ConfiguraciÃ³ empresa)',
  },
  holded: {
    label: 'Holded',
    icon: 'ðŸ§¾',
    description: 'IntegraciÃ³ amb Holded per facturaciÃ³',
  },
  contact: {
    label: 'Contacte',
    icon: 'ðŸ“ž',
    description: 'TelÃ¨fon, email, horaris...',
  },
  pricing: {
    label: 'Preus',
    icon: 'ðŸ’°',
    description: 'Preus base, hora extra, descomptes...',
  },
  config: {
    label: 'ConfiguraciÃ³ General',
    icon: 'âš™ï¸',
    description: 'Altres configuracions del sistema',
  },
  social: {
    label: 'Xarxes Socials',
    icon: 'ðŸ“±',
    description: 'Perfils socials i enllaÃ§os',
  },
};

export const CUSTOMER_SOURCE_LABELS: Record<string, string> = {
  website: 'Web',
  configurator: 'Configurador',
  phone: 'TelÃ¨fon',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  wallapop: 'Wallapop',
  referral: 'Boca-orella',
  google: 'Google',
  other: 'Altre',
  manual: 'Manual',
  testimonial_form: 'Ressenya',
};

export function getCustomerSourceLabel(source?: string | null, fallback = 'Desconeguda') {
  if (!source) return fallback;
  return CUSTOMER_SOURCE_LABELS[source] || CUSTOMER_SOURCE_LABELS[source.toLowerCase()] || source;
}

export const DISCOUNT_SOURCE_LABELS: Record<string, string> = {
  POST_EVENT: 'Post-event',
  TESTIMONIAL: 'Testimoni',
  REFERRAL: 'RecomanaciÃ³',
  MANUAL: 'Manual',
};

export function getDiscountSourceLabel(sourceType: string) {
  return DISCOUNT_SOURCE_LABELS[sourceType] || sourceType;
}

export const INTAKE_SOURCE_OPTIONS = [
  { value: 'PHONE', label: 'TelÃ¨fon', icon: 'ðŸ“ž' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'ðŸ’¬' },
  { value: 'INSTAGRAM', label: 'Instagram', icon: 'ðŸ“¸' },
  { value: 'WALLAPOP', label: 'Wallapop', icon: 'ðŸŸ¢' },
  { value: 'REFERRAL', label: 'Boca-orella', icon: 'ðŸ—£ï¸' },
  { value: 'GOOGLE', label: 'Google', icon: 'ðŸ”' },
  { value: 'WEBSITE', label: 'Web', icon: 'ðŸŒ' },
  { value: 'OTHER', label: 'Altre', icon: 'ðŸ“‹' },
] as const;

export const INTAKE_SOURCE_SELECTED_STYLES: Record<string, string> = {
  PHONE: 'border-sky-400/70 bg-sky-500/25 text-sky-100',
  WHATSAPP: 'border-emerald-400/70 bg-emerald-500/25 text-emerald-100',
  INSTAGRAM: 'border-pink-400/70 bg-pink-500/25 text-pink-100',
  WALLAPOP: 'border-lime-400/70 bg-lime-500/25 text-lime-100',
  REFERRAL: 'border-orange-400/70 bg-orange-500/25 text-orange-100',
  GOOGLE: 'border-amber-400/70 bg-amber-500/25 text-amber-100',
  WEBSITE: 'border-cyan-400/70 bg-cyan-500/25 text-cyan-100',
  OTHER: 'border-white/20 bg-white/10 text-white/90',
};

export const INTAKE_EVENT_TYPE_OPTIONS = [
  { value: 'WEDDING', label: 'Casament', icon: 'ðŸ’' },
  { value: 'BIRTHDAY', label: 'Aniversari', icon: 'ðŸŽ‚' },
  { value: 'CORPORATE', label: 'Corporatiu', icon: 'ðŸŽ¯' },
  { value: 'COMMUNION', label: 'ComuniÃ³', icon: 'â›ª' },
  { value: 'BAPTISM', label: 'Bateig', icon: 'ðŸ‘¶' },
  { value: 'GRADUATION', label: 'GraduaciÃ³', icon: 'ðŸŽ“' },
  { value: 'ANNIVERSARY', label: 'CelebraciÃ³', icon: 'ðŸŽ‰' },
  { value: 'PRIVATE_PARTY', label: 'Festa privada', icon: 'ðŸŽµ' },
  { value: 'OTHER', label: 'Altre', icon: 'ðŸ“‹' },
] as const;

export const INTAKE_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa', selected: 'border-white/15 bg-white/5 text-white/80' },
  { value: 'MEDIUM', label: 'Mitjana', selected: 'border-sky-400/60 bg-sky-500/20 text-sky-100' },
  { value: 'HIGH', label: 'Alta', selected: 'border-orange-400/60 bg-orange-500/20 text-orange-100' },
  { value: 'URGENT', label: 'Urgent', selected: 'border-rose-400/70 bg-rose-500/25 text-rose-100' },
] as const;

export const INVENTORY_CATEGORY_OPTIONS = [
  { value: 'SOUND', label: 'So', icon: 'ðŸ”Š' },
  { value: 'LIGHTING', label: 'IlÂ·luminaciÃ³', icon: 'ðŸ’¡' },
  { value: 'EFFECTS', label: 'Efectes', icon: 'âœ¨' },
  { value: 'STRUCTURE', label: 'Estructura', icon: 'ðŸ—ï¸' },
  { value: 'CABLING', label: 'Cablejat', icon: 'ðŸ”Œ' },
  { value: 'TECH', label: 'Tecnologia', icon: 'ðŸ’»' },
  { value: 'DECORATION_HP', label: 'Deco HP', icon: 'ðŸŽƒ' },
  { value: 'DECORATION_HW', label: 'Deco HW', icon: 'ðŸŽ„' },
  { value: 'DECORATION_GEN', label: 'Deco General', icon: 'ðŸŽ¨' },
  { value: 'CONSUMABLE', label: 'Consumibles', icon: 'ðŸ“¦' },
] as const;

export const INVENTORY_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'IN_USE', label: 'En Ãºs' },
  { value: 'MAINTENANCE', label: 'Manteniment' },
  { value: 'BROKEN', label: 'Avariat' },
  { value: 'RETIRED', label: 'Retirat' },
] as const;
export const BLOG_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'bodas', label: 'Bodes' },
  { value: 'eventos', label: 'Esdeveniments' },
  { value: 'consejos', label: 'Consells' },
  { value: 'tendencias', label: 'TendÃ¨ncies' },
  { value: 'tecnologia', label: 'Tecnologia' },
] as const;

export const FAQ_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'sound', label: 'So' },
  { value: 'lighting', label: 'IlÂ·luminaciÃ³' },
  { value: 'pricing', label: 'Preus' },
  { value: 'booking', label: 'Reserves' },
] as const;

export const FAQ_CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  general: { label: 'General', icon: 'ðŸ“‹' },
  sound: { label: 'So', icon: 'ðŸ”Š' },
  lighting: { label: 'IlÂ·luminaciÃ³', icon: 'ðŸ’¡' },
  pricing: { label: 'Preus', icon: 'ðŸ’°' },
  booking: { label: 'Reserves', icon: 'ðŸ“…' },
};
export function getFaqCategoryDisplay(category: string) {
  return FAQ_CATEGORY_CONFIG[category] || { label: category, icon: '❓' };
}
export const ACTIVITY_CATEGORY_OPTIONS = [
  { id: 'all', label: 'Tot', icon: 'ðŸ“Š' },
  { id: 'comms', label: 'Comunicacions', icon: 'âœ‰ï¸' },
  { id: 'automation', label: 'Automatitzacions', icon: 'âš¡' },
  { id: 'system', label: 'Sistema', icon: 'ðŸ”„' },
  { id: 'crud', label: 'Operacions', icon: 'ðŸ“' },
] as const;

export const ACTIVITY_DAYS_OPTIONS = [
  { value: 1, label: 'Avui' },
  { value: 7, label: '7 dies' },
  { value: 30, label: '30 dies' },
  { value: 90, label: '90 dies' },
] as const;

export const CATALOG_TAB_META = {
  packs: {
    label: 'Packs',
    title: 'Packs de servei',
    description: 'Gestiona packs base, contingut i preus inicials.',
  },
  extras: {
    label: 'Extres',
    title: 'CatÃ leg d\'extres',
    description: 'Defineix extres comercials i compatibilitats per servei.',
  },
  inventory: {
    label: 'Inventari',
    title: 'Inventari operatiu',
    description: 'Controla estat, Ãºs i disponibilitat del material.',
  },
  pricing: {
    label: 'Regles de preu',
    title: 'Preus i rendiment',
    description: 'Edita preus, revisa rendiment i ajusta marges.',
  },
} as const;

export const EMAIL_ACTIVITY_DISPLAY: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  POST_EVENT_EMAIL_SENT: {
    label: 'Email post-event enviat',
    icon: 'ðŸ“§',
    bg: 'admin-tone-bg-info',
    text: 'admin-tone-text-info',
  },
  TESTIMONIAL_SUBMITTED: {
    label: 'ValoraciÃ³ rebuda',
    icon: 'â­',
    bg: 'admin-tone-bg-warning',
    text: 'admin-tone-text-warning',
  },
  DISCOUNT_CODE_GENERATED: {
    label: 'Codi descompte generat',
    icon: 'ðŸŽ',
    bg: 'admin-tone-bg-success',
    text: 'admin-tone-text-success',
  },
  LEAD_EMAIL_SENT: {
    label: 'ConfirmaciÃ³ lead enviada',
    icon: 'âœ‰ï¸',
    bg: 'admin-tone-bg-violet',
    text: 'admin-tone-text-violet',
  },
};

export const PACK_SERVICE_OPTIONS = [
  { value: 'bodas', label: 'Bodes' },
  { value: 'fiestas', label: 'Festes' },
  { value: 'discomovil', label: 'DiscomÃ²bil' },
  { value: 'empresas', label: 'Empreses' },
] as const;

export const SUPPORTED_LOCALES = ['ca', 'es', 'en'] as const;
export const SUPPORTED_LOCALE_LABELS: Record<string, string> = { ca: 'CatalÃ ', es: 'CastellÃ ', en: 'AnglÃ¨s' };
export const OPEN_LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] as const;
export const LEAD_STATUS_VALUES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'] as const;
export const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const EVENT_TYPE_VALUES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'] as const;
export const LEAD_SOURCE_VALUES = ['WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'WALLAPOP', 'REFERRAL', 'REPEAT', 'OTHER'] as const;
export const OPEN_TASK_STATUSES = ['OPEN', 'IN_PROGRESS'] as const;
export const TASK_STATUS_VALUES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Oberta',
  IN_PROGRESS: 'En curs',
  DONE: 'Feta',
  CANCELLED: 'Cancel·lada',
};

export const CANVAS_COLOR_OPTIONS = ['#ffffff', '#06b6d4', '#f97316', '#eab308', '#22c55e', '#ec4899', '#a855f7', '#ef4444', '#000000', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)'] as const;

export const LEAD_DOCUMENT_UPLOAD_MAX_SIZE_BYTES = 8 * 1024 * 1024;
export const LEAD_DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;
export const LEAD_DOCUMENT_TYPE_VALUES = [
  'QUOTE',
  'CONTRACT',
  'INVOICE',
  'IMAGE',
  'FILE',
  'OTHER',
] as const;







