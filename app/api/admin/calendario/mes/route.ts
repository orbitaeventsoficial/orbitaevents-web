import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { getAdminCalendarMonth } from '@/lib/services/adminCalendarMonthService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const result = await getAdminCalendarMonth(searchParams.get('from'), searchParams.get('to'));
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint calendari:', error);
    return NextResponse.json({ error: 'Error obtenint dades del calendari' }, { status: 500 });
  }
}
