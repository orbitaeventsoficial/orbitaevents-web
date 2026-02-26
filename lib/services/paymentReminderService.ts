/**
 * paymentReminderService.ts — Recordatoris de pagament automàtics
 *
 * Cerca reserves CONFIRMED/PREPARING amb pagament pendent
 * i eventDate a menys de 14 dies. Si no s'ha enviat recordatori
 * en els últims 7 dies, envia email automàtic.
 */

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { formatCurrency, formatDateFull } from '@/lib/constants';
import { log } from '@/lib/logger';

const REMINDER_DAYS_BEFORE_EVENT = 14;
const MIN_DAYS_BETWEEN_REMINDERS = 7;

export interface PaymentReminderResult {
  checked: number;
  sent: number;
  skipped: number;
  errors: number;
}

export async function sendPaymentReminders(): Promise<PaymentReminderResult> {
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() + REMINDER_DAYS_BEFORE_EVENT);

  // Reserves amb pagament pendent i event proper
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
    },
  });

  const result: PaymentReminderResult = { checked: bookings.length, sent: 0, skipped: 0, errors: 0 };

  for (const booking of bookings) {
    try {
      // Comprovar si ja hem enviat recordatori recentment
      const recentReminder = await prisma.adminLog.findFirst({
        where: {
          action: 'PAYMENT_REMINDER_SENT',
          entityId: booking.id,
          createdAt: {
            gte: new Date(now.getTime() - MIN_DAYS_BETWEEN_REMINDERS * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentReminder) {
        result.skipped++;
        continue;
      }

      // No enviar si no hi ha email vàlid
      if (!booking.clientEmail || booking.clientEmail.includes('@leads.orbitaevents.local')) {
        result.skipped++;
        continue;
      }

      // Calcular import pendent
      const depositAmount = Number(booking.depositAmount) || 0;
      const total = Number(booking.total) || 0;
      let pendingAmount = 0;
      const pendingItems: string[] = [];

      if (!booking.depositPaid && depositAmount > 0) {
        pendingAmount += depositAmount;
        pendingItems.push(`Dipòsit: ${formatCurrency(depositAmount)}`);
      }
      if (!booking.remainingPaid) {
        const remaining = total - depositAmount;
        if (remaining > 0) {
          pendingAmount += remaining;
          pendingItems.push(`Resta: ${formatCurrency(remaining)}`);
        }
      }

      if (pendingAmount <= 0) {
        result.skipped++;
        continue;
      }

      const daysToEvent = Math.ceil(
        (new Date(booking.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const html = `
        <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px;border-radius:12px">
          <h2 style="margin:0 0 12px 0;color:#f8fafc">Recordatori de pagament</h2>
          <p>Hola ${booking.clientName},</p>
          <p>Et recordem que tens un pagament pendent per a la teva reserva <strong>${booking.reference || booking.id.slice(0, 8)}</strong>,
          programada per al <strong>${formatDateFull(new Date(booking.eventDate))}</strong> (d'aquí ${daysToEvent} dies).</p>
          <div style="background:#1e293b;padding:16px;border-radius:8px;margin:16px 0">
            <p style="margin:0 0 8px 0;font-weight:bold">Import pendent: ${formatCurrency(pendingAmount)}</p>
            <ul style="margin:0;padding-left:18px">${pendingItems.map((item) => `<li>${item}</li>`).join('')}</ul>
          </div>
          <p>Si ja has realitzat el pagament, ignora aquest missatge.</p>
          <p style="margin-top:16px;font-size:12px;color:#94a3b8">Gràcies per confiar en Òrbita Events.</p>
        </div>
      `;

      await sendEmail({
        to: booking.clientEmail,
        subject: `Recordatori de pagament — ${booking.reference || 'Reserva'}`,
        html,
      });

      // Registrar l'enviament
      await prisma.adminLog.create({
        data: {
          action: 'PAYMENT_REMINDER_SENT',
          entity: 'booking',
          entityId: booking.id,
          details: {
            pendingAmount,
            daysToEvent,
            clientEmail: booking.clientEmail,
          },
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
