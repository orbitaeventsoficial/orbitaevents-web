import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { runCommercialSequences } from '@/lib/services/commercialSequenceService';
import { enforceLeadSla } from '@/lib/services/slaAutomationService';
import { sendPaymentReminders } from '@/lib/services/paymentReminderService';
import { scoreLead } from '@/lib/services/commercialScoring';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { SITE_CONFIG } from '@/app/config/site-config';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';

const COMMERCIAL_SCORING_BATCH_SIZE = 50;

export async function runCommercialDailyAutomation() {
  const [sequences, sla, paymentReminders] = await Promise.all([
    runCommercialSequences(),
    enforceLeadSla(),
    sendPaymentReminders().catch((err) => {
      log.error('Payment reminders failed in commercial-daily', err);
      return { checked: 0, sent: 0, skipped: 0, errors: 1 };
    }),
  ]);

  let scoringUpdated = 0;
  try {
    const activeLeads = await prisma.lead.findMany({
      where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        eventDate: true,
        budget: true,
        phone: true,
        eventLocation: true,
        guestCount: true,
        interestedPackId: true,
        source: true,
      },
    });

    const scoredLeads = activeLeads.map((lead) => {
      const result = scoreLead(lead);
      return {
        id: lead.id,
        score: result.score,
        cachedScoreAt: new Date(),
      };
    });

    for (let index = 0; index < scoredLeads.length; index += COMMERCIAL_SCORING_BATCH_SIZE) {
      const batch = scoredLeads.slice(index, index + COMMERCIAL_SCORING_BATCH_SIZE);
      await prisma.$transaction(
        batch.map((lead) =>
          prisma.lead.update({
            where: { id: lead.id },
            data: { cachedScore: lead.score, cachedScoreAt: lead.cachedScoreAt },
          })
        )
      );
      scoringUpdated += batch.length;
    }
  } catch (err) {
    log.error('Scoring cache update failed', err);
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [commSent24h, commResponded24h, openLeads, openTasks] = await Promise.all([
    prisma.adminLog.count({ where: { action: 'COMM_SENT', createdAt: { gte: since24h } } }),
    prisma.adminLog.count({ where: { action: 'COMM_RESPONDED', createdAt: { gte: since24h } } }),
    prisma.lead.count({ where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } } }),
    prisma.task.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
  ]);

  const responseRate = commSent24h > 0 ? commResponded24h / commSent24h : 0;
  const summary = {
    generatedAt: new Date().toISOString(),
    sequences,
    sla,
    paymentReminders,
    scoringUpdated,
    kpi24h: {
      commSent: commSent24h,
      commResponded: commResponded24h,
      responseRate,
      openLeads,
      openTasks,
    },
  };

  const subject = `Resum diari comercial · ${new Date().toLocaleDateString('ca-ES')}`;
  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px">
      <h2 style="margin:0 0 12px 0;color:#f8fafc">Resum diari comercial</h2>
      <ul style="line-height:1.8;margin:0 0 18px 0;padding-left:18px">
        <li>Seqüències executades: <strong>${sequences.executed}</strong></li>
        <li>Enviaments email: <strong>${sequences.sentEmail}</strong></li>
        <li>Enviaments WhatsApp: <strong>${sequences.sentWhatsapp}</strong></li>
        <li>Leads esgotats (cadència completa): <strong>${sequences.exhausted}</strong></li>
        <li>Tasques SLA creades: <strong>${sla.createdTasks}</strong></li>
        <li>Recordatoris pagament: <strong>${paymentReminders.sent}</strong> enviats de ${paymentReminders.checked} revisats</li>
        <li>Comunicacions 24h: <strong>${commSent24h}</strong></li>
        <li>Respostes 24h: <strong>${commResponded24h}</strong> (${(responseRate * 100).toFixed(1)}%)</li>
        <li>Leads oberts: <strong>${openLeads}</strong></li>
        <li>Tasques obertes: <strong>${openTasks}</strong></li>
      </ul>
    </div>
  `;

  const recipient = (process.env.CONTACT_TO || SITE_CONFIG.business.email).trim();
  await sendEmail({ to: recipient, subject, html });

  const waTo = (process.env.ADMIN_WHATSAPP || SITE_CONFIG.business.phone).replace(/[^\d]/g, '');
  if (waTo) {
    const waText = [
      `📊 Resum comercial ${new Date().toLocaleDateString('ca-ES')}`,
      `Seqüències: ${sequences.executed} · Esgotats: ${sequences.exhausted}`,
      `Email: ${sequences.sentEmail} · WA: ${sequences.sentWhatsapp}`,
      `Tasques SLA: ${sla.createdTasks}`,
      `Pagaments: ${paymentReminders.sent}/${paymentReminders.checked} recordatoris`,
      `Comms 24h: ${commSent24h} · Resp: ${commResponded24h} (${(responseRate * 100).toFixed(1)}%)`,
      `Leads oberts: ${openLeads} · Tasques obertes: ${openTasks}`,
    ].join('\n');
    await sendWhatsAppText({ to: waTo, text: waText });
  }

  await prisma.adminLog.create({
    data: {
      action: 'AUTOMATION_DAILY_SUMMARY_SENT',
      entity: 'automation',
      entityId: 'commercial-daily',
      details: summary as unknown as Prisma.InputJsonValue,
    },
  });

  await saveCronRunStatus({ prefix: 'automation.commercial', status: 'ok', summary, category: 'config' });
  return summary;
}
