import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { retryHoldedSync } from '@/lib/services/invoiceService';

interface Params {
  params: { id: string };
}

// POST: Reintentar sincronització amb Holded
export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    await retryHoldedSync(params.id);
    return NextResponse.json({ ok: true, message: 'Sincronització completada' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de sincronització';
    log.error('Error retry Holded sync', error, {
      context: { requestId, endpoint: 'admin/invoices/[id]/sync:POST', invoiceId: params.id },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
