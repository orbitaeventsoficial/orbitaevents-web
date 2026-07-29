import { type NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { timingSafeEqual } from 'crypto';
import { executeRetentionPolicies } from '@/lib/services/privacyService';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';

export const dynamic = 'force-dynamic';

const CRON_PREFIX = 'privacy.data-retention';

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

// Aplica les polítiques de retenció RGPD actives (DELETE/ANONYMIZE) sobre dades velles.
// Segur per defecte: si no hi ha polítiques actives, no toca cap dada.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await executeRetentionPolicies();
    const policiesApplied = Array.isArray(result) ? result.length : 0;
    log.info('[data-retention] Polítiques de retenció aplicades', { context: { policiesApplied } });
    await saveCronRunStatus({
      prefix: CRON_PREFIX,
      status: 'ok',
      summary: { policiesApplied, detail: result ?? [] },
      message: `Polítiques de retenció RGPD aplicades (${policiesApplied})`,
      category: 'cleanup',
    });
    return NextResponse.json({ ok: true, policiesApplied });
  } catch (err) {
    log.error('[data-retention] Error:', err as Error);
    await saveCronRunStatus({
      prefix: CRON_PREFIX,
      status: 'error',
      summary: {},
      message: err instanceof Error ? err.message : 'Error desconegut',
      category: 'cleanup',
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: 'Error aplicant retenció' }, { status: 500 });
  }
}
