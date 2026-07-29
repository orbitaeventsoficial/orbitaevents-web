import { describe, it, expect } from 'vitest';

import {
  buildRecentCommRowsFromTimeline,
  deriveFlowStatusFromTimeline,
} from '@/lib/services/communicationStatusService';
import type { CanonicalTimelineEvent } from '@/lib/services/timelineQueryService';

function makeTimelineEvent(overrides: Partial<CanonicalTimelineEvent> = {}): CanonicalTimelineEvent {
  return {
    id: overrides.id ?? 'al:1',
    source: overrides.source ?? 'adminLog',
    entityType: overrides.entityType ?? 'booking',
    entityId: overrides.entityId ?? 'booking-1',
    kind: overrides.kind ?? 'booking',
    title: overrides.title ?? 'Comunicació enviada',
    occurredAt: overrides.occurredAt ?? '2026-03-01T12:00:00.000Z',
    metadata: overrides.metadata,
    link: overrides.link,
    timelineType: overrides.timelineType ?? 'BOOKING_CREATED',
  };
}

describe('deriveFlowStatusFromTimeline', () => {
  it('retorna ENVIADO des d’events canònics', () => {
    const result = deriveFlowStatusFromTimeline([
      makeTimelineEvent({ metadata: { flow: 'PAYMENT', channel: 'email' } }),
    ], 'PAYMENT');

    expect(result.state).toBe('ENVIADO');
    expect(result.lastChannel).toBe('email');
  });

  it('retorna RESPONDIDO quan hi ha resposta del client', () => {
    const result = deriveFlowStatusFromTimeline([
      makeTimelineEvent({
        id: 'al:1',
        title: 'Comunicació enviada',
        occurredAt: '2026-03-01T10:00:00.000Z',
        metadata: { flow: 'PAYMENT', channel: 'whatsapp' },
      }),
      makeTimelineEvent({
        id: 'al:2',
        title: 'Resposta del client',
        occurredAt: '2026-03-01T12:00:00.000Z',
        metadata: { flow: 'PAYMENT' },
      }),
    ], 'PAYMENT');

    expect(result.state).toBe('RESPONDIDO');
    expect(result.lastChannel).toBe('whatsapp');
  });
});

describe('buildRecentCommRowsFromTimeline', () => {
  it('genera files recents des de timeline canònica', () => {
    const rows = buildRecentCommRowsFromTimeline([
      makeTimelineEvent({
        id: 'al:1',
        title: 'Comunicació enviada',
        occurredAt: '2026-03-01T12:00:00.000Z',
        metadata: { flow: 'PAYMENT', channel: 'email' },
      }),
      makeTimelineEvent({
        id: 'al:2',
        title: 'Resposta del client',
        occurredAt: '2026-03-01T11:00:00.000Z',
        metadata: { flow: 'POST_EVENT' },
      }),
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      id: 'al:1',
      createdAt: new Date('2026-03-01T12:00:00.000Z'),
      action: 'COMM_SENT',
      flow: 'PAYMENT',
      channel: 'email',
    });
    expect(rows[1].action).toBe('COMM_RESPONDED');
    expect(rows[1].channel).toBe('-');
  });
});
