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
// LEAD STATUS
// ═══════════════════════════════════════════════════════════════════════════

export const LEAD_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  NEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nou Lead' },
  CONTACTED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Contactat' },
  QUOTE_SENT: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Negociació' },
  WON: { bg: 'bg-green-100', text: 'text-green-700', label: 'Guanyat!' },
  LOST: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Perdut' },
};

// ═══════════════════════════════════════════════════════════════════════════
// BOOKING STATUS
// ═══════════════════════════════════════════════════════════════════════════

export const BOOKING_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendent' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmat' },
  DEPOSIT_PAID: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Dipòsit pagat' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completat' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancel·lat' },
};

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍 Boda',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Aniversari',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY
// ═══════════════════════════════════════════════════════════════════════════

export const PRIORITY_CONFIG: Record<string, { bg: string; label: string }> = {
  LOW: { bg: 'bg-stone-100 text-slate-600', label: 'Baixa' },
  MEDIUM: { bg: 'bg-blue-100 text-blue-700', label: 'Mitja' },
  HIGH: { bg: 'bg-orange-100 text-orange-700', label: 'Alta' },
  URGENT: { bg: 'bg-red-100 text-red-700', label: 'Urgent' },
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
