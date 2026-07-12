import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { COMMERCIAL_SEQUENCE_STEP_COPY } from '@/lib/constants';
import { deriveLeadResponseState } from '@/lib/services/responseTrackingService';
import { recordLeadCommercialSequenceStepSent } from '@/lib/services/leadActivityService';
import { log } from '@/lib/logger';
import { getAppBaseUrl } from '@/lib/site';
import {
  recordEmailSend,
  updateEmailSendResult,
  wrapLinksForTracking,
} from '@/lib/services/emailTrackingService';

export type SequenceRunSummary = {
  generatedAt: string;
  scanned: number;
  matched: number;
  executed: number;
  sentEmail: number;
  sentWhatsapp: number;
  skippedNoChannel: number;
  skippedNotReady: number;
  exhausted: number;
  errors: number;
};

import type { Locale } from '@/i18n';

type NurturingStepDef = {
  step: number;
  delayHours: number;
  channel: 'EMAIL';
  templateSlug: string;
};

type LeadSequenceCandidate = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  eventType: string | null;
  status: string;
  preferredLocale: string | null;
  createdAt: Date;
  nurturingStep: number;
  lastNurturingAt: Date | null;
  nurturingDone?: boolean;
  activities: { createdAt: Date; metadata: unknown }[];
};

export type ManualSequenceRunResult =
  | {
      ok: true;
      leadId: string;
      channel: 'email' | 'whatsapp';
      step: number;
      totalSteps: number;
      templateSlug: string;
      locale: Locale;
      nurturingStep: number;
      nurturingDone: boolean;
    }
  | {
      ok: false;
      status: 400 | 404 | 409;
      error: string;
    };

export const DEFAULT_NURTURING_CADENCE: NurturingStepDef[] = [
  { step: 1, delayHours: 24, channel: 'EMAIL', templateSlug: 'follow-up-1' },
  { step: 2, delayHours: 72, channel: 'EMAIL', templateSlug: 'follow-up-2' },
  { step: 3, delayHours: 168, channel: 'EMAIL', templateSlug: 'follow-up-3' },
  { step: 4, delayHours: 336, channel: 'EMAIL', templateSlug: 'follow-up-4' },
  { step: 5, delayHours: 720, channel: 'EMAIL', templateSlug: 'follow-up-last' },
];

function normalizeLocale(value?: string | null): Locale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ca')) return 'ca';
  return 'es';
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function safePhone(input?: string | null): string | null {
  if (!input) return null;
  const normalized = input.replace(/[^\d]/g, '');
  return normalized || null;
}

const COMMERCIAL_SEQUENCE_ORBITA_ORIGIN = 'commercial-sequence';

