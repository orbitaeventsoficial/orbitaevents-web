// lib/constants/index.ts
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - CONSTANTES CENTRALIZADAS
// ═══════════════════════════════════════════════════════════════════════════

type StatusTone = {
  bg: string;
  text: string;
  border: string;
  label: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTACTO
// ═══════════════════════════════════════════════════════════════════════════

export const WHATSAPP_NUMBER = '34699121023';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_URL_WITH_MESSAGE = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// ═══════════════════════════════════════════════════════════════════════════
// LEAD STATUS (dark theme)
// ═══════════════════════════════════════════════════════════════════════════

export const LEAD_STATUS_CONFIG: Record<string, StatusTone> = {
  NEW: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Nova entrada' },
  CONTACTED: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Contactat' },
  QUOTE_SENT: { bg: 'admin-tone-bg-violet', text: 'admin-tone-text-violet', border: 'admin-tone-border-violet', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Negociació' },
  WON: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Guanyat!' },
  LOST: { bg: 'admin-tone-bg-slate', text: 'admin-tone-text-slate', border: 'admin-tone-border-slate', label: 'Perdut' },
};

// ═══════════════════════════════════════════════════════════════════════════
// BOOKING STATUS (dark theme)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOKING_STATUS_CONFIG: Record<string, StatusTone> = {
  PENDING: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Pendent' },
  CONFIRMED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Confirmada' },
  PREPARING: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Preparant' },
  COMPLETED: { bg: 'admin-tone-bg-teal', text: 'admin-tone-text-teal', border: 'admin-tone-border-teal', label: 'Completada' },
  CANCELLED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Cancel·lada' },
};

// ═══════════════════════════════════════════════════════════════════════════
// PROPOSAL STATUS (dark theme)
// ═══════════════════════════════════════════════════════════════════════════

export const PROPOSAL_STATUS_CONFIG: Record<string, StatusTone> = {
  DRAFT: { bg: 'admin-tone-bg-neutral', text: 'admin-tone-text-neutral', border: 'admin-tone-border-neutral', label: 'Esborrany' },
  SENT: { bg: 'admin-tone-bg-cyan', text: 'admin-tone-text-cyan', border: 'admin-tone-border-cyan', label: 'Enviat' },
  VIEWED: { bg: 'admin-tone-bg-violet', text: 'admin-tone-text-violet', border: 'admin-tone-border-violet', label: 'Vist' },
  ACCEPTED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Acceptat' },
  REJECTED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Rebutjat' },
  EXPIRED: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Caducat' },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT STATUS (dark theme)
// ═══════════════════════════════════════════════════════════════════════════

export const CONTRACT_STATUS_CONFIG: Record<string, StatusTone> = {
  DRAFT: { bg: 'admin-tone-bg-neutral', text: 'admin-tone-text-neutral', border: 'admin-tone-border-neutral', label: 'Esborrany' },
  SENT: { bg: 'admin-tone-bg-cyan', text: 'admin-tone-text-cyan', border: 'admin-tone-border-cyan', label: 'Enviat' },
  SIGNED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Signat' },
  CANCELLED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Cancel·lat' },
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Esborrany',
  PENDING_SYNC: 'Sincronitzant...',
  SYNCED: 'Sincronitzada',
  SYNC_ERROR: 'Error sync',
  PAID: 'Pagada',
  CANCELLED: 'Cancel·lada',
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Emoji + label (default display) */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Casament',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Celebració',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

/** Emoji only (for compact views like pipeline cards) */
export const EVENT_TYPE_ICONS: Record<string, string> = {
  WEDDING: '💍',
  BIRTHDAY: '🎂',
  CORPORATE: '🎯',
  COMMUNION: '⛪',
  BAPTISM: '👶',
  GRADUATION: '🎓',
  ANNIVERSARY: '🎉',
  PRIVATE_PARTY: '🎵',
  OTHER: '📋',
};

/** Plain text labels without emoji (for selects and forms) */
export const EVENT_TYPE_PLAIN: Record<string, string> = {
  WEDDING: 'Casament',
  BIRTHDAY: 'Aniversari',
  CORPORATE: 'Corporatiu',
  COMMUNION: 'Comunió',
  BAPTISM: 'Bateig',
  GRADUATION: 'Graduació',
  ANNIVERSARY: 'Celebració',
  PRIVATE_PARTY: 'Festa privada',
  OTHER: 'Altre',
};

export function getEventTypeDisplay(eventType: string) {
  return {
    label: EVENT_TYPE_PLAIN[eventType] || eventType,
    icon: EVENT_TYPE_ICONS[eventType] || '📅',
  };
};

export const EVENT_TYPE_DOCUMENT_LABELS: Record<string, string> = {
  WEDDING: 'Boda',
  BIRTHDAY: 'Aniversari / Cumpleaños',
  CORPORATE: 'Esdeveniment Corporatiu',
  COMMUNION: 'Comunió',
  BAPTISM: 'Bateig',
  GRADUATION: 'Graduació',
  ANNIVERSARY: 'Aniversari',
  PRIVATE_PARTY: 'Festa Privada',
  OTHER: 'Esdeveniment',
};

export const RECENT_FEED_EVENT_TYPE_SERVICE_LABELS: Record<string, string> = {
  WEDDING: 'DJ + Producció Boda',
  BIRTHDAY: 'Festa Aniversari',
  CORPORATE: 'Event Corporatiu',
  COMMUNION: 'Comunió',
  BAPTISM: 'Bateig',
  GRADUATION: 'Graduació',
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
  COMMUNION: ['Família García', 'Família López'],
  BAPTISM: ['Família Martí', 'Família Puig'],
  OTHER: ['Client VIP', 'Reserva especial'],
};

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY (dark theme)
// ═══════════════════════════════════════════════════════════════════════════

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
  NEGOTIATING: 'En negociació',
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

// ═══════════════════════════════════════════════════════════════════════════
// LOCALE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════

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

export const PROPOSAL_FILTERABLE_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_PLAIN).map(([value, label]) => ({
  value,
  label,
}));

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Boca-orella',
  GOOGLE: 'Google',
  OTHER: 'Altre',
};

export const SOURCE_ICONS: Record<string, string> = {
  WEBSITE: '🌐',
  CONFIGURATOR: '⚙️',
  PHONE: '📞',
  WHATSAPP: '💬',
  INSTAGRAM: '📸',
  WALLAPOP: '🟣',
  REFERRAL: '👥',
  GOOGLE: '🔍',
  OTHER: '📩',
};

export function getSourceDisplay(source: string) {
  return {
    label: SOURCE_LABELS[source] || 'Altre',
    icon: SOURCE_ICONS[source] || '📩',
  };
};

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const LEAD_STATUS_ACTION_OPTIONS = [
  { value: 'NEW', label: 'Nova entrada', tone: 'admin-tone-bg-info', icon: '🆕' },
  { value: 'CONTACTED', label: 'Contactat', tone: 'admin-tone-bg-warning', icon: '📞' },
  { value: 'QUOTE_SENT', label: 'Pressupost enviat', tone: 'admin-tone-bg-neutral', icon: '📄' },
  { value: 'NEGOTIATING', label: 'En negociació', tone: 'admin-tone-bg-warning', icon: '🤝' },
  { value: 'WON', label: 'Guanyat!', tone: 'admin-tone-bg-success', icon: '✅' },
  { value: 'LOST', label: 'Perdut', tone: 'admin-tone-bg-danger', icon: '❌' },
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
  MEDIUM: 'MITJÀ',
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
  { slug: 'produccion-tecnica', name: 'Producción técnica' },
  { slug: 'alquiler-equipo', name: 'Alquiler equipo' },
  { slug: 'fiestas-tematicas-halloween', name: 'Fiestas temáticas Halloween' },
  { slug: 'fiestas-tematicas-mon-magic', name: 'Fiestas temáticas Món Màgic' },
] as const;

export const INVENTORY_CATEGORY_LABELS: Record<string, string> = {
  SOUND: '🔊 So',
  LIGHTING: '💡 Il·lum.',
  EFFECTS: '✨ Efectes',
  STRUCTURE: '🏗️ Estruct.',
  CABLING: '🔌 Cable',
  TECH: '💻 Tech',
  DECORATION_HP: '🎃 Deco HP',
  DECORATION_HW: '🎄 Deco HW',
  DECORATION_GEN: '🎨 Deco Gen',
  CONSUMABLE: '📦 Consum.',
};

export const INVENTORY_CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Nou' },
  { value: 'EXCELLENT', label: 'Excel·lent' },
  { value: 'GOOD', label: 'Bo' },
  { value: 'FAIR', label: 'Acceptable' },
  { value: 'POOR', label: 'Dolent' },
] as const;

