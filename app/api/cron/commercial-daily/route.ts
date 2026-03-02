import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { runCommercialSequences } from '@/lib/services/commercialSequenceService';
import { enforceLeadSla } from '@/lib/services/slaAutomationService';
import { sendPaymentReminders } from '@/lib/services/paymentReminderService';
import { scoreLead } from '@/lib/services/commercialScoring';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { SITE_CONFIG } from '@/app/config/site-config';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurado para commercial-daily', undefined, {
      context: { requestId, endpoint: 'cron/commercial-daily:isAuthorized' },
    });
    return false;
  }
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

async function saveRunStatus(status: 'ok' | 'error', summary: unknown, message?: string) {
  const now = new Date().toISOString();
  await prisma.setting.upsert({
    where: { key: 'automation.commercial.lastRun' },
    update: { value: now, type: 'STRING', category: 'config' },
    create: { key: 'automation.commercial.lastRun', value: now, type: 'STRING', category: 'config' },
  });
  await prisma.setting.upsert({
    where: { key: 'automation.commercial.lastStatus' },
    update: { value: status, type: 'STRING', category: 'config' },
    create: { key: 'automation.commercial.lastStatus', value: status, type: 'STRING', category: 'config' },
  });
  await prisma.setting.upsert({
    where: { key: 'automation.commercial.lastSummary' },
    update: { value: JSON.stringify(summary), type: 'JSON', category: 'config' },
    create: { key: 'automation.commercial.lastSummary', value: JSON.stringify(summary), type: 'JSON', category: 'config' },
  });
  if (message) {
    await prisma.setting.upsert({
      where: { key: 'automation.commercial.lastMessage' },
      update: { value: message, type: 'STRING', category: 'config' },
      create: { key: 'automation.commercial.lastMessage', value: message, type: 'STRING', category: 'config' },
    });
  }
}

async function countOpenTasksUniversalOrLegacy() {
  try {
    const prismaAny = prisma as any;
    return await prismaAny.task.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });
  } catch {
    return prisma.leadTask.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });
  }
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!isAuthorized(request, requestId)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [sequences, sla, paymentReminders] = await Promise.all([
      runCommercialSequences(),
      enforceLeadSla(),
      sendPaymentReminders().catch((err) => {
        log.error('Payment reminders failed in commercial-daily', err);
        return { checked: 0, sent: 0, skipped: 0, errors: 1 };
      }),
    ]);

    // Actualitzar cache de scoring per a tots els leads actius
    let scoringUpdated = 0;
    try {
      const activeLeads = await prisma.lead.findMany({
        where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
        select: {
          id: true, status: true, createdAt: true, updatedAt: true,
          eventDate: true, budget: true, phone: true, eventLocation: true,
          guestCount: true, interestedPackId: true, source: true,
        },
      });

      for (const lead of activeLeads) {
        const result = scoreLead(lead);
        // cachedScore/cachedScoreAt afegits a schema — cal prisma generate post-migració
        await (prisma.lead.update as Function)({
          where: { id: lead.id },
          data: { cachedScore: result.score, cachedScoreAt: new Date() },
        });
        scoringUpdated++;
      }
    } catch (err) {
      log.error('Scoring cache update failed', err);
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [commSent24h, commResponded24h, openLeads, openTasks] = await Promise.all([
      prisma.adminLog.count({
        where: { action: 'COMM_SENT', createdAt: { gte: since24h } },
      }),
      prisma.adminLog.count({
        where: { action: 'COMM_RESPONDED', createdAt: { gte: since24h } },
      }),
      prisma.lead.count({
        where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
      }),
      countOpenTasksUniversalOrLegacy(),
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

    const subject = `Resumen diario comercial · ${new Date().toLocaleDateString('es-ES')}`;
    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px">
        <h2 style="margin:0 0 12px 0;color:#f8fafc">Resumen diario comercial</h2>
        <ul style="line-height:1.8;margin:0 0 18px 0;padding-left:18px">
          <li>Secuencias ejecutadas: <strong>${sequences.executed}</strong></li>
          <li>Envíos email: <strong>${sequences.sentEmail}</strong></li>
          <li>Envíos WhatsApp: <strong>${sequences.sentWhatsapp}</strong></li>
          <li>Tareas SLA creadas: <strong>${sla.createdTasks}</strong></li>
          <li>Recordatoris pagament: <strong>${paymentReminders.sent}</strong> enviats de ${paymentReminders.checked} revisats</li>
          <li>Comunicaciones 24h: <strong>${commSent24h}</strong></li>
          <li>Respondidas 24h: <strong>${commResponded24h}</strong> (${(responseRate * 100).toFixed(1)}%)</li>
          <li>Leads abiertos: <strong>${openLeads}</strong></li>
          <li>Tareas abiertas: <strong>${openTasks}</strong></li>
        </ul>
      </div>
    `;

    const recipient = (process.env.CONTACT_TO || SITE_CONFIG.business.email).trim();
    await sendEmail({
      to: recipient,
      subject,
      html,
    });

    const waTo = (process.env.ADMIN_WHATSAPP || SITE_CONFIG.business.phone).replace(/[^\d]/g, '');
    if (waTo) {
      const waText = [
        `📊 Resumen comercial ${new Date().toLocaleDateString('es-ES')}`,
        `Secuencias: ${sequences.executed}`,
        `Email: ${sequences.sentEmail} · WA: ${sequences.sentWhatsapp}`,
        `SLA tasks: ${sla.createdTasks}`,
        `Pagaments: ${paymentReminders.sent}/${paymentReminders.checked} recordatoris`,
        `Comms 24h: ${commSent24h} · Resp: ${commResponded24h} (${(responseRate * 100).toFixed(1)}%)`,
        `Open leads: ${openLeads} · Open tasks: ${openTasks}`,
      ].join('\n');
      await sendWhatsAppText({ to: waTo, text: waText });
    }

    await prisma.adminLog.create({
      data: {
        action: 'AUTOMATION_DAILY_SUMMARY_SENT',
        entity: 'automation',
        entityId: 'commercial-daily',
        details: JSON.parse(JSON.stringify(summary)),
      },
    });

    await saveRunStatus('ok', summary);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('commercial-daily cron failed', error, {
      context: { requestId, endpoint: 'cron/commercial-daily:GET' },
    });
    await saveRunStatus('error', {}, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ ok: false, error: 'Cron commercial-daily failed' }, { status: 500 });
  }
}
