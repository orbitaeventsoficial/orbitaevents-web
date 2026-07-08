import { prisma } from '@/lib/prisma';
import { updateBookingDetail } from '@/lib/services/bookingRouteService';
import { TRAVEL_COST_LINE_MARKER } from '@/lib/services/travelLaborCost';
import { sanitizeRevenueAmount, sanitizeServiceLineCostAmount } from '@/lib/services/serviceLineCostRules';
import { SOUND_RENTAL } from '@/lib/constants/inventory';
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

function sanitizeQuantity(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function sanitizeHours(value?: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
}

function isTravelCostLine(line: { notes?: string | null }): boolean {
  return Boolean(line.notes?.includes(TRAVEL_COST_LINE_MARKER));
}

function isIncludedSoundRentalLine(line: { collaboratorId?: string | null; notes?: string | null; label?: string | null }): boolean {
  const normalizedLabel = line.label?.toLowerCase() || '';
  return Boolean(
    line.notes?.includes(SOUND_RENTAL.notesMarker) ||
    (line.collaboratorId === SOUND_RENTAL.collaboratorId && /so|altaveu|speaker/.test(normalizedLabel)),
  );
}

/**
 * Cost intern de les línies [travel-cost] (temps de ruta de conductor/passatgers).
 * S'amaguen de la llista de productes però el cost s'ha de REIMPUTAR al marge
 * (si no, el marge menteix: veure docs/disseny-cost-desplacament.md).
 */
function sumTravelCostLines(
  lines: Array<{ notes?: string | null; costAmount?: number | null; quantity?: number | null }>,
): number {
  return lines
    .filter(isTravelCostLine)
    .reduce((sum, l) => sum + Number(l.costAmount || 0) * (l.quantity || 1), 0);
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
  if (lead?.booking) {
    const lines = lead.booking.serviceLines;
    return {
      status: 200,
      body: {
        lines: lines.filter((line) => !isTravelCostLine(line) && !isIncludedSoundRentalLine(line)),
        routeCostLines: lines.filter(isTravelCostLine),
        internalTravelCost: sumTravelCostLines(lines),
      },
    };
  }

  const lines = await prisma.leadServiceLine.findMany({
    where: { leadId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  return {
    status: 200,
    body: {
      lines: lines.filter((line) => !isTravelCostLine(line) && !isIncludedSoundRentalLine(line)),
      routeCostLines: lines.filter(isTravelCostLine),
      // Lead pur (sense reserva): el cost de ruta viu a les línies [travel-cost],
      // amagades de productes però reimputades al marge via aquest total.
      internalTravelCost: sumTravelCostLines(lines),
    },
  };
}

/**
 * Replace-all de les línies del bolo (mateix patró que el booking editor).
 * Esborra les actuals i crea les noves dins una transacció.
 */
export async function replaceLeadServiceLines(
  leadId: string,
  inputLines: LeadServiceLineInput[],
  distanceKm?: number | null,
  tollsEur?: number | null,
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, booking: { select: { id: true } } },
  });
  if (!lead) return { status: 404, body: { error: 'Lead no trobat' } };

  // Km de ruta (mirall de Booking.distanceKm) per al càlcul de transport en viu (#1345).
  if (distanceKm !== undefined) {
    const km = typeof distanceKm === 'number' && Number.isFinite(distanceKm) && distanceKm > 0
      ? Math.round(distanceKm * 10) / 10
      : null;
    await prisma.lead.update({ where: { id: leadId }, data: { distanceKm: km } });
  }
  // Peatges de la ruta (#1364): cost real que no deriva dels km.
  if (tollsEur !== undefined) {
    const tolls = typeof tollsEur === 'number' && Number.isFinite(tollsEur) && tollsEur > 0
      ? Math.round(tollsEur * 100) / 100
      : null;
    await prisma.lead.update({ where: { id: leadId }, data: { tollsEur: tolls } });
  }

  const clean = (Array.isArray(inputLines) ? inputLines : [])
    .filter((l) => (l.label?.trim() || '') !== '' || (l.revenueAmount ?? 0) > 0)
    .map((l, idx) => {
      const kind = normalizeKind(l.kind);
      return ({
      leadId,
      collaboratorId: l.collaboratorId?.trim() || null,
      kind,
      label: l.label?.trim() || '',
      revenueAmount: sanitizeRevenueAmount(l.revenueAmount),
      costAmount: sanitizeServiceLineCostAmount({ kind, label: l.label, costAmount: l.costAmount }),
      quantity: sanitizeQuantity(l.quantity),
      hours: sanitizeHours(l.hours),
      notes: l.notes?.trim() || null,
      partyType: l.partyType?.trim() || null,
      sortOrder: idx,
    });
    });

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
