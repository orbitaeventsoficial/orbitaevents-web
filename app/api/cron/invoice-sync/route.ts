import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { runInvoiceSyncCron } from '@/lib/services/invoiceService';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per invoice-sync', undefined, {
      context: { requestId, endpoint: 'cron/invoice-sync:isAuthorized' },
    });
    return false;
  }
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);

  if (!isAuthorized(request, requestId)) {
    return NextResponse.json({ error: 'No autoritzat' }, { status: 401 });
  }

  try {
    const summary = await runInvoiceSyncCron();
    log.info('Cron invoice-sync completat', { context: { summary } });
    await saveCronRunStatus({ prefix: 'automation.invoiceSync', status: 'ok', summary });
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('Cron invoice-sync error global', error, {
      context: { requestId },
    });
    const summary = { autoCreated: 0, retried: 0, refreshed: 0, errors: 0 };
    await saveCronRunStatus({ prefix: 'automation.invoiceSync', status: 'error', summary, message: error instanceof Error ? error.message : 'Error desconegut' }).catch(() => {});
    return NextResponse.json({ ok: false, error: 'Error executant cron' }, { status: 500 });
  }
}
