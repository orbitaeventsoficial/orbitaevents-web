import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { loadPayoutSummary } from '@/lib/services/crewScheduleService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const sp = req.nextUrl.searchParams;
    const fromParam = sp.get('from');
    const toParam = sp.get('to');
    const from = fromParam ? new Date(fromParam) : startOfMonthUtc(new Date());
    const to = toParam ? new Date(toParam) : endOfMonthUtc(new Date());
    const result = await loadPayoutSummary(from, to);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error carregant el repartiment:', error as Error);
    return NextResponse.json({ error: 'Error intern' }, { status: 500 });
  }
}

function startOfMonthUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}
function endOfMonthUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
}
