import { prisma } from '@/lib/prisma';
import { loadPendingFollowUps } from '@/lib/services/responseTrackingService';
import { sendAdminEmail } from '@/lib/services/adminEmailSendService';

export type BulkComposeSegmentKey =
  | 'customers-weddings-2025'
  | 'leads-no-response-7d';

export type BulkComposeSegmentRecipient = {
  id: string;
  entityType: 'customer' | 'lead';
  name: string;
  email: string;
  preferredLocale: string | null;
  customerId?: string;
  leadId?: string;
};

export type BulkComposeSegmentAudience = {
  key: BulkComposeSegmentKey;
  label: string;
  description: string;
  recipients: BulkComposeSegmentRecipient[];
};

export const BULK_COMPOSE_SEGMENTS: Array<{
  key: BulkComposeSegmentKey;
  label: string;
  description: string;
}> = [
  {
    key: 'customers-weddings-2025',
    label: 'Clients de bodes 2025',
    description: 'Clients amb reserva de boda durant el 2025 i correu vàlid.',
  },
  {
    key: 'leads-no-response-7d',
    label: 'Leads sense resposta 7d',
    description: 'Leads actius contactats sense inbound posterior i amb 7 o més dies de silenci.',
  },
];

function getSegmentMeta(key: BulkComposeSegmentKey) {
  return BULK_COMPOSE_SEGMENTS.find((segment) => segment.key === key) || null;
}

function personalizeTemplate(text: string, recipient: BulkComposeSegmentRecipient): string {
  return text
    .split('{nom}').join(recipient.name)
    .split('{name}').join(recipient.name);
}

async function loadCustomersWeddings2025(): Promise<BulkComposeSegmentRecipient[]> {
  const customers = await prisma.customer.findMany({
    where: {
      bookings: {
        some: {
          eventType: 'WEDDING',
          eventDate: {
            gte: new Date('2025-01-01T00:00:00.000Z'),
            lt: new Date('2026-01-01T00:00:00.000Z'),
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      preferredLocale: true,
    },
    orderBy: { name: 'asc' },
    take: 300,
  });

  return customers
    .filter((customer) => customer.email)
    .map((customer) => ({
      id: customer.id,
      entityType: 'customer' as const,
      name: customer.name || customer.email!,
      email: customer.email!,
      preferredLocale: customer.preferredLocale,
      customerId: customer.id,
    }));
}

async function loadLeadsNoResponse7d(now: Date): Promise<BulkComposeSegmentRecipient[]> {
  const summary = await loadPendingFollowUps(now, 300);
  return summary.items
    .filter((item) => item.daysSinceOutbound >= 7)
    .map((item) => ({
      id: item.leadId,
      entityType: 'lead' as const,
      name: item.name,
      email: item.email,
      preferredLocale: item.preferredLocale,
      leadId: item.leadId,
      customerId: item.customerId || undefined,
    }));
}

export async function loadBulkComposeAudience(
  key: BulkComposeSegmentKey,
  now: Date = new Date(),
): Promise<BulkComposeSegmentAudience | null> {
  const meta = getSegmentMeta(key);
  if (!meta) return null;

  const recipients = key === 'customers-weddings-2025'
    ? await loadCustomersWeddings2025()
    : await loadLeadsNoResponse7d(now);

  return {
    key,
    label: meta.label,
    description: meta.description,
    recipients,
  };
}

export async function sendBulkComposeSegment(input: {
  segmentKey: BulkComposeSegmentKey;
  subject: string;
  body: string;
  templateKey?: string | null;
}): Promise<
  | {
      ok: true;
      segmentKey: BulkComposeSegmentKey;
      audienceSize: number;
      sent: number;
      failed: number;
    }
  | {
      ok: false;
      status: 400 | 404;
      error: string;
    }
> {
  if (!input.subject.trim() || !input.body.trim()) {
    return { ok: false, status: 400, error: 'Assumpte i cos obligatoris per a enviament massiu' };
  }

  const audience = await loadBulkComposeAudience(input.segmentKey);
  if (!audience) {
    return { ok: false, status: 404, error: 'Segment no trobat' };
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of audience.recipients) {
    const result = await sendAdminEmail({
      to: recipient.email,
      subject: personalizeTemplate(input.subject, recipient),
      body: personalizeTemplate(input.body, recipient),
      leadId: recipient.leadId,
      customerId: recipient.customerId,
      locale: recipient.preferredLocale,
      templateKey: input.templateKey || null,
    });

    if (result.ok) sent += 1;
    else failed += 1;
  }

  return {
    ok: true,
    segmentKey: audience.key,
    audienceSize: audience.recipients.length,
    sent,
    failed,
  };
}
