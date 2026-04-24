import { describe, it, expect } from 'vitest';
import {
  computeLossSummary,
  type LossReportLead,
} from '@/lib/services/leadLossAnalyticsService';

function lead(overrides: Partial<LossReportLead> = {}): LossReportLead {
  return {
    id: 'id' in overrides ? overrides.id! : 'l' + Math.random().toString(36).slice(2, 6),
    name: 'name' in overrides ? overrides.name! : 'Lead',
    lostReason: 'lostReason' in overrides ? overrides.lostReason! : 'PRICE_TOO_HIGH',
    lostAt: 'lostAt' in overrides ? overrides.lostAt! : new Date('2026-04-10T12:00:00.000Z'),
    eventType: 'eventType' in overrides ? overrides.eventType! : 'WEDDING',
    source: 'source' in overrides ? overrides.source! : 'WEBSITE',
    budget: 'budget' in overrides ? overrides.budget! : null,
    eventLocation: 'eventLocation' in overrides ? overrides.eventLocation! : null,
  };
}

describe('computeLossSummary', () => {
  it('returns zero totals on empty input', () => {
    const summary = computeLossSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.uncategorized).toBe(0);
    expect(summary.autoTotal).toBe(0);
    expect(summary.commercialTotal).toBe(0);
    expect(summary.byReason).toEqual([]);
    expect(summary.byEventType).toEqual([]);
    expect(summary.bySource).toEqual([]);
    expect(summary.byMonth).toEqual([]);
    expect(summary.topReason).toBeNull();
  });

  it('aggregates losses by canonical reason sorted by count desc', () => {
    const summary = computeLossSummary([
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'NO_RESPONSE' }),
      lead({ lostReason: 'NO_RESPONSE' }),
      lead({ lostReason: 'COMPETITOR_CHOSEN' }),
    ]);

    expect(summary.total).toBe(6);
    expect(summary.byReason).toEqual([
      { key: 'PRICE_TOO_HIGH', label: 'Preu massa alt', count: 3, share: 50 },
      { key: 'NO_RESPONSE', label: 'Sense resposta', count: 2, share: 33.3 },
      { key: 'COMPETITOR_CHOSEN', label: 'Va escollir un competidor', count: 1, share: 16.7 },
    ]);
    expect(summary.topReason).toEqual({
      reason: 'PRICE_TOO_HIGH',
      label: 'Preu massa alt',
      count: 3,
      share: 50,
    });
  });

  it('counts leads with unknown/null reason as uncategorized', () => {
    const summary = computeLossSummary([
      lead({ lostReason: null }),
      lead({ lostReason: 'BOGUS' }),
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
    ]);

    expect(summary.total).toBe(3);
    expect(summary.uncategorized).toBe(2);
    expect(summary.byReason).toHaveLength(1);
    expect(summary.byReason[0].key).toBe('PRICE_TOO_HIGH');
  });

  it('breaks down by eventType with humanised labels', () => {
    const summary = computeLossSummary([
      lead({ eventType: 'WEDDING' }),
      lead({ eventType: 'WEDDING' }),
      lead({ eventType: 'BIRTHDAY' }),
      lead({ eventType: 'CORPORATE' }),
    ]);

    expect(summary.byEventType).toEqual([
      { key: 'WEDDING', label: 'Wedding', count: 2, share: 50 },
      { key: 'BIRTHDAY', label: 'Birthday', count: 1, share: 25 },
      { key: 'CORPORATE', label: 'Corporate', count: 1, share: 25 },
    ]);
  });

  it('breaks down by source with humanised labels', () => {
    const summary = computeLossSummary([
      lead({ source: 'WEBSITE' }),
      lead({ source: 'WEBSITE' }),
      lead({ source: 'INSTAGRAM' }),
    ]);

    expect(summary.bySource[0]).toEqual({
      key: 'WEBSITE',
      label: 'Website',
      count: 2,
      share: 66.7,
    });
    expect(summary.bySource[1]).toEqual({
      key: 'INSTAGRAM',
      label: 'Instagram',
      count: 1,
      share: 33.3,
    });
  });

  it('groups by ISO month sorted chronologically', () => {
    const summary = computeLossSummary([
      lead({ lostAt: new Date('2026-02-15T10:00:00.000Z') }),
      lead({ lostAt: new Date('2026-02-20T10:00:00.000Z') }),
      lead({ lostAt: new Date('2026-03-01T10:00:00.000Z') }),
      lead({ lostAt: new Date('2026-01-10T10:00:00.000Z') }),
    ]);

    expect(summary.byMonth).toEqual([
      { monthIso: '2026-01', count: 1 },
      { monthIso: '2026-02', count: 2 },
      { monthIso: '2026-03', count: 1 },
    ]);
  });

  it('skips month aggregation for leads without lostAt', () => {
    const summary = computeLossSummary([
      lead({ lostAt: new Date('2026-02-15T10:00:00.000Z') }),
      lead({ lostAt: null }),
      lead({ lostAt: null }),
    ]);

    expect(summary.byMonth).toEqual([{ monthIso: '2026-02', count: 1 }]);
  });

  it('does not include zero-count reasons in byReason', () => {
    const summary = computeLossSummary([lead({ lostReason: 'PRICE_TOO_HIGH' })]);
    expect(summary.byReason.every((entry) => entry.count > 0)).toBe(true);
    expect(summary.byReason.find((entry) => entry.key === 'OTHER')).toBeUndefined();
  });

  it('shares are computed as rounded percentages with one decimal', () => {
    const summary = computeLossSummary([
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'NO_RESPONSE' }),
    ]);

    expect(summary.byReason[0].share).toBe(66.7);
    expect(summary.byReason[1].share).toBe(33.3);
  });

  it('handles all 9 canonical reasons in a single dataset', () => {
    const summary = computeLossSummary([
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'DATE_UNAVAILABLE' }),
      lead({ lostReason: 'COMPETITOR_CHOSEN' }),
      lead({ lostReason: 'EVENT_CANCELLED' }),
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: 'NO_RESPONSE' }),
      lead({ lostReason: 'NOT_QUALIFIED' }),
      lead({ lostReason: 'OUT_OF_AREA' }),
      lead({ lostReason: 'OTHER' }),
    ]);

    expect(summary.byReason).toHaveLength(9);
    expect(summary.uncategorized).toBe(0);
    expect(summary.autoTotal).toBe(1);
    expect(summary.commercialTotal).toBe(8);
  });

  it('excludes EVENT_PASSED from topReason even when it dominates byReason', () => {
    const summary = computeLossSummary([
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
      lead({ lostReason: 'NO_RESPONSE' }),
    ]);

    expect(summary.total).toBe(8);
    expect(summary.autoTotal).toBe(5);
    expect(summary.commercialTotal).toBe(3);
    expect(summary.byReason[0].key).toBe('EVENT_PASSED');
    expect(summary.topReason?.reason).toBe('PRICE_TOO_HIGH');
    expect(summary.topReason?.count).toBe(2);
  });

  it('returns null topReason when every loss is auto-classified', () => {
    const summary = computeLossSummary([
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: 'EVENT_PASSED' }),
    ]);

    expect(summary.autoTotal).toBe(2);
    expect(summary.commercialTotal).toBe(0);
    expect(summary.topReason).toBeNull();
    expect(summary.byReason[0].key).toBe('EVENT_PASSED');
  });

  it('commercialTotal excludes both auto and uncategorized losses', () => {
    const summary = computeLossSummary([
      lead({ lostReason: 'EVENT_PASSED' }),
      lead({ lostReason: null }),
      lead({ lostReason: 'BOGUS' }),
      lead({ lostReason: 'PRICE_TOO_HIGH' }),
    ]);

    expect(summary.total).toBe(4);
    expect(summary.autoTotal).toBe(1);
    expect(summary.uncategorized).toBe(2);
    expect(summary.commercialTotal).toBe(1);
    expect(summary.topReason?.reason).toBe('PRICE_TOO_HIGH');
  });
});
