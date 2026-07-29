/**
 * Invoice Service — Gestió de factures locals + sincronització Holded
 *
 * Font de veritat: model Invoice a la BD local.
 * Holded és opcional (HOLDED_ENABLED=false per defecte).
 */

import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { EVENT_TYPE_DOCUMENT_LABELS } from '@/lib/constants';
import { uploadFile } from '@/lib/storage';
import { getCompanyConfig } from '@/lib/services/contractService';
import { generateInvoicePDF, type InvoiceLineItem } from '@/lib/services/invoicePdfService';
import { TRAVEL_COST_LINE_MARKER } from '@/lib/services/travelLaborCost';
import { DOCUMENT_ADMIN_LOG_ACTIONS, recordDocumentAdminLog } from '@/lib/services/documentAuditTrailService';
import {
  isHoldedEnabled,
  findOrCreateHoldedContact,
  createHoldedInvoice,
  getHoldedInvoiceStatus,
} from './holdedService';
import type { Prisma } from '@prisma/client';

type InvoiceBookingForPdf = Prisma.BookingGetPayload<{
  include: {
    pack: { include: { translations: true } };
    extras: { include: { extra: { include: { translations: true } } } };
    serviceLines: true;
  };
}>;

type InvoiceSourceForPdf = {
  id?: string;
  reference: string;
  clientName: string;
  clientNIF: string | null;
  clientAddress: string | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  createdAt: Date;
  booking: InvoiceBookingForPdf;
  customer: { email?: string | null; phone?: string | null } | null;
};

// ============================================
// REFERENCE GENERATION (amb retry per race condition)
// ============================================

