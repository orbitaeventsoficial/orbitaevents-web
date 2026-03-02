import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { markInvoiceAsPaid } from '@/lib/services/invoiceService';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

// GET: Detall d'una factura
export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        booking: { select: { id: true, reference: true, status: true, eventDate: true, clientName: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ ok: false, error: 'Factura no trobada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    log.error('Error obtenint factura', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint factura' }, { status: 500 });
  }
}

const patchSchema = z.object({
  status: z.enum(['PAID', 'CANCELLED']).optional(),
});

// PATCH: Actualitzar estat de factura
export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const { status } = patchSchema.parse(body);

    if (status === 'PAID') {
      await markInvoiceAsPaid(params.id);
    } else if (status === 'CANCELLED') {
      // Validar que no estigui ja pagada
      const invoice = await prisma.invoice.findUniqueOrThrow({
        where: { id: params.id },
        select: { status: true },
      });
      if (invoice.status === 'PAID') {
        return NextResponse.json({ ok: false, error: 'No es pot cancel·lar una factura ja pagada' }, { status: 400 });
      }
      await prisma.invoice.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error actualitzant factura';
    log.error('Error actualitzant factura', error, {
      context: { requestId, endpoint: 'admin/invoices/[id]:PATCH' },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
