// app/api/cron/post-event/route.ts
// CRON JOB: Envia emails post-event automàtics
import { NextRequest, NextResponse } from 'next/server';
import crypto, { timingSafeEqual } from 'crypto';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { getRequestId } from '@/lib/request-context';
import {
  generatePostEventEmail,
  getPostEventSubject,
  normalizeLocale,
  resolvePackName,
} from '@/lib/services/postEventEmailService';

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

interface ProcessedResult {
  bookingId: string;
  clientName: string;
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!isAuthorized(request, requestId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  async function saveRunStatus(status: 'ok' | 'error', summary: unknown, message?: string) {
    const ts = new Date().toISOString();
    const prefix = 'automation.postEvent';
    await Promise.all([
      prisma.setting.upsert({ where: { key: `${prefix}.lastRun` }, update: { value: ts }, create: { key: `${prefix}.lastRun`, value: ts, type: 'STRING', category: 'automation' } }),
      prisma.setting.upsert({ where: { key: `${prefix}.lastStatus` }, update: { value: status }, create: { key: `${prefix}.lastStatus`, value: status, type: 'STRING', category: 'automation' } }),
      prisma.setting.upsert({ where: { key: `${prefix}.lastSummary` }, update: { value: JSON.stringify(summary) }, create: { key: `${prefix}.lastSummary`, value: JSON.stringify(summary), type: 'JSON', category: 'automation' } }),
      ...(message ? [prisma.setting.upsert({ where: { key: `${prefix}.lastMessage` }, update: { value: message }, create: { key: `${prefix}.lastMessage`, value: message, type: 'STRING', category: 'automation' } })] : []),
    ]);
  }

  const results: ProcessedResult[] = [];
  const now = new Date();

  try {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        eventDate: { gte: twoDaysAgo, lte: oneDayAgo },
        postEventEmailSent: false,
      },
      include: {
        lead: true,
        pack: { include: { translations: true } },
      },
      take: 50,
    });

    const BATCH_SIZE = 5;
    for (let i = 0; i < completedBookings.length; i += BATCH_SIZE) {
      const batch = completedBookings.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (booking): Promise<ProcessedResult> => {
          const email = booking.clientEmail;
          const name = booking.clientName;
          const locale = normalizeLocale(booking.lead?.preferredLocale);

          if (!email || email.includes('@leads.orbitaevents.local')) {
            return { bookingId: booking.id, clientName: name, email: email || 'N/A', status: 'skipped', reason: 'No hi ha un correu vàlid' };
          }

          try {
            const reviewToken = crypto.randomBytes(32).toString('base64url');
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitaevents.com';
            const reviewUrl = `${baseUrl}/${locale}/valoracio?token=${reviewToken}&ref=${booking.reference}`;
            const packName = resolvePackName(booking.pack?.translations, locale);

            const emailHtml = generatePostEventEmail({
              name, packName, eventDate: booking.eventDate, reviewUrl,
              googleReviewUrl: SITE_CONFIG.reviews.googleReviewUrl, locale,
            });

            await sendEmail({ to: email, subject: getPostEventSubject(locale, name), html: emailHtml });

            await prisma.booking.update({
              where: { id: booking.id },
              data: { postEventEmailSent: true, postEventEmailSentAt: now, reviewToken },
            });

            if (booking.lead?.customerId) {
              await prisma.customerActivity.create({
                data: {
                  customerId: booking.lead.customerId,
                  action: 'POST_EVENT_EMAIL_SENT',
                  details: { bookingId: booking.id, bookingRef: booking.reference },
                },
              });
            }

            return { bookingId: booking.id, clientName: name, email, status: 'sent' };
          } catch (emailError) {
            log.error('Error enviant email post-event', emailError, {
              context: { requestId, endpoint: 'cron/post-event:GET', bookingId: booking.id },
            });
            return { bookingId: booking.id, clientName: name, email, status: 'error', reason: emailError instanceof Error ? emailError.message : 'Error desconegut' };
          }
        })
      );

      results.push(...batchResults);
    }

    const summary = {
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    await saveRunStatus('ok', summary);

    return NextResponse.json({ ok: true, timestamp: now.toISOString(), summary, results });
  } catch (error) {
    log.error('Error en cron post-event:', error, {
      context: { requestId, endpoint: 'cron/post-event:GET' },
    });
    await saveRunStatus('error', {}, error instanceof Error ? error.message : 'Error desconegut').catch(() => {});
    return NextResponse.json({ error: 'Error processant esdeveniments', details: error instanceof Error ? error.message : 'Error desconegut' }, { status: 500 });
  }
}
