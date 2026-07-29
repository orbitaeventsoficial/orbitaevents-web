import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { createAdminDeliveryNoteFromBooking, listAdminDeliveryNotes } from '@/lib/services/deliveryNoteAdminService';

const createDeliveryNoteSchema = z.object({
  bookingId: z.string().trim().min(1),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const { searchParams } = new URL(req.url);
    return NextResponse.json(await listAdminDeliveryNotes({
      bookingId: searchParams.get('bookingId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    }));
  } catch (error) {
    log.error('Error llistant albarans', error);
    return NextResponse.json({ ok: false, error: 'Error llistant albarans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const parsed = createDeliveryNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'bookingId invàlid' }, { status: 400 });
    }
    return NextResponse.json(await createAdminDeliveryNoteFromBooking(parsed.data.bookingId));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error creant albarà';
    log.error('Error creant albarà', error, {
      context: { requestId, endpoint: 'admin/delivery-notes:POST' },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
