import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { syncBookingToGoogleCalendar } from '@/lib/services/googleCalendarSyncService';

interface Params {
  params: { id: string };
}

type Body = {
  action?: 'upsert' | 'delete';
};

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body.action === 'delete' || body.action === 'upsert' ? body.action : undefined;
    const result = await syncBookingToGoogleCalendar(params.id, action);

    if (!result.ok) {
      log.warn('Sincronització calendari fallida', { endpoint: 'POST /api/admin/bookings/[id]/calendar-sync', bookingId: params.id, error: result.error });
      return NextResponse.json({ ok: false, error: result.error, result }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    log.error('Error sincronitzant reserva amb Google Calendar', error, { context: { endpoint: 'POST /api/admin/bookings/[id]/calendar-sync', bookingId: params.id } });
    return NextResponse.json({ ok: false, error: 'Error sincronitzant amb calendari' }, { status: 500 });
  }
}
