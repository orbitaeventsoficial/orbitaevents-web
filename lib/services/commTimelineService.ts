// lib/services/commTimelineService.ts
// ═══════════════════════════════════════════════════════════════════════════
// COMMUNICATION TIMELINE SERVICE
// Unifica email, notes, WhatsApp, trucades i accions de seguiment en una
// sola narrativa de comunicació per lead/client. Funció pura + wrapper.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type CommChannel = 'EMAIL' | 'WHATSAPP' | 'CALL' | 'NOTE' | 'SYSTEM';

export type CommDirection = 'OUTBOUND' | 'INBOUND' | 'INTERNAL';

export type CommEntry = {
  id: string;
  channel: CommChannel;
  direction: CommDirection;
  title: string;
  body: string | null;
  author: string | null;
  occurredAt: string;
  leadId: string | null;
  customerId: string | null;
  metadata: Record<string, unknown> | null;
};

export type CommTimelineSummary = {
  entries: CommEntry[];
  total: number;
  channels: Record<CommChannel, number>;
  lastContactAt: string | null;
  lastContactChannel: CommChannel | null;
  lastContactDirection: CommDirection | null;
  pendingResponseFrom: 'TEAM' | 'CLIENT' | 'NONE';
  daysSinceLastContact: number | null;
  responseGap: number | null;
};

export type CommTimelineRawEntry = {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  createdBy: string | null;
  createdAt: Date;
  leadId: string;
  metadata: Record<string, unknown> | null;
};

export type CommTimelineInput = {
  activities: CommTimelineRawEntry[];
  customerId: string | null;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// CHANNEL MAPPING
// ───────────────────────────────────────────────────────────────────────────

const TYPE_TO_CHANNEL: Record<string, CommChannel> = {
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  CALL: 'CALL',
  NOTE: 'NOTE',
  STATUS_CHANGE: 'SYSTEM',
  DOCUMENT: 'SYSTEM',
  TASK: 'SYSTEM',
  SYSTEM: 'SYSTEM',
};

function inferDirection(entry: CommTimelineRawEntry): CommDirection {
  if (entry.type === 'NOTE') return 'INTERNAL';
  if (entry.createdBy === 'system' || entry.createdBy === 'Scoring Bot' || entry.type === 'SYSTEM' || entry.type === 'STATUS_CHANGE') return 'INTERNAL';
  // Inbound heuristic: title/description contains keywords
  const text = ((entry.title ?? '') + ' ' + (entry.description ?? '')).toLowerCase();
  if (text.includes('rebut') || text.includes('entrant') || text.includes('client escriu') || text.includes('resposta del client')) return 'INBOUND';
  return 'OUTBOUND';
}

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function buildCommTimeline(input: CommTimelineInput): CommTimelineSummary {
  const { activities, customerId, now } = input;

  // Filter to comm-relevant types
  const commTypes = new Set(['EMAIL', 'WHATSAPP', 'CALL', 'NOTE']);
  const commActivities = activities.filter((a) => commTypes.has(a.type));

  const entries: CommEntry[] = commActivities.map((a) => ({
    id: a.id,
    channel: TYPE_TO_CHANNEL[a.type] ?? 'SYSTEM',
    direction: inferDirection(a),
    title: a.title ?? a.type,
    body: a.description,
    author: a.createdBy,
    occurredAt: a.createdAt.toISOString(),
    leadId: a.leadId,
    customerId,
    metadata: a.metadata,
  }));

  // Sort newest first
  entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  // Channel counts
  const channels: Record<CommChannel, number> = {
    EMAIL: 0,
    WHATSAPP: 0,
    CALL: 0,
    NOTE: 0,
    SYSTEM: 0,
  };
  for (const e of entries) {
    channels[e.channel]++;
  }

  // Last contact (non-internal)
  const contactEntries = entries.filter((e) => e.direction !== 'INTERNAL');
  const lastContactEntry = contactEntries[0] ?? null;
  const lastContactAt = lastContactEntry ? lastContactEntry.occurredAt : null;
  const lastContactChannel = lastContactEntry ? lastContactEntry.channel : null;
  const lastContactDirection = lastContactEntry ? lastContactEntry.direction : null;
  const pendingResponseFrom =
    lastContactDirection === 'INBOUND'
      ? 'TEAM'
      : lastContactDirection === 'OUTBOUND'
        ? 'CLIENT'
        : 'NONE';
  const daysSinceLastContact = lastContactAt
    ? Math.floor((now.getTime() - new Date(lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Response gap: time between last outbound and last inbound
  const lastOutbound = entries.find((e) => e.direction === 'OUTBOUND');
  const lastInbound = entries.find((e) => e.direction === 'INBOUND');
  let responseGap: number | null = null;
  if (lastOutbound && lastInbound) {
    const outDate = new Date(lastOutbound.occurredAt).getTime();
    const inDate = new Date(lastInbound.occurredAt).getTime();
    responseGap = Math.round(Math.abs(outDate - inDate) / (1000 * 60 * 60));
  }

  return {
    entries,
    total: entries.length,
    channels,
    lastContactAt,
    lastContactChannel,
    lastContactDirection,
    pendingResponseFrom,
    daysSinceLastContact,
    responseGap,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadCommTimeline(
  leadId: string,
  customerId: string | null = null,
  now: Date = new Date(),
): Promise<CommTimelineSummary> {
  // Load activities from all leads (if customer, include all leads)
  const leadIds: string[] = [leadId];

  if (customerId) {
    const customerLeads = await prisma.lead.findMany({
      where: { customerId },
      select: { id: true },
    });
    for (const cl of customerLeads) {
      if (!leadIds.includes(cl.id)) leadIds.push(cl.id);
    }
  }

  const activities = await prisma.leadActivity.findMany({
    where: {
      leadId: { in: leadIds },
      type: { in: ['EMAIL', 'WHATSAPP', 'CALL', 'NOTE'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const rawActivities: CommTimelineRawEntry[] = activities.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    createdBy: a.createdBy,
    createdAt: a.createdAt,
    leadId: a.leadId,
    metadata: a.metadata as Record<string, unknown> | null,
  }));

  return buildCommTimeline({ activities: rawActivities, customerId, now });
}