export const SETTINGS_SENSITIVE_KEY_FRAGMENTS = ['refreshToken', 'accessToken', 'secret', 'password', 'apiKey'] as const;

export const CUSTOMER_SOURCE_LABELS: Record<string, string> = {
  website: 'Web',
  configurator: 'Configurador',
  phone: 'Telèfon',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  wallapop: 'Wallapop',
  referral: 'Boca-orella',
  google: 'Google',
  other: 'Altre',
  manual: 'Manual',
  testimonial_form: 'Ressenya',
};

export const DISCOUNT_SOURCE_LABELS: Record<string, string> = {
  POST_EVENT: 'Post-event',
  TESTIMONIAL: 'Testimoni',
  REFERRAL: 'Recomanació',
  MANUAL: 'Manual',
};

export const INTAKE_SOURCE_OPTIONS = [
  { value: 'PHONE', label: 'Telèfon', icon: '📞' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
  { value: 'WALLAPOP', label: 'Wallapop', icon: '🟢' },
  { value: 'REFERRAL', label: 'Boca-orella', icon: '🗣️' },
  { value: 'GOOGLE', label: 'Google', icon: '🔍' },
  { value: 'WEBSITE', label: 'Web', icon: '🌐' },
  { value: 'OTHER', label: 'Altre', icon: '📋' },
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
  { value: 'WEDDING', label: 'Casament', icon: '💍' },
  { value: 'BIRTHDAY', label: 'Aniversari', icon: '🎂' },
  { value: 'CORPORATE', label: 'Corporatiu', icon: '🎯' },
  { value: 'COMMUNION', label: 'Comunió', icon: '⛪' },
  { value: 'BAPTISM', label: 'Bateig', icon: '👶' },
  { value: 'GRADUATION', label: 'Graduació', icon: '🎓' },
  { value: 'ANNIVERSARY', label: 'Celebració', icon: '🎉' },
  { value: 'PRIVATE_PARTY', label: 'Festa privada', icon: '🎵' },
  { value: 'OTHER', label: 'Altre', icon: '📋' },
] as const;

export const INTAKE_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa', selected: 'border-white/15 bg-white/5 text-white/80' },
  { value: 'MEDIUM', label: 'Mitjana', selected: 'border-sky-400/60 bg-sky-500/20 text-sky-100' },
  { value: 'HIGH', label: 'Alta', selected: 'border-orange-400/60 bg-orange-500/20 text-orange-100' },
  { value: 'URGENT', label: 'Urgent', selected: 'border-rose-400/70 bg-rose-500/25 text-rose-100' },
] as const;

