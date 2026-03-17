import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { blockAvailabilityDay, listBlockedAvailability, unblockAvailabilityDay } from '@/lib/services/availabilityAdminService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await listBlockedAvailability(
      req.nextUrl.searchParams.get('from'),
      req.nextUrl.searchParams.get('to')
    );
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint disponibilitat bloquejada', error, { context: { endpoint: 'GET /api/admin/availability' } });
    return NextResponse.json({ ok: false, error: 'Error obtenint disponibilitat' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await blockAvailabilityDay(body?.date, body?.note);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error bloquejant dia de disponibilitat', error, { context: { endpoint: 'POST /api/admin/availability' } });
    return NextResponse.json({ ok: false, error: 'Error bloquejant dia' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await unblockAvailabilityDay(
      req.nextUrl.searchParams.get('id'),
      req.nextUrl.searchParams.get('date')
    );
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error desbloquejant dia de disponibilitat', error, { context: { endpoint: 'DELETE /api/admin/availability' } });
    return NextResponse.json({ ok: false, error: 'Error desbloquejant dia' }, { status: 500 });
  }
}
