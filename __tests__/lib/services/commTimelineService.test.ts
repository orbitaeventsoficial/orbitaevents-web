import { describe, it, expect } from 'vitest';
import { buildCommTimelineFromCanonicalEvents } from '@/lib/services/commTimelineService';
import type { CanonicalTimelineEvent } from '@/lib/services/timelineQueryService';

const NOW = new Date('2026-04-10T10:00:00Z');

// Mapeig de tipus d'activitat → timelineType canònic (per als tests de canal).
const TYPE_TO_TIMELINE: Record<string, string> = {
  EMAIL: 'MESSAGE_SENT',
  WHATSAPP: 'WHATSAPP_SENT',
  CALL: 'PHONE_CALL',
  NOTE: 'NOTE_ADDED',
  STATUS_CHANGE: 'STATUS_CHANGE',
  SYSTEM: 'SYSTEM',
  TASK: 'TASK',
};

// makeEntry(raw) → CanonicalTimelineEvent equivalent, perquè els tests proven la
// via VIVA (buildCommTimelineFromCanonicalEvents) en comptes de la raw retirada (#1197).
function makeEntry(overrides: {
  id?: string; type?: string; title?: string; description?: string;
  createdBy?: string; createdAt?: Date; metadata?: Record<string, unknown> | null;
} = {}): CanonicalTimelineEvent {
  const type = overrides.type ?? 'EMAIL';
  return {
    id: overrides.id ?? 'a1',
    source: 'leadActivity',
    entityType: 'lead',
    entityId: 'lead-1',
    kind: 'message',
    title: overrides.title ?? 'Follow-up',
    body: overrides.description ?? 'Cos del missatge',
    actor: overrides.createdBy ?? 'Admin',
    occurredAt: (overrides.createdAt ?? new Date('2026-04-09T10:00:00Z')).toISOString(),
    metadata: overrides.metadata ?? undefined,
    link: undefined,
    timelineType: (TYPE_TO_TIMELINE[type] ?? 'MESSAGE_SENT') as CanonicalTimelineEvent['timelineType'],
  };
}

function makeInput(activities: CanonicalTimelineEvent[], overrides: { customerId?: string | null; now?: Date } = {}) {
  return { events: activities, customerId: overrides.customerId ?? null, now: overrides.now ?? NOW };
}

function makeCanonicalEvent(overrides: Partial<CanonicalTimelineEvent> = {}): CanonicalTimelineEvent {
  return {
    id: overrides.id ?? 'la:a1',
    source: overrides.source ?? 'leadActivity',
    entityType: overrides.entityType ?? 'lead',
    entityId: overrides.entityId ?? 'lead-1',
    kind: overrides.kind ?? 'message',
    title: overrides.title ?? 'Follow-up',
    body: overrides.body,
    actor: overrides.actor ?? 'Admin',
    occurredAt: overrides.occurredAt ?? '2026-04-09T10:00:00.000Z',
    metadata: overrides.metadata,
    link: overrides.link,
    timelineType: overrides.timelineType ?? 'MESSAGE_SENT',
  };
}

const buildCommTimeline = buildCommTimelineFromCanonicalEvents;

