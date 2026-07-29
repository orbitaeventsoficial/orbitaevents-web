// lib/services/emailTrackingService.ts
// ═══════════════════════════════════════════════════════════════════════════
// EMAIL TRACKING SERVICE
// Registra emails enviats amb plantilla, detecta obertures (pixel) i
// respostes (cross-ref amb LeadActivity inbound). Calcula rendiment per
// plantilla per permetre optimització A/B basada en dades reals.
// Part pura + wrapper Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type EmailSendInput = {
  id: string;
  templateKey: string | null;
  leadId: string | null;
  sentAt: Date;
  openedAt: Date | null;
  openCount: number;
  clickedAt: Date | null;
  clickCount: number;
};

export type InboundReply = {
  leadId: string;
  repliedAt: Date;
};

export type TemplatePerformance = {
  templateKey: string;
  label: string;
  totalSent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
};

export type EmailTrackingReport = {
  generatedAt: string;
  windowDays: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  globalOpenRate: number;
  globalClickRate: number;
  globalReplyRate: number;
  byTemplate: TemplatePerformance[];
  bestPerformer: string | null;
  worstPerformer: string | null;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

const TEMPLATE_LABELS: Record<string, string> = {
  'primer-contacte': 'Primer contacte',
  'seguiment': 'Seguiment / Recordatori',
  'seguiment-pressupost': 'Seguiment pressupost',
  'confirmacio-data': 'Confirmació de data',
  'agraiment-post-event': 'Agraïment post-event',
  'reactivacio': 'Reactivació',
  booking_confirmation: 'Confirmació de reserva',
  'booking-communication': 'Comunicació de reserva',
  'payment-reminder': 'Recordatori de pagament',
  'post-event': 'Post-event',
  'booking-portal-access': 'Accés portal client',
  welcome: 'Benvinguda lead',
  'follow-up-1': 'Follow-up comercial 1',
  'follow-up-2': 'Follow-up comercial 2',
  'follow-up-3': 'Follow-up comercial 3',
  'follow-up-4': 'Follow-up comercial 4',
  'follow-up-last': 'Follow-up comercial final',
  'customer-review-request': 'Customer process: demanar opinió',
  'customer-post-event': 'Customer process: post-event',
  'customer-welcome': 'Customer process: benvinguda',
  'customer-promo': 'Customer process: promoció',
  'public-booking-request': 'Sol·licitud pública de reserva',
  'privacy-verification': 'Privacitat: verificació',
  'privacy-request-completed': 'Privacitat: resolució',
  'testimonial-approved': 'Testimoni aprovat',
  'testimonial-received': 'Testimoni rebut',
  'testimonial-admin-notification': 'Testimoni: avís admin',
  'testimonials-reminder': 'Testimonis: recordatori admin',
  'booking-admin-notification': 'Reserva pública: avís admin',
  'public-contact-admin-notification': 'Contacte web: avís admin',
  'public-contact-client-confirmation': 'Contacte web: confirmació client',
  'admin-test-notification': 'Admin: prova notificació',
  'commercial-daily-summary': 'Admin: resum comercial diari',
  'executive-report': 'Admin: informe executiu',
  'lead-technical-snapshot': 'Lead: instantània tècnica',
  'new-lead-admin-notification': 'Lead nou: avís admin',
  'urgent-follow-up-alert': 'Admin: alerta seguiment urgent',
  'weekly-benchmark': 'Admin: benchmark setmanal',
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Matches inbound replies to sent emails.
 * For each send with a leadId, checks if there's a reply from that lead
 * after the email was sent.
 */
function matchReplies(
  sends: EmailSendInput[],
  replies: InboundReply[]
): Map<string, Date> {
  const matched = new Map<string, Date>();
  const repliesByLead = new Map<string, Date[]>();

  for (const r of replies) {
    const existing = repliesByLead.get(r.leadId) || [];
    existing.push(r.repliedAt);
    repliesByLead.set(r.leadId, existing);
  }

  for (const send of sends) {
    if (!send.leadId) continue;
    const leadReplies = repliesByLead.get(send.leadId);
    if (!leadReplies) continue;

    // Find the first reply after sentAt
    const replyAfterSend = leadReplies.find((r) => r > send.sentAt);
    if (replyAfterSend) {
      matched.set(send.id, replyAfterSend);
    }
  }

  return matched;
}

export function computeTemplatePerformance(
  sends: EmailSendInput[],
  replies: InboundReply[]
): TemplatePerformance[] {
  const replyMap = matchReplies(sends, replies);

  // Group by templateKey
  const groups = new Map<string, { sent: number; opened: number; clicked: number; replied: number }>();

  for (const send of sends) {
    const key = send.templateKey || '_manual';
    const existing = groups.get(key) || { sent: 0, opened: 0, clicked: 0, replied: 0 };
    existing.sent++;
    if (send.openedAt) existing.opened++;
    if (send.clickedAt) existing.clicked++;
    if (replyMap.has(send.id)) existing.replied++;
    groups.set(key, existing);
  }

  const results: TemplatePerformance[] = [];
  for (const [key, stats] of groups) {
    results.push({
      templateKey: key,
      label: TEMPLATE_LABELS[key] || (key === '_manual' ? 'Enviat manualment' : key),
      totalSent: stats.sent,
      opened: stats.opened,
      clicked: stats.clicked,
      replied: stats.replied,
      openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
      clickRate: stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0,
      replyRate: stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0,
    });
  }

  // Sort by totalSent desc
  results.sort((a, b) => b.totalSent - a.totalSent);
  return results;
}

export function generateEmailTrackingReport(
  sends: EmailSendInput[],
  replies: InboundReply[],
  windowDays: number,
  now: Date = new Date()
): EmailTrackingReport {
  const byTemplate = computeTemplatePerformance(sends, replies);

  const totalSent = sends.length;
  const totalOpened = sends.filter((s) => s.openedAt).length;
  const totalClicked = sends.filter((s) => s.clickedAt).length;
  const replyMap = matchReplies(sends, replies);
  const totalReplied = replyMap.size;

  // Best/worst performer: entre plantilles amb ≥3 enviaments, ordena per replyRate
  const eligible = byTemplate.filter((t) => t.totalSent >= 3 && t.templateKey !== '_manual');
  const sorted = [...eligible].sort((a, b) => b.replyRate - a.replyRate || b.openRate - a.openRate);
  const bestPerformer = sorted.length > 0 ? sorted[0].templateKey : null;
  const worstPerformer = sorted.length > 1 ? sorted[sorted.length - 1].templateKey : null;

  return {
    generatedAt: now.toISOString(),
    windowDays,
    totalSent,
    totalOpened,
    totalClicked,
    totalReplied,
    globalOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
    globalClickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    globalReplyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0,
    byTemplate,
    bestPerformer,
    worstPerformer,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// TRACKING PIXEL — 1x1 transparent GIF
// ───────────────────────────────────────────────────────────────────────────

// Smallest valid 1x1 transparent GIF (43 bytes)
export const TRACKING_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER — operacions amb Prisma
// ───────────────────────────────────────────────────────────────────────────

export async function recordEmailSend(params: {
  templateKey?: string | null;
  to: string;
  subject: string;
  leadId?: string | null;
  customerId?: string | null;
  locale?: string | null;
  htmlBody?: string | null;
  /** Vincle Òrbita (kind/id/origin) per a auditoria del canal. */
  orbitaKind?: string | null;
  orbitaId?: string | null;
  orbitaOrigin?: string | null;
}): Promise<{ id: string; trackingToken: string }> {
  const record = await prisma.emailSend.create({
    data: {
      templateKey: params.templateKey || null,
      to: params.to,
      subject: params.subject,
      leadId: params.leadId || null,
      customerId: params.customerId || null,
      locale: params.locale || null,
      htmlBody: params.htmlBody || null,
      orbitaKind: params.orbitaKind || null,
      orbitaId: params.orbitaId || null,
      orbitaOrigin: params.orbitaOrigin || null,
    },
    select: { id: true, trackingToken: true },
  });
  return record;
}

/**
 * Actualitza l'EmailSend amb el resultat real del canal (SMTP + APPEND a Sent).
 * Es crida DESPRÉS de `sendEmail()` perquè la BD reflecteixi l'estat observable
 * sense bloquejar l'enviament. Si no es crida (cas legacy), els camps queden
 * NULL i la UI sap que no hi ha traça observable.
 */
export async function updateEmailSendResult(id: string, result: {
  smtpAccepted: string[];
  smtpRejected: string[];
  smtpResponse: string;
  smtpMessageId: string;
  imapAppendOk: boolean | null;
  imapSentFolder: string | null;
  imapSentUid: number | null;
  imapError: string | null;
}): Promise<void> {
  try {
    await prisma.emailSend.update({
      where: { id },
      data: {
        smtpAccepted: result.smtpAccepted,
        smtpRejected: result.smtpRejected,
        smtpResponse: result.smtpResponse || null,
        smtpMessageId: result.smtpMessageId || null,
        imapAppendOk: result.imapAppendOk,
        imapSentFolder: result.imapSentFolder,
        imapSentUid: result.imapSentUid,
        imapError: result.imapError,
      },
    });
  } catch (error) {
    // Tracking no ha de bloquejar res. Log silenciós.
    console.error('[emailTracking] updateEmailSendResult fallit:', error);
  }
}

export async function loadSentEmail(idOrToken: string) {
  const trimmed = idOrToken.trim();
  if (!trimmed) return null;
  return prisma.emailSend.findFirst({
    where: { OR: [{ id: trimmed }, { trackingToken: trimmed }] },
    select: {
      id: true,
      trackingToken: true,
      templateKey: true,
      to: true,
      subject: true,
      htmlBody: true,
      leadId: true,
      customerId: true,
      locale: true,
      sentAt: true,
      openedAt: true,
      openCount: true,
      clickedAt: true,
      clickCount: true,
    },
  });
}

export async function recordEmailClick(trackingToken: string): Promise<boolean> {
  try {
    const record = await prisma.emailSend.findUnique({
      where: { trackingToken },
      select: { id: true, clickedAt: true, clickCount: true },
    });

    if (!record) return false;

    await prisma.emailSend.update({
      where: { trackingToken },
      data: {
        clickedAt: record.clickedAt || new Date(),
        clickCount: record.clickCount + 1,
      },
    });

    return true;
  } catch (error) {
    console.error('[emailTracking] Error recording click:', error);
    return false;
  }
}

/**
 * Wraps all <a href="..."> links in HTML with a tracking redirect.
 * Preserves mailto:, tel:, and anchor (#) links.
 */
export function wrapLinksForTracking(html: string, trackingToken: string, baseUrl: string): string {
  return html.replace(
    /<a\s([^>]*?)href="(https?:\/\/[^"]+)"([^>]*?)>/gi,
    (_match, pre, url, post) => {
      const encodedUrl = encodeURIComponent(url);
      const trackingUrl = `${baseUrl}/api/tracking/click/${trackingToken}?url=${encodedUrl}`;
      return `<a ${pre}href="${trackingUrl}"${post}>`;
    }
  );
}

export async function recordEmailOpen(trackingToken: string): Promise<boolean> {
  try {
    const record = await prisma.emailSend.findUnique({
      where: { trackingToken },
      select: { id: true, openedAt: true, openCount: true },
    });

    if (!record) return false;

    await prisma.emailSend.update({
      where: { trackingToken },
      data: {
        openedAt: record.openedAt || new Date(),
        openCount: record.openCount + 1,
      },
    });

    return true;
  } catch (error) {
    console.error('[emailTracking] Error recording open:', error);
    return false;
  }
}

export async function loadEmailTrackingReport(
  windowDays = 90,
  now: Date = new Date()
): Promise<EmailTrackingReport> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const [sends, inboundActivities] = await Promise.all([
    prisma.emailSend.findMany({
      where: { sentAt: { gte: since } },
      select: {
        id: true,
        templateKey: true,
        leadId: true,
        sentAt: true,
        openedAt: true,
        openCount: true,
        clickedAt: true,
        clickCount: true,
      },
      orderBy: { sentAt: 'desc' },
    }),
    prisma.leadActivity.findMany({
      where: {
        type: 'EMAIL',
        createdAt: { gte: since },
      },
      select: {
        leadId: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Filter inbound replies
  const replies: InboundReply[] = inboundActivities
    .filter((a) => {
      const meta = a.metadata as Record<string, unknown> | null;
      return meta?.direction === 'inbound';
    })
    .map((a) => ({
      leadId: a.leadId,
      repliedAt: a.createdAt,
    }));

  return generateEmailTrackingReport(sends, replies, windowDays, now);
}
