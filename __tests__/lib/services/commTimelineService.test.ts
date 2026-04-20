import { describe, it, expect } from 'vitest';
import { buildCommTimeline, type CommTimelineRawEntry, type CommTimelineInput } from '@/lib/services/commTimelineService';

const NOW = new Date('2026-04-10T10:00:00Z');

function makeEntry(overrides: Partial<CommTimelineRawEntry> = {}): CommTimelineRawEntry {
  return {
    id: overrides.id ?? 'a1',
    type: 'EMAIL',
    title: 'Follow-up',
    description: 'Cos del missatge',
    createdBy: 'Admin',
    createdAt: new Date('2026-04-09T10:00:00Z'),
    leadId: 'lead-1',
    metadata: null,
    ...overrides,
  };
}

function makeInput(activities: CommTimelineRawEntry[], overrides: Partial<CommTimelineInput> = {}): CommTimelineInput {
  return { activities, customerId: null, now: NOW, ...overrides };
}

describe('buildCommTimeline', () => {
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
});
