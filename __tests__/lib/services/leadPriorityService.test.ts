import { describe, it, expect } from 'vitest';
import { rankLeadsToWork, type RankableLead } from '@/lib/services/leadPriorityService';

const NOW = new Date('2026-07-04T10:00:00Z');

function makeLead(over: Partial<RankableLead> & { id: string }): RankableLead {
  return {
    id: over.id,
    name: over.name ?? `Lead ${over.id}`,
    status: over.status ?? 'NEW',
    createdAt: over.createdAt ?? new Date('2026-07-04T09:00:00Z'),
    updatedAt: over.updatedAt ?? new Date('2026-07-04T09:00:00Z'),
    eventDate: over.eventDate ?? null,
    budget: over.budget ?? null,
    phone: over.phone ?? null,
    eventLocation: over.eventLocation ?? null,
    guestCount: over.guestCount ?? null,
    interestedPackId: over.interestedPackId ?? null,
    source: over.source ?? null,
  };
}

describe('rankLeadsToWork', () => {
  it('ordena per score descendent (el lead més ric primer)', () => {
    const rich = makeLead({ id: 'rich', budget: '3000', phone: '+34600000000', guestCount: 150, eventLocation: 'Girona' });
    const poor = makeLead({ id: 'poor' });
    const ranked = rankLeadsToWork([poor, rich], 5, NOW);
    expect(ranked[0].id).toBe('rich');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('respecta el límit', () => {
    const leads = Array.from({ length: 10 }, (_, i) => makeLead({ id: `l${i}`, budget: String(i * 100) }));
    expect(rankLeadsToWork(leads, 3, NOW)).toHaveLength(3);
  });

  it('projecta la raó i el risc principals del cervell de scoring', () => {
    const withBudget = makeLead({ id: 'b', budget: '3000' });
    const [row] = rankLeadsToWork([withBudget], 1, NOW);
    expect(row.topReason).toBeTypeOf('string');
    expect(row.band).toMatch(/LOW|MEDIUM|HIGH/);
    // Un lead sense pressupost ni telèfon exposa un risc.
    const [bare] = rankLeadsToWork([makeLead({ id: 'bare' })], 1, NOW);
    expect(bare.topRisk).toBeTypeOf('string');
  });

  it('llista buida → resultat buit', () => {
    expect(rankLeadsToWork([], 5, NOW)).toEqual([]);
  });
});