async function generateInvoiceReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const last = await prisma.invoice.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });

  let nextNum = 1;
  if (last) {
    const lastNum = parseInt(last.reference.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

function normalizeInvoiceLocale(value: string): 'ca' | 'es' | 'en' {
  return value === 'ca' || value === 'en' ? value : 'es';
}

function safeInvoiceFileSegment(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, '-');
}

function translatedName(
  translations: Array<{ locale: string; name: string }> | undefined,
  fallback: string,
) {
  return translations?.find((translation) => translation.locale === 'ca')?.name
    || translations?.[0]?.name
    || fallback;
}

function buildInvoiceLinesFromBooking(booking: InvoiceBookingForPdf, fallbackSubtotal: number): InvoiceLineItem[] {
  const serviceLines = booking.serviceLines
    .filter((line) => line.label.trim())
    .filter((line) => !line.notes?.includes(TRAVEL_COST_LINE_MARKER))
    .filter((line) => typeof line.revenueAmount === 'number' && line.revenueAmount !== 0)
    .map((line) => {
      const quantity = Math.max(1, line.quantity ?? 1);
      const total = line.revenueAmount ?? 0;
      return {
        description: line.label,
        quantity,
        unitPrice: total / quantity,
        total,
      };
    });

  if (serviceLines.length > 0) return serviceLines;

  const packName = translatedName(
    booking.pack.translations,
    booking.pack.slug || 'Servei',
  );
  const packTotal = booking.pack.price || fallbackSubtotal;
  const lines: InvoiceLineItem[] = [{
    description: packName,
    quantity: 1,
    unitPrice: packTotal,
    total: packTotal,
  }];

  for (const bookingExtra of booking.extras) {
    const quantity = Math.max(1, bookingExtra.quantity ?? 1);
    const total = bookingExtra.price;
    lines.push({
      description: translatedName(bookingExtra.extra.translations, bookingExtra.extra.slug || 'Extra'),
      quantity,
      unitPrice: total / quantity,
      total,
    });
  }

  return lines;
}

async function renderInvoicePdfBuffer(source: InvoiceSourceForPdf): Promise<Buffer> {
  const company = await getCompanyConfig();
  const locale = normalizeInvoiceLocale(source.booking.preferredLocale);
  const doc = await generateInvoicePDF({
    invoiceNumber: source.reference,
    issueDate: source.createdAt,
    companyName: company.name,
    companyNIF: company.nif,
    companyAddress: company.address,
    companyEmail: company.email,
    companyPhone: company.phone,
    companyIBAN: company.iban,
    clientName: source.clientName,
    clientNIF: source.clientNIF || undefined,
    clientAddress: source.clientAddress || undefined,
    clientEmail: source.customer?.email || source.booking.clientEmail,
    clientPhone: source.customer?.phone || source.booking.clientPhone,
    eventType: EVENT_TYPE_DOCUMENT_LABELS[String(source.booking.eventType)] || String(source.booking.eventType),
    eventDate: source.booking.eventDate,
    eventLocation: source.booking.eventVenue
      ? `${source.booking.eventVenue} · ${source.booking.eventLocation}`
      : source.booking.eventLocation,
    lines: buildInvoiceLinesFromBooking(source.booking, source.subtotal),
    subtotal: source.subtotal,
    vatRate: source.vatRate,
    vatAmount: source.vatAmount,
    total: source.total,
    depositAmount: source.booking.depositAmount,
    depositPaid: source.booking.depositPaid,
    depositPaidAt: source.booking.depositPaidAt,
    remainingAmount: source.booking.remainingAmount,
    remainingPaid: source.booking.remainingPaid,
    remainingPaidAt: source.booking.remainingPaidAt,
    cashAmount: source.booking.cashAmount,
    notes: `Reserva ${source.booking.reference}`,
  }, locale);

  return Buffer.from(doc.output('arraybuffer'));
}

async function uploadInvoicePdf(source: InvoiceSourceForPdf) {
  const pdfBuffer = await renderInvoicePdfBuffer(source);
  const safeReference = safeInvoiceFileSegment(source.reference);
  return uploadFile(`invoices/${source.booking.id}/${safeReference}.pdf`, pdfBuffer);
}

async function ensureInvoicePdf(invoiceId: string) {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      customer: true,
      booking: {
        include: {
          customer: true,
          pack: { include: { translations: true } },
          extras: { include: { extra: { include: { translations: true } } } },
          serviceLines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      },
    },
  });

  if (invoice.pdfUrl && invoice.pdfKey) return invoice;

  const uploaded = await uploadInvoicePdf(invoice);
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      pdfUrl: uploaded.publicUrl,
      pdfKey: uploaded.path,
    },
  });

  await recordDocumentAdminLog({
    action: DOCUMENT_ADMIN_LOG_ACTIONS.INVOICE_PDF_GENERATED,
    entity: 'invoice',
    entityId: invoice.id,
    details: {
      documentType: 'INVOICE',
      source: 'invoice_service_pdf_repair',
      reference: invoice.reference,
      bookingId: invoice.bookingId,
      bookingReference: invoice.booking.reference,
      customerId: invoice.customerId,
      pdfUrl: uploaded.publicUrl,
      pdfKey: uploaded.path,
    },
  });

  return updated;
}

// ============================================
// CREATE INVOICE FROM BOOKING
// ============================================

