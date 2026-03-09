import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendWhatsAppText } from '@/lib/services/whatsappService';
import { log } from '@/lib/logger';

export type SequenceRunSummary = {
  generatedAt: string;
  scanned: number;
  matched: number;
  executed: number;
  sentEmail: number;
  sentWhatsapp: number;
  skippedNoChannel: number;
  errors: number;
};

type Locale = 'ca' | 'es' | 'en';

const SEQ_COPY: Record<Locale, Record<'NEW_24H' | 'QUOTE_48H', {
  subject: (eventType: string) => string;
  text: (firstName: string) => string;
  activity: string;
}>> = {
  ca: {
    NEW_24H: {
      subject: (et) => `Seguiment de la teva sol·licitud · ${et}`,
      text: (name) => `Hola ${name}, t'escrivim per avançar amb el teu esdeveniment. Si vols, avui mateix et proposem una opció concreta.`,
      activity: 'Follow-up automàtic',
    },
    QUOTE_48H: {
      subject: (et) => `Seguiment pressupost · ${et}`,
      text: (name) => `Hola ${name}, has pogut revisar el pressupost? Si vols, ajustem la proposta i tanquem data.`,
      activity: 'Follow-up automàtic',
    },
  },
  es: {
    NEW_24H: {
      subject: (et) => `Seguimiento de tu solicitud · ${et}`,
      text: (name) => `Hola ${name}, te escribimos para avanzar con tu evento. Si quieres, hoy mismo te proponemos una opción concreta.`,
      activity: 'Follow-up automático',
    },
    QUOTE_48H: {
      subject: (et) => `Seguimiento presupuesto · ${et}`,
      text: (name) => `Hola ${name}, ¿pudiste revisar el presupuesto? Si quieres, ajustamos propuesta y cerramos fecha.`,
      activity: 'Follow-up automático',
    },
  },
  en: {
    NEW_24H: {
      subject: (et) => `Follow-up on your request · ${et}`,
      text: (name) => `Hi ${name}, we're writing to move forward with your event. If you'd like, we can propose a specific option today.`,
      activity: 'Automatic follow-up',
    },
    QUOTE_48H: {
      subject: (et) => `Quote follow-up · ${et}`,
      text: (name) => `Hi ${name}, have you been able to review the quote? We're happy to adjust the proposal and lock in a date.`,
      activity: 'Automatic follow-up',
    },
  },
};

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

async function wasRecentlyExecuted(leadId: string, sequence: string): Promise<boolean> {
  const recent = await prisma.adminLog.findFirst({
    where: {
      action: 'COMM_SEQUENCE_EXEC',
      entity: 'lead',
      entityId: leadId,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!recent) return false;
  const details = (recent.details && typeof recent.details === 'object'
    ? (recent.details as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  if (details.sequence !== sequence) return false;
  return recent.createdAt > hoursAgo(20);
}

export async function runCommercialSequences(): Promise<SequenceRunSummary> {
  const candidates = await prisma.lead.findMany({
    where: {
      OR: [
        {
          status: 'NEW',
          createdAt: { lte: hoursAgo(24) },
        },
        {
          status: 'QUOTE_SENT',
          updatedAt: { lte: hoursAgo(48) },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      status: true,
      preferredLocale: true,
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
    errors: 0,
  };

  for (const lead of candidates) {
    const sequence: 'NEW_24H' | 'QUOTE_48H' = lead.status === 'NEW' ? 'NEW_24H' : 'QUOTE_48H';
    const recentlyRun = await wasRecentlyExecuted(lead.id, sequence);
    if (recentlyRun) continue;

    summary.matched += 1;
    const locale = normalizeLocale(lead.preferredLocale);
    const t = SEQ_COPY[locale][sequence];
    const firstName = lead.name.split(' ')[0] || lead.name;
    const subject = t.subject(lead.eventType);
    const text = t.text(firstName);
    const phone = safePhone(lead.phone);
    let channelUsed: 'email' | 'whatsapp' | null = null;

    try {
      if (phone) {
        const wa = await sendWhatsAppText({ to: phone, text });
        if (wa.ok) {
          channelUsed = 'whatsapp';
          summary.sentWhatsapp += 1;
        }
      }

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
        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            type: channelUsed === 'email' ? 'EMAIL' : 'WHATSAPP',
            title: t.activity,
            description: `${sequence} · canal ${channelUsed}`,
            createdBy: 'Sequence Bot',
            metadata: { sequence, channel: channelUsed, locale },
          },
        });
      }

      await prisma.adminLog.create({
        data: {
          action: 'COMM_SEQUENCE_EXEC',
          entity: 'lead',
          entityId: lead.id,
          details: { sequence, channel: channelUsed, locale },
        },
      });
    } catch (error) {
      summary.errors += 1;
      log.error('runCommercialSequences item error', error, { context: { leadId: lead.id, sequence } });
    }
  }

  return summary;
}