function buildTrackedCommercialSequenceHtml(html: string, trackingToken: string, baseUrl: string): string {
  const trackedHtml = wrapLinksForTracking(html, trackingToken, baseUrl);
  const pixel = `<img src="${baseUrl}/api/tracking/open/${trackingToken}" width="1" height="1" alt="" style="display:none" />`;
  if (/<\/body>/i.test(trackedHtml)) {
    return trackedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return `${trackedHtml}${pixel}`;
}

function isReadyForNextStep(
  lead: { createdAt: Date; lastNurturingAt: Date | null; nurturingStep: number },
  nextStepDef: NurturingStepDef,
): boolean {
  const referenceDate = lead.nurturingStep === 0
    ? lead.createdAt
    : lead.lastNurturingAt ?? lead.createdAt;

  return referenceDate <= hoursAgo(nextStepDef.delayHours);
}

async function executeSequenceStepForLead(
  lead: LeadSequenceCandidate,
  nextStepDef: NurturingStepDef,
  options?: { manual?: boolean; forcedStepNumber?: number },
): Promise<
  | {
      ok: true;
      channel: 'email' | 'whatsapp';
      locale: Locale;
      templateSlug: string;
      newStep: number;
      isLastStep: boolean;
    }
  | {
      ok: false;
      reason: 'no-channel' | 'send-failed';
    }
> {
  const maxStep = DEFAULT_NURTURING_CADENCE.length;
  const locale = normalizeLocale(lead.preferredLocale);
  const templateSlug = nextStepDef.templateSlug;
  const copy = COMMERCIAL_SEQUENCE_STEP_COPY[locale][templateSlug];
  if (!copy) {
    log.error(`Còpia no trobada per slug=${templateSlug} locale=${locale}`, null);
    return { ok: false, reason: 'send-failed' };
  }

  const firstName = lead.name.split(' ')[0] || lead.name;
  const subject = copy.subject(lead.eventType || 'Event');
  const text = copy.text(firstName);
  const phone = safePhone(lead.phone);
  let channelUsed: 'email' | 'whatsapp' | null = null;
  let emailSendId: string | null = null;

  try {
    if (phone) {
      const wa = await sendWhatsAppText({ to: phone, text });
      if (wa.ok) {
        channelUsed = 'whatsapp';
      }
    }

    if (!channelUsed && lead.email) {
      const html = `<p>${text}</p>`;
      const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
      const orbita = { kind: 'lead' as const, id: lead.id, origin: COMMERCIAL_SEQUENCE_ORBITA_ORIGIN };
      const trackingRecord = await recordEmailSend({
        templateKey: templateSlug,
        to: lead.email,
        subject,
        leadId: lead.id,
        customerId: null,
        locale,
        htmlBody: html,
        orbitaKind: orbita.kind,
        orbitaId: orbita.id,
        orbitaOrigin: orbita.origin,
      });
      const sendResult = await sendEmail({
        to: lead.email,
        subject,
        html: buildTrackedCommercialSequenceHtml(html, trackingRecord.trackingToken, baseUrl),
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
      emailSendId = trackingRecord.id;
      channelUsed = 'email';
    }

    if (!channelUsed) {
      return { ok: false, reason: 'no-channel' };
    }

    const newStep = Math.max(lead.nurturingStep + 1, options?.forcedStepNumber ?? nextStepDef.step);
    const isLastStep = newStep >= maxStep;

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        nurturingStep: newStep,
        lastNurturingAt: new Date(),
        nurturingDone: isLastStep,
      },
    });

    await recordLeadCommercialSequenceStepSent({
      leadId: lead.id,
      channel: channelUsed,
      activityTitle: copy.activity,
      step: nextStepDef.step,
      totalSteps: maxStep,
      templateSlug,
      locale,
      delayHours: nextStepDef.delayHours,
      emailSendId,
    });

    await prisma.adminLog.create({
      data: {
        action: 'COMM_SEQUENCE_EXEC',
        entity: 'lead',
        entityId: lead.id,
        details: {
          step: nextStepDef.step,
          totalSteps: maxStep,
          templateSlug,
          channel: channelUsed,
          locale,
          manual: options?.manual ?? false,
          ...(emailSendId ? {
            emailSendId,
            emailSnapshot: 'EmailSend.htmlBody',
            orbitaKind: 'lead',
            orbitaId: lead.id,
            orbitaOrigin: COMMERCIAL_SEQUENCE_ORBITA_ORIGIN,
          } : {}),
        },
      },
    });

    return {
      ok: true,
      channel: channelUsed,
      locale,
      templateSlug,
      newStep,
      isLastStep,
    };
  } catch (error) {
    log.error('runCommercialSequences error al lead', error, {
      context: { leadId: lead.id, step: nextStepDef.step, templateSlug, manual: options?.manual ?? false },
    });
    return { ok: false, reason: 'send-failed' };
  }
}

