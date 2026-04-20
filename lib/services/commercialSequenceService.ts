import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { COMMERCIAL_SEQUENCE_STEP_COPY } from '@/lib/constants';
import { deriveLeadResponseState } from '@/lib/services/responseTrackingService';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Tipus
// ---------------------------------------------------------------------------

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

type Locale = 'ca' | 'es' | 'en';

type NurturingStepDef = {
  step: number;
  /** Hores des de la creació del lead (pas 1) o des de l'últim nurturing (pas 2+) */
  delayHours: number;
  channel: 'EMAIL';
  templateSlug: string;
};

// ---------------------------------------------------------------------------
// Cadència configurable — es pot canviar aquí sense tocar la BD
// ---------------------------------------------------------------------------

export const DEFAULT_NURTURING_CADENCE: NurturingStepDef[] = [
  { step: 1, delayHours: 24,  channel: 'EMAIL', templateSlug: 'follow-up-1' },
  { step: 2, delayHours: 72,  channel: 'EMAIL', templateSlug: 'follow-up-2' },    // 3 dies
  { step: 3, delayHours: 168, channel: 'EMAIL', templateSlug: 'follow-up-3' },    // 7 dies
  { step: 4, delayHours: 336, channel: 'EMAIL', templateSlug: 'follow-up-4' },    // 14 dies
  { step: 5, delayHours: 720, channel: 'EMAIL', templateSlug: 'follow-up-last' }, // 30 dies — últim intent
];

// ---------------------------------------------------------------------------
// Còpies per a cada pas × idioma
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/**
 * Determina si el lead està a punt per rebre el següent pas de la cadència.
 * - Pas 1: delayHours des de creació del lead
 * - Pas 2+: delayHours des de l'últim nurturing enviat
 */
function isReadyForNextStep(
  lead: { createdAt: Date; lastNurturingAt: Date | null; nurturingStep: number },
  nextStepDef: NurturingStepDef,
): boolean {
  const referenceDate = lead.nurturingStep === 0
    ? lead.createdAt
    : lead.lastNurturingAt ?? lead.createdAt;

  const threshold = hoursAgo(nextStepDef.delayHours);
  return referenceDate <= threshold;
}

// ---------------------------------------------------------------------------
// Funció principal
// ---------------------------------------------------------------------------

export async function runCommercialSequences(): Promise<SequenceRunSummary> {
  const cadence = DEFAULT_NURTURING_CADENCE;
  const maxStep = cadence.length;

  // Buscar leads actius que no han acabat la cadència
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
    const nextStepIndex = lead.nurturingStep; // 0-based index into cadence
    const nextStepDef = cadence[nextStepIndex];
    if (!nextStepDef) continue;

    const responseState = deriveLeadResponseState(lead.activities, lead.createdAt);
    if (responseState.lastInboundAt && responseState.lastOutboundAt && responseState.lastInboundAt > responseState.lastOutboundAt) {
      summary.skippedNotReady += 1;
      continue;
    }

    // Comprovar si ja ha passat prou temps
    if (!isReadyForNextStep(lead, nextStepDef)) {
      summary.skippedNotReady += 1;
      continue;
    }

    summary.matched += 1;
    const locale = normalizeLocale(lead.preferredLocale);
    const templateSlug = nextStepDef.templateSlug;
    const copy = COMMERCIAL_SEQUENCE_STEP_COPY[locale][templateSlug];
    if (!copy) {
      log.error(`Còpia no trobada per slug=${templateSlug} locale=${locale}`, null);
      summary.errors += 1;
      continue;
    }

    const firstName = lead.name.split(' ')[0] || lead.name;
    const subject = copy.subject(lead.eventType);
    const text = copy.text(firstName);
    const phone = safePhone(lead.phone);
    let channelUsed: 'email' | 'whatsapp' | null = null;

    try {
      // Intentar WhatsApp primer (com abans)
      if (phone) {
        const wa = await sendWhatsAppText({ to: phone, text });
        if (wa.ok) {
          channelUsed = 'whatsapp';
          summary.sentWhatsapp += 1;
        }
      }

      // Fallback a email
      if (!channelUsed && lead.email) {
        await sendEmail({
          to: lead.email,
          subject,
          html: `<p>${text}</p>`,
        });
        channelUsed = 'email';
        summary.sentEmail += 1;
      }

      if (!channelUsed) {
        summary.skippedNoChannel += 1;
      } else {
        summary.executed += 1;

        const isLastStep = nextStepDef.step === maxStep;
        const newStep = lead.nurturingStep + 1;

        // Actualitzar lead: incrementar pas + marcar com a fet si era l'últim
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            nurturingStep: newStep,
            lastNurturingAt: new Date(),
            nurturingDone: isLastStep,
          },
        });

        if (isLastStep) {
          summary.exhausted += 1;
        }

        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            type: channelUsed === 'email' ? 'EMAIL' : 'WHATSAPP',
            title: copy.activity,
            description: `Pas ${nextStepDef.step}/${maxStep} (${templateSlug}) · canal ${channelUsed}`,
            createdBy: 'Sequence Bot',
            metadata: {
              step: nextStepDef.step,
              totalSteps: maxStep,
              templateSlug,
              channel: channelUsed,
              locale,
              delayHours: nextStepDef.delayHours,
            },
          },
        });
      }

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
          },
        },
      });
    } catch (error) {
      summary.errors += 1;
      log.error('runCommercialSequences error al lead', error, {
        context: { leadId: lead.id, step: nextStepDef.step, templateSlug },
      });
    }
  }

  return summary;
}
