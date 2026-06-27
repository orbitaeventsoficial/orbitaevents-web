import {
  fetchCanonicalEventsForCustomer,
  fetchCanonicalEventsForLead,
  type CanonicalTimelineEvent,
} from '@/lib/services/timelineQueryService';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type CommChannel = 'EMAIL' | 'WHATSAPP' | 'CALL' | 'NOTE' | 'INSTAGRAM' | 'FORM' | 'SYSTEM';

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

type CommTimelineCanonicalInput = {
  events: CanonicalTimelineEvent[];
  customerId: string | null;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// CHANNEL MAPPING
// ───────────────────────────────────────────────────────────────────────────

function normalizeCommChannel(value: unknown): CommChannel | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'EMAIL') return 'EMAIL';
  if (normalized === 'WHATSAPP') return 'WHATSAPP';
  if (normalized === 'CALL') return 'CALL';
  if (normalized === 'NOTE') return 'NOTE';
  if (normalized === 'INSTAGRAM' || normalized === 'IG' || normalized === 'IG_DM') return 'INSTAGRAM';
  if (normalized === 'FORM' || normalized === 'WEB_FORM' || normalized === 'CONTACT_FORM') return 'FORM';
  if (normalized === 'SYSTEM') return 'SYSTEM';
  return null;
}

function inferDirectionFromCanonicalEvent(event: CanonicalTimelineEvent): CommDirection {
  if (event.timelineType === 'NOTE_ADDED') return 'INTERNAL';

  const direction = event.metadata?.direction;
  if (direction === 'INBOUND' || direction === 'OUTBOUND' || direction === 'INTERNAL') {
    return direction;
  }

  if (event.timelineType === 'EMAIL_RECEIVED') return 'INBOUND';

  const actor = (event.actor ?? '').toLowerCase();
  if (actor === 'system' || actor === 'scoring bot') return 'INTERNAL';

  const text = `${event.title} ${event.body ?? ''}`.toLowerCase();
  if (text.includes('rebut') || text.includes('entrant') || text.includes('client escriu') || text.includes('resposta del client')) {
    return 'INBOUND';
  }

  return 'OUTBOUND';
}

function mapCanonicalEventToChannel(event: CanonicalTimelineEvent): CommChannel | null {
  const metadataChannel = normalizeCommChannel(event.metadata?.channel);
  if (metadataChannel) return metadataChannel;
  if (event.timelineType === 'MESSAGE_SENT' || event.timelineType === 'EMAIL_RECEIVED') return 'EMAIL';
  if (event.timelineType === 'WHATSAPP_SENT') return 'WHATSAPP';
  if (event.timelineType === 'PHONE_CALL') return 'CALL';
  if (event.timelineType === 'NOTE_ADDED') return 'NOTE';
  return null;
}

function summarizeEntries(entries: CommEntry[], now: Date): CommTimelineSummary {
  entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const channels: Record<CommChannel, number> = {
    EMAIL: 0,
    WHATSAPP: 0,
    CALL: 0,
    NOTE: 0,
    INSTAGRAM: 0,
    FORM: 0,
    SYSTEM: 0,
  };
  for (const entry of entries) {
    channels[entry.channel]++;
  }

  const contactEntries = entries.filter((entry) => entry.direction !== 'INTERNAL');
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

  const lastOutbound = entries.find((entry) => entry.direction === 'OUTBOUND');
  const lastInbound = entries.find((entry) => entry.direction === 'INBOUND');
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
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function buildCommTimelineFromCanonicalEvents(input: CommTimelineCanonicalInput): CommTimelineSummary {
  const { events, customerId, now } = input;
  const entries: CommEntry[] = events
    .map((event) => {
      const channel = mapCanonicalEventToChannel(event);
      if (!channel) return null;
      return {
        id: event.id,
        channel,
        direction: inferDirectionFromCanonicalEvent(event),
        title: event.title,
        body: event.body ?? null,
        author: event.actor ?? null,
        occurredAt: event.occurredAt,
        leadId: event.entityType === 'lead' && event.entityId ? event.entityId : null,
        customerId,
        metadata: event.metadata ?? null,
      } satisfies CommEntry;
    })
    .filter((entry): entry is CommEntry => entry !== null);

  return summarizeEntries(entries, now);
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadCommTimeline(
  leadId: string,
  customerId: string | null = null,
  now: Date = new Date(),
): Promise<CommTimelineSummary> {
  const events = customerId
    ? await fetchCanonicalEventsForCustomer(customerId, 100)
    : await fetchCanonicalEventsForLead(leadId, 100);

  return buildCommTimelineFromCanonicalEvents({ events, customerId, now });
}
