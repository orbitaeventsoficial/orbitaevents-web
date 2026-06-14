import { prisma } from '@/lib/prisma';
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
      revenueAmount: l.revenueAmount != null ? Number(l.revenueAmount) : null,
      costAmount: l.costAmount != null ? Number(l.costAmount) : null,
      quantity: l.quantity != null ? Number(l.quantity) : 1,
      hours: l.hours != null ? Number(l.hours) : null,
      notes: l.notes?.trim() || null,
      partyType: l.partyType?.trim() || null,
      sortOrder: idx,
    }));

  if (lead.booking) {
    await prisma.$transaction([
      prisma.bookingServiceLine.deleteMany({ where: { bookingId: lead.booking.id } }),
      ...(clean.length > 0
        ? [prisma.bookingServiceLine.createMany({
            data: clean.map(({ leadId: _leadId, ...line }) => ({
              ...line,
              bookingId: lead.booking!.id,
            })),
          })]
        : []),
    ]);

    return { status: 200, body: { ok: true, count: clean.length, bookingId: lead.booking.id } };
  }

  await prisma.$transaction([
    prisma.leadServiceLine.deleteMany({ where: { leadId } }),
    ...(clean.length > 0 ? [prisma.leadServiceLine.createMany({ data: clean })] : []),
  ]);

  return { status: 200, body: { ok: true, count: clean.length } };
}
