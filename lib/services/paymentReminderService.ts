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
import { recordBookingCommunicationLog } from '@/lib/services/bookingCommunicationLogService';

interface PaymentReminderResult {
  checked: number;
  sent: number;
  skipped: number;
  errors: number;
}

type Locale = keyof typeof PAYMENT_REMINDER_COPY;

function normalizeLocale(value?: string | null): Locale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ca')) return 'ca';
  return 'es';
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
      depositPaid: true,
      remainingPaid: true,
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

      const depositAmount = Number(booking.depositAmount) || 0;
      const total = Number(booking.total) || 0;
      let pendingAmount = 0;

      const locale = normalizeLocale(booking.preferredLocale);
      const t = PAYMENT_REMINDER_COPY[locale];
      const pendingItems: string[] = [];

      if (!booking.depositPaid && depositAmount > 0) {
        pendingAmount += depositAmount;
        pendingItems.push(`${t.deposit}: ${formatCurrency(depositAmount, locale)}`);
      }
      if (!booking.remainingPaid) {
        const remaining = total - depositAmount;
        if (remaining > 0) {
          pendingAmount += remaining;
          pendingItems.push(`${t.remaining}: ${formatCurrency(remaining, locale)}`);
        }
      }

      if (pendingAmount <= 0) {
        result.skipped++;
        continue;
      }

      const daysToEvent = Math.ceil(
        (new Date(booking.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const ref = booking.reference || booking.id.slice(0, 8);
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

      await sendEmail({
        to: booking.clientEmail,
        subject: t.subject(ref),
        html,
      });

      await recordBookingCommunicationLog({
        action: CUSTOMER_ACTIVITY_ACTIONS.PAYMENT_REMINDER_SENT,
        bookingId: booking.id,
        details: {
          pendingAmount,
          daysToEvent,
          clientEmail: booking.clientEmail,
          locale,
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