export async function createInvoiceFromBooking(bookingId: string): Promise<{
  invoiceId: string;
  reference: string;
}> {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: {
      customer: true,
      pack: { include: { translations: true } },
      extras: { include: { extra: { include: { translations: true } } } },
      serviceLines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  if (!booking.customerId) {
    throw new Error('La reserva no té client associat');
  }

  // Check if invoice already exists
  const existing = await prisma.invoice.findFirst({
    where: { bookingId, status: { not: 'CANCELLED' } },
  });
  if (existing) {
    if (!existing.pdfUrl || !existing.pdfKey) {
      await ensureInvoicePdf(existing.id);
    }
    return { invoiceId: existing.id, reference: existing.reference };
  }

  // Retry loop per si hi ha conflicte de referència (race condition)
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (attempts < MAX_ATTEMPTS) {
    try {
      const reference = await generateInvoiceReference();
      const createdAt = new Date();
      const uploadedPdf = await uploadInvoicePdf({
        reference,
        clientName: booking.clientName,
        clientNIF: booking.customer?.dni || null,
        clientAddress: null,
        subtotal: booking.subtotal,
        vatRate: booking.vatRate,
        vatAmount: booking.vatAmount,
        total: booking.total,
        createdAt,
        booking,
        customer: booking.customer,
      });

      const invoice = await prisma.invoice.create({
        data: {
          reference,
          bookingId,
          customerId: booking.customerId,
          clientName: booking.clientName,
          clientNIF: booking.customer?.dni || null,
          clientAddress: null,
          subtotal: booking.subtotal,
          discount: booking.discount,
          vatRate: booking.vatRate,
          vatAmount: booking.vatAmount,
          total: booking.total,
          status: isHoldedEnabled() ? 'PENDING_SYNC' : 'DRAFT',
          pdfUrl: uploadedPdf.publicUrl,
          pdfKey: uploadedPdf.path,
          createdAt,
        },
      });

      await recordDocumentAdminLog({
        action: DOCUMENT_ADMIN_LOG_ACTIONS.INVOICE_PDF_GENERATED,
        entity: 'invoice',
        entityId: invoice.id,
        details: {
          documentType: 'INVOICE',
          source: 'invoice_service_create',
          reference,
          bookingId,
          bookingReference: booking.reference,
          customerId: booking.customerId,
          pdfUrl: uploadedPdf.publicUrl,
          pdfKey: uploadedPdf.path,
        },
      });

      log.info(`Factura creada: ${reference} per reserva ${booking.reference}`);

      // Try Holded sync if enabled
      if (isHoldedEnabled()) {
        try {
          await syncInvoiceToHolded(invoice.id);
        } catch (error) {
          log.error(`Error sincronitzant factura ${reference} amb Holded`, error);
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'SYNC_ERROR',
              holdedSyncError: error instanceof Error ? error.message : 'Error desconegut',
            },
          });
        }
      }

      return { invoiceId: invoice.id, reference };
    } catch (error: unknown) {
      // P2002 = unique constraint violation (referència duplicada)
      const isUniqueError = error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002';
      if (isUniqueError && attempts < MAX_ATTEMPTS - 1) {
        attempts++;
        log.warn(`Referència factura duplicada, reintentant (intent ${attempts + 1})`);
        continue;
      }
      throw error;
    }
  }

  throw new Error('No s\'ha pogut generar una referència de factura única');
}

// ============================================
// HOLDED SYNC
// ============================================

async function syncInvoiceToHolded(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      booking: {
        include: {
          pack: { include: { translations: true } },
          extras: { include: { extra: { include: { translations: true } } } },
          serviceLines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      },
      customer: true,
    },
  });

  if (!invoice.booking) {
    throw new Error('La factura no té booking associada');
  }
  if (!invoice.customer?.email) {
    throw new Error('El client de la factura no té email');
  }

  // Find or create Holded contact
  const holdedContactId = await findOrCreateHoldedContact({
    name: invoice.clientName,
    email: invoice.customer.email,
    nif: invoice.clientNIF || undefined,
    phone: invoice.customer.phone || undefined,
  });

  const items = buildInvoiceLinesFromBooking(invoice.booking, invoice.subtotal).map((line) => ({
    name: line.description,
    units: line.quantity ?? 1,
    subtotal: line.unitPrice,
    tax: invoice.vatRate,
  }));

  // Apply discount as negative item
  if (invoice.discount > 0) {
    items.push({
      name: 'Descompte',
      units: 1,
      subtotal: -invoice.discount,
      tax: invoice.vatRate,
    });
  }

  // Create Holded invoice
  const result = await createHoldedInvoice({
    contactId: holdedContactId,
    description: `Factura ${invoice.reference} — Reserva ${invoice.booking.reference}`,
    items,
  });

  // Update local invoice with Holded data
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'SYNCED',
      holdedInvoiceId: result.id,
      holdedContactId,
      holdedSyncedAt: new Date(),
      holdedSyncError: null,
    },
  });

  log.info(`Factura ${invoice.reference} sincronitzada amb Holded: ${result.id}`);
}

