import { prisma } from '@/lib/prisma';
import { createInvoiceFromBooking, markInvoiceAsPaid } from '@/lib/services/invoiceService';

const DEFAULT_INVOICES_PAGE = 1;
const DEFAULT_INVOICES_LIMIT = 50;
const MAX_INVOICES_LIMIT = 200;

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export async function listAdminInvoices(input?: { page?: number; limit?: number }) {
  const page = normalizePositiveInteger(input?.page, DEFAULT_INVOICES_PAGE);
  const limit = Math.min(MAX_INVOICES_LIMIT, normalizePositiveInteger(input?.limit, DEFAULT_INVOICES_LIMIT));

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        booking: { select: { id: true, reference: true, status: true, eventDate: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.invoice.count(),
  ]);

  return {
    ok: true,
    invoices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function createAdminInvoiceFromBooking(bookingId: string) {
  const result = await createInvoiceFromBooking(bookingId);
  return { ok: true, ...result };
}

export async function getAdminInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      booking: { select: { id: true, reference: true, status: true, eventDate: true, clientName: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invoice) {
    return { status: 404, body: { ok: false, error: 'Factura no trobada' } };
  }

  return { status: 200, body: { ok: true, invoice } };
}

export async function updateAdminInvoiceStatus(id: string, status?: 'PAID' | 'CANCELLED') {
  if (status === 'PAID') {
    await markInvoiceAsPaid(id);
    return { status: 200, body: { ok: true } };
  }

  if (status === 'CANCELLED') {
    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });

    if (invoice.status === 'PAID') {
      return { status: 400, body: { ok: false, error: 'No es pot cancel·lar una factura ja pagada' } };
    }

    await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  return { status: 200, body: { ok: true } };
}