export async function runCommercialSequences(): Promise<SequenceRunSummary> {
  const cadence = DEFAULT_NURTURING_CADENCE;
  const maxStep = cadence.length;

  const candidates = await prisma.lead.findMany({
    where: {
      status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
      nurturingDone: false,
      nurturingStep: { lt: maxStep },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      status: true,
      preferredLocale: true,
      createdAt: true,
      nurturingStep: true,
      lastNurturingAt: true,
      activities: {
        where: { type: { in: ['EMAIL', 'WHATSAPP'] } },
        select: { createdAt: true, metadata: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    take: 500,
  });

  const summary: SequenceRunSummary = {
    generatedAt: new Date().toISOString(),
    scanned: candidates.length,
    matched: 0,
    executed: 0,
    sentEmail: 0,
    sentWhatsapp: 0,
    skippedNoChannel: 0,
    skippedNotReady: 0,
    exhausted: 0,
    errors: 0,
  };

  for (const lead of candidates) {
    const nextStepDef = cadence[lead.nurturingStep];
    if (!nextStepDef) continue;

    const responseState = deriveLeadResponseState(lead.activities, lead.createdAt);
    if (responseState.lastInboundAt && responseState.lastOutboundAt && responseState.lastInboundAt > responseState.lastOutboundAt) {
      summary.skippedNotReady += 1;
      continue;
    }

    if (!isReadyForNextStep(lead, nextStepDef)) {
      summary.skippedNotReady += 1;
      continue;
    }

    summary.matched += 1;
    const execution = await executeSequenceStepForLead(lead, nextStepDef);
    if (!execution.ok) {
      if (execution.reason === 'no-channel') {
        summary.skippedNoChannel += 1;
      } else {
        summary.errors += 1;
      }
      continue;
    }

    summary.executed += 1;
    if (execution.channel === 'whatsapp') {
      summary.sentWhatsapp += 1;
    } else {
      summary.sentEmail += 1;
    }
    if (execution.isLastStep) {
      summary.exhausted += 1;
    }
  }

  return summary;
}

export async function runCommercialSequenceForLead(
  leadId: string,
  options?: { step?: number },
): Promise<ManualSequenceRunResult> {
  const cadence = DEFAULT_NURTURING_CADENCE;
  const maxStep = cadence.length;
  const requestedStep = options?.step ?? null;

  if (requestedStep !== null && (!Number.isInteger(requestedStep) || requestedStep < 1 || requestedStep > maxStep)) {
    return { ok: false, status: 400, error: 'Pas de seqüència invàlid' };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      status: true,
      preferredLocale: true,
      createdAt: true,
      nurturingStep: true,
      lastNurturingAt: true,
      nurturingDone: true,
      activities: {
        where: { type: { in: ['EMAIL', 'WHATSAPP'] } },
        select: { createdAt: true, metadata: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!lead) {
    return { ok: false, status: 404, error: 'Lead no trobat' };
  }

  if (!['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'].includes(lead.status)) {
    return { ok: false, status: 409, error: 'La seqüència manual només es pot executar sobre leads actius' };
  }

  const targetStep = requestedStep ?? Math.min(lead.nurturingStep + 1, maxStep);
  const nextStepDef = cadence[targetStep - 1];
  if (!nextStepDef) {
    return { ok: false, status: 400, error: 'Pas de seqüència no disponible' };
  }

  const execution = await executeSequenceStepForLead(lead, nextStepDef, {
    manual: true,
    forcedStepNumber: targetStep,
  });

  if (!execution.ok) {
    if (execution.reason === 'no-channel') {
      return { ok: false, status: 409, error: 'El lead no té cap canal disponible per enviar la seqüència' };
    }
    return { ok: false, status: 409, error: 'No s’ha pogut executar la seqüència manual' };
  }

  return {
    ok: true,
    leadId: lead.id,
    channel: execution.channel,
    step: targetStep,
    totalSteps: maxStep,
    templateSlug: execution.templateSlug,
    locale: execution.locale,
    nurturingStep: execution.newStep,
    nurturingDone: execution.isLastStep,
  };
}
