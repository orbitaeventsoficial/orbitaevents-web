import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { createAdminInvoiceFromBooking, listAdminInvoices } from '@/lib/services/invoiceAdminService';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  bookingId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    return NextResponse.json(await listAdminInvoices({
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    }));
  } catch (error) {
    log.error('Error llistant factures', error);
    return NextResponse.json({ ok: false, error: 'Error llistant factures' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'bookingId invàlid' }, { status: 400 });
    }
    return NextResponse.json(await createAdminInvoiceFromBooking(parsed.data.bookingId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error creant factura';
    log.error('Error creant factura', error, {
      context: { requestId, endpoint: 'admin/invoices:POST' },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

