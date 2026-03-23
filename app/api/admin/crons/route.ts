import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ADMIN_CRON_PREFIXES } from '@/lib/constants/admin';
import { log } from '@/lib/logger';
import { readCronRunStatuses } from '@/lib/services/cronRunStatusService';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const crons = await readCronRunStatuses([...ADMIN_CRON_PREFIXES]);
    return NextResponse.json({ ok: true, crons });
  } catch (error) {
    log.error('Error obtenint estat dels crons', error, { context: { endpoint: 'GET /api/admin/crons' } });
    return NextResponse.json({ ok: false, error: 'Error obtenint estat dels crons' }, { status: 500 });
  }
}
