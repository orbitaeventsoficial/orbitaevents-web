import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { updateAdminInvoiceStatus, getAdminInvoiceById } from '@/lib/services/invoiceAdminService';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

const patchSchema = z.object({
  status: z.enum(['PAID', 'CANCELLED']).optional(),
});

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await getAdminInvoiceById(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint factura', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint factura' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const { status } = patchSchema.parse(body);
    const result = await updateAdminInvoiceStatus(params.id, status);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error actualitzant factura';
    log.error('Error actualitzant factura', error, {
      context: { requestId, endpoint: 'admin/invoices/[id]:PATCH' },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
