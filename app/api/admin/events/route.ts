/**
 * API ROUTE: Admin Events (Prisma)
 * =================================
 * GET - Obtenir events completats/passats
 * PATCH - Actualitzar estat post-event
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { safeParseInt } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
import { listAdminEvents, markAdminEventPostSent } from '@/lib/services/adminEventsService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listAdminEvents(
      searchParams.get('status') || 'COMPLETED',
      safeParseInt(searchParams.get('days'), 30, 1, 365)
    );
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint events:', error);
    return NextResponse.json({ error: 'Error obtenint events' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await markAdminEventPostSent(body?.bookingId, body?.post_event_sent_at);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant booking:', error);
    return NextResponse.json({ error: 'Error actualitzant booking' }, { status: 500 });
  }
}