describe('buildCommTimeline (via canònica)', () => {
  it('retorna buit sense activitats', () => {
    const result = buildCommTimeline(makeInput([]));
    expect(result.total).toBe(0);
    expect(result.entries).toHaveLength(0);
    expect(result.lastContactAt).toBeNull();
    expect(result.lastContactChannel).toBeNull();
    expect(result.lastContactDirection).toBeNull();
    expect(result.pendingResponseFrom).toBe('NONE');
    expect(result.daysSinceLastContact).toBeNull();
    expect(result.responseGap).toBeNull();
  });

  it('filtra tipus no-comm (STATUS_CHANGE, SYSTEM, TASK)', () => {
    const activities = [
      makeEntry({ id: 'e1', type: 'EMAIL' }),
      makeEntry({ id: 'e2', type: 'STATUS_CHANGE' }),
      makeEntry({ id: 'e3', type: 'SYSTEM' }),
      makeEntry({ id: 'e4', type: 'TASK' }),
      makeEntry({ id: 'e5', type: 'NOTE' }),
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.total).toBe(2); // EMAIL + NOTE
  });

  it('mapeja EMAIL al canal EMAIL', () => {
    const result = buildCommTimeline(makeInput([makeEntry({ type: 'EMAIL' })]));
    expect(result.entries[0].channel).toBe('EMAIL');
  });

  it('mapeja WHATSAPP al canal WHATSAPP', () => {
    const result = buildCommTimeline(makeInput([makeEntry({ id: 'w1', type: 'WHATSAPP' })]));
    expect(result.entries[0].channel).toBe('WHATSAPP');
  });

  it('mapeja CALL al canal CALL', () => {
    const result = buildCommTimeline(makeInput([makeEntry({ id: 'c1', type: 'CALL' })]));
    expect(result.entries[0].channel).toBe('CALL');
  });

  it('mapeja NOTE al canal NOTE', () => {
    const result = buildCommTimeline(makeInput([makeEntry({ id: 'n1', type: 'NOTE' })]));
    expect(result.entries[0].channel).toBe('NOTE');
  });

  it('NOTE és sempre INTERNAL', () => {
    const result = buildCommTimeline(makeInput([makeEntry({ type: 'NOTE' })]));
    expect(result.entries[0].direction).toBe('INTERNAL');
  });

  it('EMAIL per admin és OUTBOUND', () => {
    const result = buildCommTimeline(makeInput([makeEntry({ type: 'EMAIL', createdBy: 'Admin' })]));
    expect(result.entries[0].direction).toBe('OUTBOUND');
  });

  it('activitat amb "resposta del client" és INBOUND', () => {
    const result = buildCommTimeline(makeInput([
      makeEntry({ type: 'EMAIL', title: 'Resposta del client Maria' }),
    ]));
    expect(result.entries[0].direction).toBe('INBOUND');
  });

  it('ordena per data descendent', () => {
    const activities = [
      makeEntry({ id: 'old', type: 'EMAIL', createdAt: new Date('2026-04-07T10:00:00Z') }),
      makeEntry({ id: 'new', type: 'EMAIL', createdAt: new Date('2026-04-09T10:00:00Z') }),
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.entries[0].id).toBe('new');
    expect(result.entries[1].id).toBe('old');
  });

  it('compta canals correctament', () => {
    const activities = [
      makeEntry({ id: '1', type: 'EMAIL' }),
      makeEntry({ id: '2', type: 'EMAIL' }),
      makeEntry({ id: '3', type: 'WHATSAPP' }),
      makeEntry({ id: '4', type: 'CALL' }),
      makeEntry({ id: '5', type: 'NOTE' }),
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.channels.EMAIL).toBe(2);
    expect(result.channels.WHATSAPP).toBe(1);
    expect(result.channels.CALL).toBe(1);
    expect(result.channels.NOTE).toBe(1);
  });

  it('respecta metadata.channel=form a activitats de tipus EMAIL', () => {
    const result = buildCommTimeline(makeInput([
      makeEntry({
        id: 'f1',
        type: 'EMAIL',
        metadata: { channel: 'form', direction: 'INBOUND' },
        title: 'Formulari web rebut',
      }),
    ]));

    expect(result.entries[0].channel).toBe('FORM');
    expect(result.channels.FORM).toBe(1);
  });

  it('lastContactAt exclou INTERNAL', () => {
    const activities = [
      makeEntry({ id: '1', type: 'NOTE', createdAt: new Date('2026-04-09T12:00:00Z') }), // INTERNAL
      makeEntry({ id: '2', type: 'EMAIL', createdAt: new Date('2026-04-08T10:00:00Z') }), // OUTBOUND
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.lastContactAt).toContain('2026-04-08');
    expect(result.lastContactChannel).toBe('EMAIL');
    expect(result.lastContactDirection).toBe('OUTBOUND');
    expect(result.pendingResponseFrom).toBe('CLIENT');
  });

  it('marca que l’equip deu resposta si l’últim contacte és inbound', () => {
    const activities = [
      makeEntry({ id: '1', type: 'EMAIL', createdAt: new Date('2026-04-09T12:00:00Z'), title: 'Resposta del client Anna' }),
      makeEntry({ id: '2', type: 'EMAIL', createdAt: new Date('2026-04-08T10:00:00Z'), createdBy: 'Admin' }),
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.lastContactDirection).toBe('INBOUND');
    expect(result.pendingResponseFrom).toBe('TEAM');
  });

  it('daysSinceLastContact calcula correctament', () => {
    const activities = [
      makeEntry({ type: 'EMAIL', createdAt: new Date('2026-04-07T10:00:00Z') }),
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.daysSinceLastContact).toBe(3);
  });

  it('responseGap calcula diferència outbound-inbound en hores', () => {
    const activities = [
      makeEntry({ id: '1', type: 'EMAIL', createdAt: new Date('2026-04-09T10:00:00Z'), createdBy: 'Admin' }), // OUTBOUND
      makeEntry({ id: '2', type: 'EMAIL', createdAt: new Date('2026-04-08T10:00:00Z'), title: 'Resposta del client' }), // INBOUND
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.responseGap).toBe(24); // 24h diferència
  });

  it('responseGap null si no hi ha inbound', () => {
    const activities = [
      makeEntry({ type: 'EMAIL', createdBy: 'Admin' }),
    ];
    const result = buildCommTimeline(makeInput(activities));
    expect(result.responseGap).toBeNull();
  });

  it('preserva metadata i customerId', () => {
    const activities = [
      makeEntry({ type: 'EMAIL', metadata: { templateId: 'tpl-1' } }),
    ];
    const result = buildCommTimeline(makeInput(activities, { customerId: 'cust-1' }));
    expect(result.entries[0].customerId).toBe('cust-1');
    expect(result.entries[0].metadata).toEqual({ templateId: 'tpl-1' });
  });

  it('deriva el resum també des d’events canònics', () => {
    const result = buildCommTimelineFromCanonicalEvents({
      events: [
        makeCanonicalEvent({ id: 'msg-1', timelineType: 'MESSAGE_SENT', occurredAt: '2026-04-09T10:00:00.000Z' }),
        makeCanonicalEvent({
          id: 'msg-2',
          timelineType: 'EMAIL_RECEIVED',
          title: 'Resposta del client',
          occurredAt: '2026-04-10T08:00:00.000Z',
        }),
        makeCanonicalEvent({ id: 'note-1', timelineType: 'NOTE_ADDED', kind: 'activity', occurredAt: '2026-04-10T09:00:00.000Z' }),
      ],
      customerId: 'cust-1',
      now: NOW,
    });

    expect(result.total).toBe(3);
    expect(result.channels.EMAIL).toBe(2);
    expect(result.channels.NOTE).toBe(1);
    expect(result.lastContactDirection).toBe('INBOUND');
    expect(result.pendingResponseFrom).toBe('TEAM');
    expect(result.entries[0].customerId).toBe('cust-1');
  });

  it('reconeix INSTAGRAM i FORM des de metadata.channel als events canònics', () => {
    const result = buildCommTimelineFromCanonicalEvents({
      events: [
        makeCanonicalEvent({
          id: 'ig-1',
          title: 'Instagram DM rebut',
          metadata: { channel: 'instagram', direction: 'INBOUND' },
          occurredAt: '2026-04-10T09:00:00.000Z',
        }),
        makeCanonicalEvent({
          id: 'form-1',
          title: 'Formulari web rebut',
          metadata: { channel: 'form', direction: 'INBOUND' },
          occurredAt: '2026-04-10T08:00:00.000Z',
        }),
      ],
      customerId: null,
      now: NOW,
    });

    expect(result.channels.INSTAGRAM).toBe(1);
    expect(result.channels.FORM).toBe(1);
    expect(result.entries[0].channel).toBe('INSTAGRAM');
    expect(result.entries[1].channel).toBe('FORM');
  });
});
