// lib/services/urgentFollowUpAlertService.ts
// ═══════════════════════════════════════════════════════════════════════════
// URGENT FOLLOW-UP ALERT SERVICE
// Detecta follow-ups URGENT (≥5 dies sense resposta) i envia alertes
// immediates per email + WhatsApp, evitant duplicats dins d'una finestra.
// Part pura + wrapper Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { SITE_CONFIG } from '@/app/config/site-config';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import {
  type PendingFollowUp,
  type ResponseTrackingInput,
  deriveLeadResponseState,
  detectPendingFollowUps,
} from '@/lib/services/responseTrackingService';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type UrgentAlertResult = {
  generatedAt: string;
  urgentDetected: number;
  newAlerts: number;
  alreadyAlerted: number;
  emailSent: boolean;
  whatsappSent: boolean;
  items: Array<{
    leadId: string;
    name: string;
    daysSinceOutbound: number;
  }>;
};

export type UrgentAlertFilterInput = {
  followUps: PendingFollowUp[];
  alertedLeadIds: Set<string>;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

/** Finestra de supressió: no repetir alerta per un lead dins de 24h */
const ALERT_SUPPRESSION_HOURS = 24;

const ALERT_SETTING_PREFIX = 'alerts.urgentFollowUp.lastAlerted';

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function filterNewUrgentAlerts(input: UrgentAlertFilterInput): PendingFollowUp[] {
  return input.followUps
    .filter((f) => f.urgency === 'URGENT')
    .filter((f) => !input.alertedLeadIds.has(f.leadId));
}

export function buildUrgentAlertEmail(items: PendingFollowUp[]): { subject: string; html: string } {
  const subject = `🚨 ${items.length} follow-up${items.length > 1 ? 's' : ''} urgent${items.length > 1 ? 's' : ''} sense resposta`;

  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.08)">
            <strong>${item.name}</strong>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.08)">
            ${item.eventType || '—'}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.08);color:#fca5a5">
            ${item.daysSinceOutbound} dies
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.08)">
            ${item.suggestedAction}
          </td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px">
      <h2 style="margin:0 0 6px 0;color:#fca5a5">🚨 Follow-ups urgents</h2>
      <p style="margin:0 0 18px 0;color:#94a3b8">
        ${items.length} lead${items.length > 1 ? 's' : ''} porta${items.length > 1 ? 'en' : ''} ≥5 dies sense resposta després de contacte sortint.
      </p>
      <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px">
        <thead>
          <tr style="text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">
            <th style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15)">Lead</th>
            <th style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15)">Tipus</th>
            <th style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15)">Dies</th>
            <th style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15)">Acció</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:18px 0 0 0;color:#64748b;font-size:12px">
        Alerta generada automàticament · no es repetirà per aquests leads en les properes ${ALERT_SUPPRESSION_HOURS}h
      </p>
    </div>
  `;

  return { subject, html };
}

export function buildUrgentAlertWhatsApp(items: PendingFollowUp[]): string {
  const lines = [
    `🚨 ${items.length} follow-up${items.length > 1 ? 's' : ''} urgent${items.length > 1 ? 's' : ''}`,
    '',
  ];

  for (const item of items) {
    lines.push(
      `• ${item.name} (${item.eventType || '—'}) — ${item.daysSinceOutbound}d sense resposta`
    );
  }

  lines.push('', 'Acció recomanada: trucar o enviar WhatsApp directe');

  return lines.join('\n');
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER — carrega dades, filtra duplicats, envia alertes
// ───────────────────────────────────────────────────────────────────────────

export async function runUrgentFollowUpAlerts(
  now: Date = new Date()
): Promise<UrgentAlertResult> {
  // 1. Carregar follow-ups pendents via responseTrackingService
  const leads = await prisma.lead.findMany({
    where: {
      status: { in: ['CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
      contactedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      status: true,
      preferredLocale: true,
      contactedAt: true,
      activities: {
        where: { type: { in: ['EMAIL', 'WHATSAPP'] } },
        select: { type: true, createdAt: true, metadata: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { contactedAt: 'desc' },
    take: 200,
  });

  const input: ResponseTrackingInput = {
    leads: leads.map((lead) => {
      const state = deriveLeadResponseState(lead.activities, lead.contactedAt);
      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        eventType: lead.eventType,
        status: lead.status,
        preferredLocale: lead.preferredLocale,
        contactedAt: lead.contactedAt,
        lastOutboundAt: state.lastOutboundAt,
        outboundCount: state.outboundCount,
        lastInboundAt: state.lastInboundAt,
      };
    }),
    now,
  };

  const allFollowUps = detectPendingFollowUps(input);
  const urgentFollowUps = allFollowUps.items.filter((f) => f.urgency === 'URGENT');

  if (urgentFollowUps.length === 0) {
    return {
      generatedAt: now.toISOString(),
      urgentDetected: 0,
      newAlerts: 0,
      alreadyAlerted: 0,
      emailSent: false,
      whatsappSent: false,
      items: [],
    };
  }

  // 2. Carregar alertes ja enviades (supressió 24h)
  const suppressionThreshold = new Date(now.getTime() - ALERT_SUPPRESSION_HOURS * 60 * 60 * 1000);

  const recentAlertSettings = await prisma.setting.findMany({
    where: {
      key: { startsWith: ALERT_SETTING_PREFIX },
    },
    select: { key: true, value: true },
  });

  const alertedLeadIds = new Set<string>();
  for (const setting of recentAlertSettings) {
    const alertedAt = new Date(setting.value);
    if (alertedAt > suppressionThreshold) {
      const leadId = setting.key.replace(`${ALERT_SETTING_PREFIX}.`, '');
      alertedLeadIds.add(leadId);
    }
  }

  // 3. Filtrar nous (part pura)
  const newAlerts = filterNewUrgentAlerts({
    followUps: urgentFollowUps,
    alertedLeadIds,
  });

  if (newAlerts.length === 0) {
    return {
      generatedAt: now.toISOString(),
      urgentDetected: urgentFollowUps.length,
      newAlerts: 0,
      alreadyAlerted: urgentFollowUps.length,
      emailSent: false,
      whatsappSent: false,
      items: [],
    };
  }

  // 4. Enviar alertes
  let emailSent = false;
  let whatsappSent = false;

  try {
    const { subject, html } = buildUrgentAlertEmail(newAlerts);
    const recipient = (process.env.CONTACT_TO || SITE_CONFIG.business.email).trim();
    await sendEmail({ to: recipient, subject, html });
    emailSent = true;
  } catch (err) {
    log.error('Urgent follow-up alert email failed', err);
  }

  try {
    const waTo = (process.env.ADMIN_WHATSAPP || SITE_CONFIG.business.phone).replace(/[^\d]/g, '');
    if (waTo) {
      const text = buildUrgentAlertWhatsApp(newAlerts);
      await sendWhatsAppText({ to: waTo, text });
      whatsappSent = true;
    }
  } catch (err) {
    log.error('Urgent follow-up alert WhatsApp failed', err);
  }

  // 5. Registrar supressió per evitar duplicats
  for (const alert of newAlerts) {
    await prisma.setting.upsert({
      where: { key: `${ALERT_SETTING_PREFIX}.${alert.leadId}` },
      update: { value: now.toISOString() },
      create: {
        key: `${ALERT_SETTING_PREFIX}.${alert.leadId}`,
        value: now.toISOString(),
        type: 'STRING',
        category: 'alerts',
      },
    });
  }

  // 6. AdminLog
  await prisma.adminLog.create({
    data: {
      action: 'URGENT_FOLLOWUP_ALERT_SENT',
      entity: 'automation',
      entityId: 'urgent-followup-alerts',
      details: {
        urgentDetected: urgentFollowUps.length,
        newAlerts: newAlerts.length,
        leads: newAlerts.map((a) => ({ id: a.leadId, name: a.name, days: a.daysSinceOutbound })),
      },
    },
  });

  return {
    generatedAt: now.toISOString(),
    urgentDetected: urgentFollowUps.length,
    newAlerts: newAlerts.length,
    alreadyAlerted: urgentFollowUps.length - newAlerts.length,
    emailSent,
    whatsappSent,
    items: newAlerts.map((a) => ({
      leadId: a.leadId,
      name: a.name,
      daysSinceOutbound: a.daysSinceOutbound,
    })),
  };
}
