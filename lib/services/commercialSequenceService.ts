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

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function safePhone(input?: string | null): string | null {
  if (!input) return null;
  const normalized = input.replace(/[^\d]/g, '');
  return normalized || null;
}

function buildMessage(sequence: 'NEW_24H' | 'QUOTE_48H', lead: {
  name: string;
  eventType: string;
  status: string;
}) {
  const firstName = lead.name.split(' ')[0] || lead.name;
  if (sequence === 'NEW_24H') {
    return {
      subject: `Seguimiento de tu solicitud · ${lead.eventType}`,
      text: `Hola ${firstName}, te escribimos para avanzar con tu evento. Si quieres, hoy mismo te proponemos una opción concreta.`,
    };
  }
  return {
    subject: `Seguimiento presupuesto · ${lead.eventType}`,
    text: `Hola ${firstName}, ¿pudiste revisar el presupuesto? Si quieres, ajustamos propuesta y cerramos fecha.`,
  };
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
    const sequence = lead.status === 'NEW' ? 'NEW_24H' : 'QUOTE_48H';
    const recentlyRun = await wasRecentlyExecuted(lead.id, sequence);
    if (recentlyRun) continue;

    summary.matched += 1;
    const message = buildMessage(sequence, lead);
    const phone = safePhone(lead.phone);
    let channelUsed: 'email' | 'whatsapp' | null = null;

    try {
      if (phone) {
        const wa = await sendWhatsAppText({ to: phone, text: message.text });
        if (wa.ok) {
          channelUsed = 'whatsapp';
          summary.sentWhatsapp += 1;
        }
      }

      if (!channelUsed && lead.email) {
        await sendEmail({
          to: lead.email,
          subject: message.subject,
          html: `<p>${message.text}</p>`,
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
            title: 'Follow-up automático',
            description: `${sequence} · canal ${channelUsed}`,
            createdBy: 'Sequence Bot',
            metadata: { sequence, channel: channelUsed },
          },
        });
      }

      await prisma.adminLog.create({
        data: {
          action: 'COMM_SEQUENCE_EXEC',
          entity: 'lead',
          entityId: lead.id,
          details: {
            sequence,
            channel: channelUsed,
          },
        },
      });
    } catch (error) {
      summary.errors += 1;
      log.error('runCommercialSequences item error', error, { context: { leadId: lead.id, sequence } });
    }
  }

  return summary;
}
