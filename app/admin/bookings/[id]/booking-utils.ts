/**
 * Tipus i helpers purs per a la fitxa de reserva.
 * Extret de bookings/[id]/page.tsx per reduir la mida del component.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BookingExtraRow = {
  id: string;
  price: number;
  quantity: number | null;
  extra: {
    slug: string;
    translations: Array<{ locale: string; name: string; tagline?: string | null }>;
  };
};

export type BookingProposalRow = {
  id: string;
  reference: string;
  status: string;
  pdfUrl: string | null;
  contractStatus: string | null;
  contractReference: string | null;
  contractPdfUrl: string | null;
  contractSignedAt: Date | null;
  contractSignedBy: string | null;
  contractSignatureIp: string | null;
  contractSignatureUa: string | null;
  contractSignatureBlob: string | null;
};

export type BookingInvoiceRow = {
  id: string;
  reference: string;
  status: string;
  total: number;
  holdedInvoiceUrl: string | null;
  holdedSyncError: string | null;
  createdAt: Date;
};

export type BookingNumericCompat = {
  extraHours?: number;
  distanceKm?: number | null;
  vehicleCostPerKm?: number | null;
  fuelCostPerKm?: number | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function toGoogleCalendarUtc(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

export function combineDateAndTime(baseDate: Date, time: string | null): Date | null {
  if (!time) return null;
  const [hRaw, mRaw] = time.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const dt = new Date(baseDate);
  dt.setHours(h, m, 0, 0);
  return dt;
}

export function buildGoogleCalendarUrl(booking: {
  reference: string;
  clientName: string;
  eventDate: Date;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string;
  eventVenue: string | null;
  notes: string | null;
}) {
  const title = `Òrbita · ${booking.reference} · ${booking.clientName}`;
  const start = combineDateAndTime(booking.eventDate, booking.eventStartTime);
  const end = combineDateAndTime(booking.eventDate, booking.eventEndTime);
  const location = [booking.eventVenue, booking.eventLocation].filter(Boolean).join(' · ');
  const details = [
    `Client: ${booking.clientName}`,
    `Referència: ${booking.reference}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', title);
  if (start && end && end.getTime() > start.getTime()) {
    params.set('dates', `${toGoogleCalendarUtc(start)}/${toGoogleCalendarUtc(end)}`);
    params.set('ctz', 'Europe/Madrid');
  } else {
    const dayStart = new Date(booking.eventDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const yyyymmdd = `${dayStart.getFullYear()}${String(dayStart.getMonth() + 1).padStart(2, '0')}${String(dayStart.getDate()).padStart(2, '0')}`;
    const yyyymmddEnd = `${dayEnd.getFullYear()}${String(dayEnd.getMonth() + 1).padStart(2, '0')}${String(dayEnd.getDate()).padStart(2, '0')}`;
    params.set('dates', `${yyyymmdd}/${yyyymmddEnd}`);
  }
  if (location) params.set('location', location);
  if (details) params.set('details', details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function parseLogDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== 'object') return {};
  return details as Record<string, unknown>;
}

export function getPackTranslation(
  translations: Array<{ locale: string; name: string; tagline?: string | null }>,
  locale?: string | null
) {
  const preferred = String(locale || 'ca').toLowerCase();
  return (
    translations.find((t) => t.locale === preferred) ||
    translations.find((t) => t.locale === 'ca') ||
    translations[0]
  );
}
