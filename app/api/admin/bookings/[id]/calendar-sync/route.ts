import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
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

  const body = (await req.json().catch(() => ({}))) as Body;
  const action = body.action === 'delete' || body.action === 'upsert' ? body.action : undefined;
  const result = await syncBookingToGoogleCalendar(params.id, action);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, result }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result });
}
