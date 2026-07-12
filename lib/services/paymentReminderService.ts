/**
 * paymentReminderService.ts — Recordatoris de pagament automàtics
 *
 * Cerca reserves CONFIRMED/PREPARING amb pagament pendent
 * i eventDate a menys de 14 dies. Si no s'ha enviat recordatori
 * en els últims 7 dies, envia email automàtic en l'idioma preferit del client.
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import {
  PAYMENT_REMINDER_COPY,
  PAYMENT_REMINDER_DAYS_BEFORE_EVENT,
  PAYMENT_REMINDER_MIN_DAYS_BETWEEN,
  PLACEHOLDER_EMAIL_DOMAIN,
  CUSTOMER_ACTIVITY_ACTIONS,
  formatCurrency,
  formatDateFull,
} from '@/lib/constants';
import { log } from '@/lib/logger';
import { bookingOutstandingBreakdown } from '@/lib/payment-status';
import { recordBookingCommunicationLog } from '@/lib/services/bookingCommunicationLogService';
import { getAppBaseUrl } from '@/lib/site';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';

interface PaymentReminderResult {
  checked: number;
  sent: number;
  skipped: number;
  errors: number;
}

type Locale = keyof typeof PAYMENT_REMINDER_COPY;

type PaymentReminderBooking = {
  total: number;
  depositAmount: number;
  remainingAmount?: number | null;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount?: number | null;
};

function normalizeLocale(value?: string | null): Locale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ca')) return 'ca';
  return 'es';
}

function buildPendingReminderItems(
  booking: PaymentReminderBooking,
  locale: Locale,
  labels: { deposit: string; remaining: string },
): { pendingAmount: number; pendingItems: string[] } {
  const breakdown = bookingOutstandingBreakdown(booking);
  const pendingItems: string[] = [];

  if (breakdown.depositAmount > 0) {
    pendingItems.push(`${labels.deposit}: ${formatCurrency(breakdown.depositAmount, locale)}`);
  }

  if (breakdown.remainingAmount > 0) {
    pendingItems.push(`${labels.remaining}: ${formatCurrency(breakdown.remainingAmount, locale)}`);
  }

  return { pendingAmount: breakdown.total, pendingItems };
}

const PAYMENT_REMINDER_TEMPLATE_KEY = 'payment-reminder';
const PAYMENT_REMINDER_ORBITA_ORIGIN = 'payment-reminder';

function buildTrackedPaymentReminderHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

export async function sendPaymentReminders(): Promise<PaymentReminderResult> {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() + PAYMENT_REMINDER_DAYS_BEFORE_EVENT);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PREPARING'] },
      eventDate: { gte: now, lte: cutoffDate },
      OR: [
        { depositPaid: false },
        { remainingPaid: false },
      ],
    },
    select: {
      id: true,
      reference: true,
      clientName: true,
      clientEmail: true,
      eventDate: true,
      total: true,
      depositAmount: true,
      remainingAmount: true,
      depositPaid: true,
      remainingPaid: true,
      cashAmount: true,
      preferredLocale: true,
    },
  });

  const result: PaymentReminderResult = { checked: bookings.length, sent: 0, skipped: 0, errors: 0 };

  for (const booking of bookings) {
    try {
      const recentReminder = await prisma.adminLog.findFirst({
        where: {
          action: CUSTOMER_ACTIVITY_ACTIONS.PAYMENT_REMINDER_SENT,
          entityId: booking.id,
          createdAt: {
            gte: new Date(now.getTime() - PAYMENT_REMINDER_MIN_DAYS_BETWEEN * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentReminder) {
        result.skipped++;
        continue;
      }

      if (!booking.clientEmail || booking.clientEmail.includes(PLACEHOLDER_EMAIL_DOMAIN)) {
        result.skipped++;
        continue;
      }

      const locale = normalizeLocale(booking.preferredLocale);
      const t = PAYMENT_REMINDER_COPY[locale];
      const { pendingAmount, pendingItems } = buildPendingReminderItems(booking, locale, t);

      if (pendingAmount <= 0) {
        result.skipped++;
        continue;
      }

      const daysToEvent = Math.ceil(
        (new Date(booking.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const ref = booking.reference || booking.id.slice(0, 8);
      const subject = t.subject(ref);
      const html = `
        <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px;border-radius:12px">
          <h2 style="margin:0 0 12px 0;color:#f8fafc">${t.title}</h2>
          <p>${t.greeting(booking.clientName)}</p>
          <p>${t.body(ref, formatDateFull(new Date(booking.eventDate), locale), daysToEvent)}</p>
          <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0">
            <p style="margin:0 0 8px 0;font-weight:bold">${t.pending}: ${formatCurrency(pendingAmount, locale)}</p>
            <ul style="margin:0;padding-left:18px">${pendingItems.map((item) => `<li>${item}</li>`).join('')}</ul>
          </div>
          <p>${t.alreadyPaid}</p>
          <p style="margin-top:16px;font-size:12px;color:#94a3b8">${t.thanks}</p>
        </div>
      `;
      const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
      const orbita = { kind: 'booking' as const, id: booking.id, origin: PAYMENT_REMINDER_ORBITA_ORIGIN };
      const trackingRecord = await recordEmailSend({
        templateKey: PAYMENT_REMINDER_TEMPLATE_KEY,
        to: booking.clientEmail,
        subject,
        leadId: null,
        customerId: null,
        locale,
        htmlBody: html,
        orbitaKind: orbita.kind,
        orbitaId: orbita.id,
        orbitaOrigin: orbita.origin,
      });

      const sendResult = await sendEmail({
        to: booking.clientEmail,
        subject,
        html: buildTrackedPaymentReminderHtml(html, trackingRecord.trackingToken, baseUrl),
        orbita,
      });
      await updateEmailSendResult(trackingRecord.id, {
        smtpAccepted: sendResult.smtp.accepted,
        smtpRejected: sendResult.smtp.rejected,
        smtpResponse: sendResult.smtp.response,
        smtpMessageId: sendResult.smtp.messageId,
        imapAppendOk: sendResult.imapSent.attempted ? sendResult.imapSent.ok : null,
        imapSentFolder: sendResult.imapSent.folder,
        imapSentUid: sendResult.imapSent.uid ?? null,
        imapError: sendResult.imapSent.error ?? null,
      }).catch(() => undefined);

      await recordBookingCommunicationLog({
        action: CUSTOMER_ACTIVITY_ACTIONS.PAYMENT_REMINDER_SENT,
        bookingId: booking.id,
        details: {
          pendingAmount,
          daysToEvent,
          clientEmail: booking.clientEmail,
          locale,
          emailSendId: trackingRecord.id,
          emailSnapshot: 'EmailSend.htmlBody',
          orbitaKind: orbita.kind,
          orbitaId: orbita.id,
          orbitaOrigin: orbita.origin,
        },
      });

      result.sent++;
    } catch (error) {
      log.error(`Payment reminder failed for booking ${booking.id}`, error);
      result.errors++;
    }
  }

  return result;
}
