import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { createInvoiceFromBooking } from '@/lib/services/invoiceService';
import { z } from 'zod';

// GET: Llistat de factures
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        booking: { select: { id: true, reference: true, status: true, eventDate: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, invoices });
  } catch (error) {
    log.error('Error llistant factures', error);
    return NextResponse.json({ ok: false, error: 'Error llistant factures' }, { status: 500 });
  }
}

const createInvoiceSchema = z.object({
  bookingId: z.string().min(1),
});

// POST: Crear factura des d'una reserva
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const { bookingId } = createInvoiceSchema.parse(body);

    const result = await createInvoiceFromBooking(bookingId);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error creant factura';
    log.error('Error creant factura', error, {
      context: { requestId, endpoint: 'admin/invoices:POST' },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
