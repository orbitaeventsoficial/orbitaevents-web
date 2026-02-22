// lib/constants/index.ts
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - CONSTANTES CENTRALIZADAS
// ═══════════════════════════════════════════════════════════════════════════

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

export const LEAD_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Nova entrada' },
  CONTACTED: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Negociació' },
  WON: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Guanyat!' },
  LOST: { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Perdut' },
};

// ═══════════════════════════════════════════════════════════════════════════
// BOOKING STATUS (dark theme)
// ═══════════════════════════════════════════════════════════════════════════

export const BOOKING_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Pendent' },
  CONFIRMED: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Confirmada' },
  PREPARING: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Preparant' },
  COMPLETED: { bg: 'bg-teal-500/20', text: 'text-teal-300', label: 'Completada' },
  CANCELLED: { bg: 'bg-rose-500/20', text: 'text-rose-300', label: 'Cancel·lada' },
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

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE LABELS
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY (dark theme)
// ═══════════════════════════════════════════════════════════════════════════

export const PRIORITY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Baixa' },
  MEDIUM: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Mitjana' },
  HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Alta' },
  URGENT: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Urgent' },
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

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('ca-ES', {
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
