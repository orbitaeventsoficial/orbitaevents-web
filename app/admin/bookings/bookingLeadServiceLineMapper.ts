import type { BookingServiceLineFormInput, BookingServiceLineKind } from './booking-form.types';

type LeadServiceLineForBooking = {
  collaboratorId?: string | null;
  kind?: string | null;
  label?: string | null;
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
  notes?: string | null;
};

const VALID_KINDS: readonly BookingServiceLineKind[] = ['DJ', 'SOUND_TECH', 'PROVIDER_SERVICE', 'EQUIPMENT', 'OTHER'];

function normalizeKind(value?: string | null): BookingServiceLineKind {
  return value && (VALID_KINDS as readonly string[]).includes(value) ? (value as BookingServiceLineKind) : 'OTHER';
}

function normalizeMoney(value?: number | null): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeQuantity(value?: number | null): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
}

export function mapLeadServiceLinesToBookingFormLines(
  lines: LeadServiceLineForBooking[] | null | undefined,
): BookingServiceLineFormInput[] {
  return (Array.isArray(lines) ? lines : [])
    .map((line): BookingServiceLineFormInput | null => {
      const label = line.label?.trim();
      if (!label) return null;
      return {
        collaboratorId: line.collaboratorId?.trim() || undefined,
        kind: normalizeKind(line.kind),
        label,
        revenueAmount: normalizeMoney(line.revenueAmount),
        costAmount: normalizeMoney(line.costAmount),
        quantity: normalizeQuantity(line.quantity),
        notes: line.notes?.trim() || undefined,
      };
    })
    .filter((line): line is BookingServiceLineFormInput => Boolean(line));
}
