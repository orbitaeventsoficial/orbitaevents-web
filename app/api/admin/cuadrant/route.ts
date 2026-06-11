import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { loadCrewSchedule } from '@/lib/services/crewScheduleService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const days = Number(req.nextUrl.searchParams.get('days')) || 30;
    const result = await loadCrewSchedule(new Date(), days);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error carregant el cuadrant operatiu:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}
