import { type NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { timingSafeEqual } from 'crypto';
import { purgeExpiredDossiers } from '@/lib/services/dossierService';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';

export const dynamic = 'force-dynamic';

const CRON_PREFIX = 'dossier.trash-purge';
const TRASH_TTL_DAYS = 30;

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) return false;
  const expected = `Bearer ${cronSecret}`;
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TRASH_TTL_DAYS);

    const purged = await purgeExpiredDossiers(cutoff);

    log.info(`[dossier-trash-purge] Purgats ${purged} dossiers (>30 dies a la paperera)`);
    await saveCronRunStatus({
      prefix: CRON_PREFIX,
      status: 'ok',
      summary: { purged },
      message: `Purgats ${purged} dossiers de la paperera`,
      category: 'cleanup',
    });
    return NextResponse.json({ ok: true, purged });
  } catch (err) {
    log.error('[dossier-trash-purge] Error:', err as Error);
    await saveCronRunStatus({
      prefix: CRON_PREFIX,
      status: 'error',
      summary: {},
      message: err instanceof Error ? err.message : 'Error desconegut',
      category: 'cleanup',
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: 'Error purgant paperera' }, { status: 500 });
  }
}
