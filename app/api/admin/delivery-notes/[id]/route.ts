import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { getAdminDeliveryNoteById, updateAdminDeliveryNoteStatus } from '@/lib/services/deliveryNoteAdminService';

interface Params {
  params: { id: string };
}

const patchDeliveryNoteSchema = z.object({
  status: z.enum(['DELIVERED', 'SIGNED', 'CANCELLED']).optional(),
  signedBy: z.string().trim().min(1).nullable().optional(),
});

function requestIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const result = await getAdminDeliveryNoteById(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint albarà', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint albarà' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const parsed = patchDeliveryNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
    }

    const result = await updateAdminDeliveryNoteStatus(params.id, parsed.data.status, {
      signedBy: parsed.data.signedBy,
      signatureIp: parsed.data.status === 'SIGNED' ? requestIp(req) : null,
      signatureUa: parsed.data.status === 'SIGNED' ? req.headers.get('user-agent') : null,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error actualitzant albarà';
    log.error('Error actualitzant albarà', error, {
      context: { requestId, endpoint: 'admin/delivery-notes/[id]:PATCH', deliveryNoteId: params.id },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