export const INVENTORY_CATEGORY_OPTIONS = [
  { value: 'SOUND', label: 'So', icon: '🔊' },
  { value: 'LIGHTING', label: 'Il·luminació', icon: '💡' },
  { value: 'EFFECTS', label: 'Efectes', icon: '✨' },
  { value: 'STRUCTURE', label: 'Estructura', icon: '🏗️' },
  { value: 'CABLING', label: 'Cablejat', icon: '🔌' },
  { value: 'TECH', label: 'Tecnologia', icon: '💻' },
  { value: 'DECORATION_HP', label: 'Deco HP', icon: '🎃' },
  { value: 'DECORATION_HW', label: 'Deco HW', icon: '🎄' },
  { value: 'DECORATION_GEN', label: 'Deco General', icon: '🎨' },
  { value: 'CONSUMABLE', label: 'Consumibles', icon: '📦' },
] as const;

export const INVENTORY_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'IN_USE', label: 'En ús' },
  { value: 'MAINTENANCE', label: 'Manteniment' },
  { value: 'BROKEN', label: 'Avariat' },
  { value: 'RETIRED', label: 'Retirat' },
] as const;
export const BLOG_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'bodas', label: 'Bodes' },
  { value: 'eventos', label: 'Esdeveniments' },
  { value: 'consejos', label: 'Consells' },
  { value: 'tendencias', label: 'Tendències' },
  { value: 'tecnologia', label: 'Tecnologia' },
] as const;

export const FAQ_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'sound', label: 'So' },
  { value: 'lighting', label: 'Il·luminació' },
  { value: 'pricing', label: 'Preus' },
  { value: 'booking', label: 'Reserves' },
] as const;
export const ACTIVITY_CATEGORY_OPTIONS = [
  { id: 'all', label: 'Tot', icon: '📊' },
  { id: 'comms', label: 'Comunicacions', icon: '✉️' },
  { id: 'automation', label: 'Automatitzacions', icon: '⚡' },
  { id: 'system', label: 'Sistema', icon: '🔄' },
  { id: 'crud', label: 'Operacions', icon: '📝' },
] as const;

export const ACTIVITY_DAYS_OPTIONS = [
  { value: 1, label: 'Avui' },
  { value: 7, label: '7 dies' },
  { value: 30, label: '30 dies' },
  { value: 90, label: '90 dies' },
] as const;

export const PACK_SERVICE_OPTIONS = [
  { value: 'bodas', label: 'Bodes' },
  { value: 'fiestas', label: 'Festes' },
  { value: 'discomovil', label: 'Discomòbil' },
  { value: 'empresas', label: 'Empreses' },
] as const;

export const SUPPORTED_LOCALES = ['ca', 'es', 'en'] as const;
export const SUPPORTED_LOCALE_LABELS: Record<string, string> = { ca: 'Català', es: 'Castellà', en: 'Anglès' };
export const OPEN_LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] as const;
export const LEAD_STATUS_VALUES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'] as const;
export const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const EVENT_TYPE_VALUES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'] as const;
export const LEAD_SOURCE_VALUES = ['WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'WALLAPOP', 'REFERRAL', 'REPEAT', 'OTHER'] as const;
export const OPEN_TASK_STATUSES = ['OPEN', 'IN_PROGRESS'] as const;
export const TASK_STATUS_VALUES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;

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

