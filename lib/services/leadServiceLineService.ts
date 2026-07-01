import { prisma } from '@/lib/prisma';
import { updateBookingDetail } from '@/lib/services/bookingRouteService';
import type { BookingServiceLineKind } from '@prisma/client';

const VALID_KINDS: readonly BookingServiceLineKind[] = ['DJ', 'SOUND_TECH', 'PROVIDER_SERVICE', 'EQUIPMENT', 'OTHER'];

export type LeadServiceLineInput = {
  collaboratorId?: string | null;
  kind?: string | null;
  label?: string | null;
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
  hours?: number | null;
  notes?: string | null;
  partyType?: string | null;
};

function normalizeKind(value?: string | null): BookingServiceLineKind {
  return value && (VALID_KINDS as readonly string[]).includes(value) ? (value as BookingServiceLineKind) : 'OTHER';
}

function sanitizeMoney(value?: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value * 100) / 100);
}

function sanitizeQuantity(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function sanitizeHours(value?: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

/** Línies del bolo d'un lead, ordenades. */
export async function listLeadServiceLines(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      booking: {
        select: {
          serviceLines: {
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
  });
  if (lead?.booking) return { status: 200, body: { lines: lead.booking.serviceLines } };

  const lines = await prisma.leadServiceLine.findMany({
    where: { leadId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return { status: 200, body: { lines } };
}

/**
 * Replace-all de les línies del bolo (mateix patró que el booking editor).
 * Esborra les actuals i crea les noves dins una transacció.
 */
export async function replaceLeadServiceLines(leadId: string, inputLines: LeadServiceLineInput[]) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, booking: { select: { id: true } } },
  });
  if (!lead) return { status: 404, body: { error: 'Lead no trobat' } };

  const clean = (Array.isArray(inputLines) ? inputLines : [])
    .filter((l) => (l.label?.trim() || '') !== '' || (l.revenueAmount ?? 0) > 0)
    .map((l, idx) => ({
      leadId,
      collaboratorId: l.collaboratorId?.trim() || null,
      kind: normalizeKind(l.kind),
      label: l.label?.trim() || '',
      revenueAmount: sanitizeMoney(l.revenueAmount),
      costAmount: sanitizeMoney(l.costAmount),
      quantity: sanitizeQuantity(l.quantity),
      hours: sanitizeHours(l.hours),
      notes: l.notes?.trim() || null,
      partyType: l.partyType?.trim() || null,
      sortOrder: idx,
    }));

  if (lead.booking) {
    const bookingLines = clean.map(({ leadId: _leadId, ...line }) => line);
    const result = await updateBookingDetail(lead.booking.id, { serviceLines: bookingLines });
    if (result.status !== 200) return result;

    return { status: 200, body: { ok: true, count: clean.length, bookingId: lead.booking.id } };
  }

  await prisma.$transaction([
    prisma.leadServiceLine.deleteMany({ where: { leadId } }),
    ...(clean.length > 0 ? [prisma.leadServiceLine.createMany({ data: clean })] : []),
  ]);

  return { status: 200, body: { ok: true, count: clean.length } };
}