// ============================================
// RETRY SYNC
// ============================================

export async function retryHoldedSync(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
  });

  if (invoice.status !== 'SYNC_ERROR' && invoice.status !== 'PENDING_SYNC') {
    throw new Error('Només es pot reintentar la sincronització per factures amb error o pendents');
  }

  try {
    await syncInvoiceToHolded(invoiceId);
  } catch (error) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'SYNC_ERROR',
        holdedSyncError: error instanceof Error ? error.message : 'Error desconegut',
      },
    });
    throw error;
  }
}

// ============================================
// MARK AS PAID (amb validació d'estat)
// ============================================

export async function markInvoiceAsPaid(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    select: { status: true, reference: true },
  });

  if (invoice.status === 'CANCELLED') {
    throw new Error('No es pot marcar com a pagada una factura cancel·lada');
  }
  if (invoice.status === 'PAID') {
    throw new Error('La factura ja està marcada com a pagada');
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID' },
  });
  log.info(`Factura ${invoice.reference} marcada com a pagada`);
}

// ============================================
// CHECK HOLDED STATUS
// ============================================

async function refreshHoldedStatus(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
  });

  if (!invoice.holdedInvoiceId) return;

  const status = await getHoldedInvoiceStatus(invoice.holdedInvoiceId);
  if (!status) return;

  const updates: Record<string, unknown> = {};
  if (status.url) updates.holdedInvoiceUrl = status.url;

  // Map Holded status to our status
  if (status.status === 'paid' && invoice.status !== 'PAID') {
    updates.status = 'PAID';
  }

  if (Object.keys(updates).length > 0) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: updates,
    });
  }
}

type InvoiceSyncSummary = {
  autoCreated: number;
  retried: number;
  refreshed: number;
  errors: number;
};

export async function runInvoiceSyncCron(): Promise<InvoiceSyncSummary> {
  const summary: InvoiceSyncSummary = {
    autoCreated: 0,
    retried: 0,
    refreshed: 0,
    errors: 0,
  };

  const completedBookings = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      depositPaid: true,
      remainingPaid: true,
      invoices: { none: { status: { not: 'CANCELLED' } } },
      customerId: { not: null },
    },
    select: { id: true, reference: true },
    take: 20,
  });

  for (const booking of completedBookings) {
    try {
      await createInvoiceFromBooking(booking.id);
      summary.autoCreated++;
      log.info(`Cron invoice-sync: factura auto-creada per reserva ${booking.reference}`);
    } catch (error) {
      summary.errors++;
      log.error(`Cron invoice-sync: error creant factura per ${booking.reference}`, error);
    }
  }

  if (!isHoldedEnabled()) {
    return summary;
  }

  const errorInvoices = await prisma.invoice.findMany({
    where: { status: 'SYNC_ERROR' },
    select: { id: true, reference: true },
    take: 10,
  });

  for (const invoice of errorInvoices) {
    try {
      await retryHoldedSync(invoice.id);
      summary.retried++;
      log.info(`Cron invoice-sync: reintentat ${invoice.reference}`);
    } catch (error) {
      summary.errors++;
      log.error(`Cron invoice-sync: error reintentant ${invoice.reference}`, error);
    }
  }

  const syncedInvoices = await prisma.invoice.findMany({
    where: {
      status: 'SYNCED',
      holdedInvoiceId: { not: null },
    },
    select: { id: true, reference: true },
    take: 20,
  });

  for (const invoice of syncedInvoices) {
    try {
      await refreshHoldedStatus(invoice.id);
      summary.refreshed++;
    } catch (error) {
      summary.errors++;
      log.error(`Cron invoice-sync: error refrescant ${invoice.reference}`, error);
    }
  }

  return summary;
}
