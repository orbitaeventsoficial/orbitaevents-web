// app/api/cron/post-event/route.ts
// CRON JOB: Envia emails post-event automàtics
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { listPendingPostEventBookings, sendPostEventEmailForBooking, type PostEventDispatchResult } from '@/lib/services/postEventDispatchService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    log.error('CRON_SECRET no configurat', undefined, {
      context: { requestId, endpoint: 'cron/post-event:isAuthorized' },
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: PostEventDispatchResult[] = [];
  const now = new Date();

  try {
    const completedBookings = await listPendingPostEventBookings(now);

    const BATCH_SIZE = 5;
    for (let i = 0; i < completedBookings.length; i += BATCH_SIZE) {
      const batch = completedBookings.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (booking): Promise<PostEventDispatchResult> => {
          try {
            return await sendPostEventEmailForBooking(booking.id);
          } catch (emailError) {
            log.error('Error enviant email post-event', emailError, {
              context: { requestId, endpoint: 'cron/post-event:GET', bookingId: booking.id },
            });
            return {
              bookingId: booking.id,
              clientName: booking.clientName,
              email: booking.clientEmail || 'N/A',
              status: 'error',
              reason: emailError instanceof Error ? emailError.message : 'Error desconegut',
            };
          }
        })
      );

      results.push(...batchResults);
    }

    const summary = {
      processed: results.length,
      sent: results.filter((r) => r.status === 'sent').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
    };

    await saveCronRunStatus({ prefix: 'automation.postEvent', status: 'ok', summary });
    return NextResponse.json({ ok: true, timestamp: now.toISOString(), summary, results });
  } catch (error) {
    log.error('Error en cron post-event:', error, {
      context: { requestId, endpoint: 'cron/post-event:GET' },
    });
    await saveCronRunStatus({
      prefix: 'automation.postEvent',
      status: 'error',
      summary: {},
      message: error instanceof Error ? error.message : 'Error desconegut',
    }).catch(() => {});
    return NextResponse.json(
      { error: 'Error processant esdeveniments', details: error instanceof Error ? error.message : 'Error desconegut' },
      { status: 500 }
    );
  }
}
