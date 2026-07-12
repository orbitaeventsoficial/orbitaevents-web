// app/api/admin/emails/run-cron/route.ts
// Executa el cron de post-event manualment des del panell admin
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { listPendingPostEventBookings, sendPostEventEmailForBooking, type PostEventDispatchResult } from '@/lib/services/postEventDispatchService';
import { ADMIN_POST_EVENT_CRON_STATUS_PREFIX } from '@/lib/constants/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const results: PostEventDispatchResult[] = [];
  const now = new Date();

  try {
    const completedBookings = await listPendingPostEventBookings(now);

    for (const booking of completedBookings) {
      try {
        const result = await sendPostEventEmailForBooking(booking.id);
        results.push(result);
      } catch (emailError) {
        log.error('Error enviant email programat', emailError, { context: { bookingId: booking.id } });
        results.push({
          bookingId: booking.id,
          clientName: booking.clientName,
          email: booking.clientEmail || 'N/A',
          status: 'error',
          reason: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    const summary = {
      processed: results.length,
      sent: results.filter((r) => r.status === 'sent').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
    };

    await saveCronRunStatus({
      prefix: ADMIN_POST_EVENT_CRON_STATUS_PREFIX,
      status: 'ok',
      summary,
      timestamp: now.toISOString(),
      category: 'config',
    });

    return NextResponse.json({ ok: true, timestamp: now.toISOString(), summary, results });
  } catch (error) {
    log.error('Error en cron post-event:', error);
    await saveCronRunStatus({
      prefix: ADMIN_POST_EVENT_CRON_STATUS_PREFIX,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: now.toISOString(),
      category: 'config',
    });
    return NextResponse.json(
      { error: 'Error processant esdeveniments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
