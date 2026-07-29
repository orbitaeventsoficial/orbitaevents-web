import { DeliveryNoteStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { TRAVEL_COST_LINE_MARKER } from '@/lib/services/travelLaborCost';
import { uploadFile } from '@/lib/storage';
import { DOCUMENT_ADMIN_LOG_ACTIONS, recordDocumentAdminLog } from '@/lib/services/documentAuditTrailService';
import { generateDeliveryNotePdfBuffer } from '@/lib/services/deliveryNotePdfService';

const DEFAULT_DELIVERY_NOTES_PAGE = 1;
const DEFAULT_DELIVERY_NOTES_LIMIT = 50;
const MAX_DELIVERY_NOTES_LIMIT = 200;
const DELIVERY_NOTE_REFERENCE_PREFIX = 'ALB';

type DeliveryNoteStatusPatch = Extract<DeliveryNoteStatus, 'DELIVERED' | 'SIGNED' | 'CANCELLED'>;

type DeliveryNoteLine = {
  label: string;
  quantity?: number | null;
  notes?: string | null;
  revenueAmount?: number | null;
};

type DeliveryNoteBookingSnapshotInput = {
  reference: string;
  clientName: string;
  eventDate: Date;
  eventLocation: string;
  eventVenue?: string | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  guestCount?: number | null;
  pack?: {
    slug?: string | null;
    service?: string | null;
    translations?: Array<{ locale: string; name: string }>;
  } | null;
  extras?: Array<{
    quantity?: number | null;
    price?: number | null;
    extra?: {
      slug?: string | null;
      translations?: Array<{ locale: string; name: string }>;
    } | null;
  }>;
  serviceLines?: DeliveryNoteLine[];
};

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

async function generateDeliveryNoteReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${DELIVERY_NOTE_REFERENCE_PREFIX}-${year}-`;
  const last = await prisma.deliveryNote.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });

  const current = last?.reference.split('-').pop();
  const next = Number.isFinite(Number(current)) ? Number(current) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

function normalizeSnapshot(snapshot: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue;
}

function translatedName(
  translations: Array<{ locale: string; name: string }> | undefined,
  fallback: string,
) {
  return translations?.find((translation) => translation.locale === 'ca')?.name
    || translations?.[0]?.name
    || fallback;
}

function isVisibleDeliveryLine(line: DeliveryNoteLine) {
  if (!line.label.trim()) return false;
  if (line.notes?.includes(TRAVEL_COST_LINE_MARKER)) return false;
  return true;
}

function getDeliveryNoteStatusAction(status: DeliveryNoteStatusPatch) {
  if (status === DeliveryNoteStatus.DELIVERED) return DOCUMENT_ADMIN_LOG_ACTIONS.DELIVERY_NOTE_DELIVERED;
  if (status === DeliveryNoteStatus.SIGNED) return DOCUMENT_ADMIN_LOG_ACTIONS.DELIVERY_NOTE_SIGNED;
  return DOCUMENT_ADMIN_LOG_ACTIONS.DELIVERY_NOTE_CANCELLED;
}

export function buildDeliveryNoteSnapshot(booking: DeliveryNoteBookingSnapshotInput): Record<string, unknown> {
  const packName = booking.pack
    ? translatedName(booking.pack.translations, booking.pack.service || booking.pack.slug || 'Pack')
    : null;

  const items = [
    ...(packName ? [{ type: 'PACK', label: packName, quantity: 1 }] : []),
    ...(booking.extras || []).map((extra) => ({
      type: 'EXTRA',
      label: translatedName(extra.extra?.translations, extra.extra?.slug || 'Extra'),
      quantity: extra.quantity || 1,
    })),
    ...(booking.serviceLines || [])
      .filter(isVisibleDeliveryLine)
      .map((line) => ({
        type: 'SERVICE_LINE',
        label: line.label,
        quantity: line.quantity || 1,
      })),
  ];

  return {
    source: 'booking',
    bookingReference: booking.reference,
    client: {
      name: booking.clientName,
    },
    event: {
      date: booking.eventDate.toISOString(),
      location: booking.eventLocation,
      venue: booking.eventVenue || null,
      startTime: booking.eventStartTime || null,
      endTime: booking.eventEndTime || null,
      guestCount: booking.guestCount || null,
    },
    items,
  };
}

export async function listAdminDeliveryNotes(input?: {
  bookingId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}) {
  const page = normalizePositiveInteger(input?.page, DEFAULT_DELIVERY_NOTES_PAGE);
  const limit = Math.min(MAX_DELIVERY_NOTES_LIMIT, normalizePositiveInteger(input?.limit, DEFAULT_DELIVERY_NOTES_LIMIT));
  const where = {
    ...(input?.bookingId ? { bookingId: input.bookingId } : {}),
    ...(input?.customerId ? { customerId: input.customerId } : {}),
  };

  const [deliveryNotes, total] = await Promise.all([
    prisma.deliveryNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        booking: { select: { id: true, reference: true, status: true, eventDate: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.deliveryNote.count({ where }),
  ]);

  return {
    ok: true,
    deliveryNotes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function createAdminDeliveryNoteFromBooking(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      customer: true,
      pack: { include: { translations: true } },
      extras: { include: { extra: { include: { translations: true } } } },
      serviceLines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  const existing = await prisma.deliveryNote.findFirst({
    where: { bookingId, status: { not: DeliveryNoteStatus.CANCELLED } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    return { ok: true, deliveryNoteId: existing.id, reference: existing.reference, reused: true };
  }

  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      const reference = await generateDeliveryNoteReference();
      const deliveryNote = await prisma.deliveryNote.create({
        data: {
          reference,
          bookingId,
          customerId: booking.customerId,
          clientName: booking.clientName,
          eventDate: booking.eventDate,
          eventLocation: booking.eventLocation,
          snapshot: normalizeSnapshot(buildDeliveryNoteSnapshot(booking)),
          status: DeliveryNoteStatus.DRAFT,
        },
      });

      await recordDocumentAdminLog({
        action: DOCUMENT_ADMIN_LOG_ACTIONS.DELIVERY_NOTE_CREATED,
        entity: 'deliveryNote',
        entityId: deliveryNote.id,
        details: {
          documentType: 'DELIVERY_NOTE',
          source: 'admin_delivery_note_create',
          reference,
          bookingId,
          bookingReference: booking.reference,
          customerId: booking.customerId,
        },
      });

      log.info(`Albarà creat: ${reference} per reserva ${booking.reference}`);
      return { ok: true, deliveryNoteId: deliveryNote.id, reference, reused: false };
    } catch (error: unknown) {
      const isUniqueError = error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002';
      if (isUniqueError && attempts < maxAttempts - 1) {
        attempts++;
        continue;
      }
      throw error;
    }
  }

  throw new Error('No s’ha pogut generar una referència d’albarà única');
}

export async function getAdminDeliveryNoteById(id: string) {
  const deliveryNote = await prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      booking: { select: { id: true, reference: true, status: true, eventDate: true, clientName: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!deliveryNote) {
    return { status: 404, body: { ok: false, error: 'Albarà no trobat' } };
  }

  return { status: 200, body: { ok: true, deliveryNote } };
}

export async function updateAdminDeliveryNoteStatus(
  id: string,
  status?: DeliveryNoteStatusPatch,
  signature?: { signedBy?: string | null; signatureIp?: string | null; signatureUa?: string | null },
) {
  if (!status) return { status: 200, body: { ok: true } };

  const existing = await prisma.deliveryNote.findUnique({
    where: { id },
    select: { status: true, reference: true, bookingId: true, customerId: true, clientName: true, deliveredAt: true, signedAt: true },
  });
  if (!existing) return { status: 404, body: { ok: false, error: 'Albarà no trobat' } };

  if (existing.status === DeliveryNoteStatus.CANCELLED) {
    return { status: 400, body: { ok: false, error: 'No es pot modificar un albarà cancel·lat' } };
  }
  if (status === DeliveryNoteStatus.CANCELLED && existing.status === DeliveryNoteStatus.SIGNED) {
    return { status: 400, body: { ok: false, error: 'No es pot cancel·lar un albarà ja signat' } };
  }

  const now = new Date();
  const data: Prisma.DeliveryNoteUpdateInput = { status };

  if (status === DeliveryNoteStatus.DELIVERED) {
    data.deliveredAt = existing.deliveredAt || now;
  }

  if (status === DeliveryNoteStatus.SIGNED) {
    data.deliveredAt = existing.deliveredAt || now;
    data.signedAt = existing.signedAt || now;
    data.signedBy = signature?.signedBy?.trim() || existing.clientName;
    data.signatureIp = signature?.signatureIp || null;
    data.signatureUa = signature?.signatureUa || null;
  }

  const deliveryNote = await prisma.deliveryNote.update({
    where: { id },
    data,
  });

  await recordDocumentAdminLog({
    action: getDeliveryNoteStatusAction(status),
    entity: 'deliveryNote',
    entityId: id,
    details: {
      documentType: 'DELIVERY_NOTE',
      source: 'admin_delivery_note_status',
      reference: existing.reference,
      bookingId: existing.bookingId,
      customerId: existing.customerId,
      previousStatus: existing.status,
      status,
      signedBy: status === DeliveryNoteStatus.SIGNED ? data.signedBy ?? null : null,
      signatureIp: status === DeliveryNoteStatus.SIGNED ? signature?.signatureIp ?? null : null,
    },
  });

  const pdfResult = status === DeliveryNoteStatus.DELIVERED || status === DeliveryNoteStatus.SIGNED
    ? await generateAdminDeliveryNotePdf(id, { force: true, source: 'admin_delivery_note_status_pdf' })
    : null;

  return { status: 200, body: { ok: true, deliveryNote, pdf: pdfResult?.body ?? null } };
}

export async function generateAdminDeliveryNotePdf(
  id: string,
  input: { force?: boolean; source?: string } = {},
) {
  const deliveryNote = await prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      booking: { select: { id: true, reference: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!deliveryNote) {
    return { status: 404, body: { ok: false, error: 'Albarà no trobat' } };
  }

  if (deliveryNote.status === DeliveryNoteStatus.CANCELLED) {
    return { status: 400, body: { ok: false, error: 'No es pot generar PDF d’un albarà cancel·lat' } };
  }

  if (!input.force && deliveryNote.pdfUrl && deliveryNote.pdfKey) {
    return {
      status: 200,
      body: {
        ok: true,
        reference: deliveryNote.reference,
        pdfUrl: deliveryNote.pdfUrl,
        pdfKey: deliveryNote.pdfKey,
        reused: true,
      },
    };
  }

  const pdfBuffer = await generateDeliveryNotePdfBuffer({
    reference: deliveryNote.reference,
    status: deliveryNote.status,
    createdAt: deliveryNote.createdAt,
    deliveredAt: deliveryNote.deliveredAt,
    signedAt: deliveryNote.signedAt,
    signedBy: deliveryNote.signedBy,
    snapshot: deliveryNote.snapshot,
  });
  const safeReference = deliveryNote.reference.replace(/[^A-Za-z0-9_-]/g, '-');
  const uploaded = await uploadFile(`delivery-notes/${id}/${safeReference}.pdf`, pdfBuffer);
  const updated = await prisma.deliveryNote.update({
    where: { id },
    data: {
      pdfUrl: uploaded.publicUrl,
      pdfKey: uploaded.path,
    },
  });

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.DELIVERY_NOTE_PDF_GENERATED,
    entity: 'deliveryNote',
    entityId: id,
      details: {
        documentType: 'DELIVERY_NOTE',
      source: input.source ?? 'admin_delivery_note_pdf',
      reference: deliveryNote.reference,
      bookingId: deliveryNote.bookingId,
      bookingReference: deliveryNote.booking.reference,
      customerId: deliveryNote.customerId,
      pdfUrl: uploaded.publicUrl,
      pdfKey: uploaded.path,
    },
  });

  log.info(`PDF albarà generat: ${deliveryNote.reference} per reserva ${deliveryNote.booking.reference}`);
  return {
    status: 200,
    body: {
      ok: true,
      reference: updated.reference,
      pdfUrl: updated.pdfUrl,
      pdfKey: updated.pdfKey,
      reused: false,
    },
  };
}
