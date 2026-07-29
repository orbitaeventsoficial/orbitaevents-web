import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { generateAdminDeliveryNotePdf } from '@/lib/services/deliveryNoteAdminService';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const result = await generateAdminDeliveryNotePdf(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error generant PDF d’albarà';
    log.error('Error generant PDF d’albarà', error, {
      context: { requestId, endpoint: 'admin/delivery-notes/[id]/pdf:POST', deliveryNoteId: params.id },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
