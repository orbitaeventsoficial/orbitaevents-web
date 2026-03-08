// app/api/admin/emails/run-cron/route.ts
// Executa el cron de post-event manualment des del panell admin
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { requireAuth } from '@/lib/auth';
import {
  generatePostEventEmail,
  getPostEventSubject,
  normalizeLocale,
  resolvePackName,
} from '@/lib/services/postEventEmailService';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface ProcessedResult {
  bookingId: string;
  clientName: string;
  email: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
}

async function saveCronStatus(payload: {
  status: 'ok' | 'error';
  summary?: Record<string, number>;
  message?: string;
  timestamp: string;
}) {
  const { status, summary, message, timestamp } = payload;
  await prisma.setting.upsert({
    where: { key: 'emails.cron.lastRun' },
    update: { value: timestamp, type: 'STRING', category: 'config' },
    create: { key: 'emails.cron.lastRun', value: timestamp, type: 'STRING', category: 'config' },
  });
  await prisma.setting.upsert({
    where: { key: 'emails.cron.lastStatus' },
    update: { value: status, type: 'STRING', category: 'config' },
    create: { key: 'emails.cron.lastStatus', value: status, type: 'STRING', category: 'config' },
  });
  if (summary) {
    await prisma.setting.upsert({
      where: { key: 'emails.cron.lastSummary' },
      update: { value: JSON.stringify(summary), type: 'JSON', category: 'config' },
      create: { key: 'emails.cron.lastSummary', value: JSON.stringify(summary), type: 'JSON', category: 'config' },
    });
  }
  if (message) {
    await prisma.setting.upsert({
      where: { key: 'emails.cron.lastMessage' },
      update: { value: message, type: 'STRING', category: 'config' },
      create: { key: 'emails.cron.lastMessage', value: message, type: 'STRING', category: 'config' },
    });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

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

    for (const booking of completedBookings) {
      const email = booking.clientEmail;
      const name = booking.clientName;
      const locale = normalizeLocale(booking.lead?.preferredLocale);

      if (!email || email.includes('@leads.orbitaevents.local')) {
        results.push({ bookingId: booking.id, clientName: name, email: email || 'N/A', status: 'skipped', reason: 'No valid email' });
        continue;
      }

      try {
        const reviewToken = Buffer.from(`${booking.id}:${Date.now()}`).toString('base64url');
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

        results.push({ bookingId: booking.id, clientName: name, email, status: 'sent' });
      } catch (emailError) {
        log.error('Error enviant email programat', emailError, { context: { bookingId: booking.id } });
        results.push({ bookingId: booking.id, clientName: name, email, status: 'error', reason: emailError instanceof Error ? emailError.message : 'Unknown error' });
      }
    }

    const summary = {
      processed: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    await saveCronStatus({ status: 'ok', summary, timestamp: now.toISOString() });

    return NextResponse.json({ ok: true, timestamp: now.toISOString(), summary, results });
  } catch (error) {
    log.error('Error en cron post-event:', error);
    await saveCronStatus({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error', timestamp: now.toISOString() });
    return NextResponse.json({ error: 'Error processant esdeveniments', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
