import { describe, it, expect } from 'vitest';

import {
  computeReasonStats,
  computeBreakdownByEventType,
  computeBreakdownBySource,
  computeMonthlyStats,
  computeArchiveStats,
} from '@/lib/services/leadArchiveService';

describe('leadArchiveService — funcions pures', () => {
  describe('computeReasonStats', () => {
    it('agrupa per lostReason i ordena per recompte desc', () => {
      const stats = computeReasonStats([
        { lostReason: 'PRICE_TOO_HIGH', estimatedValue: 1000 },
        { lostReason: 'PRICE_TOO_HIGH', estimatedValue: 2000 },
        { lostReason: 'DATE_UNAVAILABLE', estimatedValue: 500 },
      ]);
      expect(stats[0].reason).toBe('PRICE_TOO_HIGH');
      expect(stats[0].count).toBe(2);
      expect(stats[0].totalValue).toBe(3000);
      expect(stats[0].percentage).toBe(66.7);
      expect(stats[1].reason).toBe('DATE_UNAVAILABLE');
      expect(stats[1].count).toBe(1);
      expect(stats[1].percentage).toBe(33.3);
    });

    it('classifica null com a UNCLASSIFIED', () => {
      const stats = computeReasonStats([
        { lostReason: null, estimatedValue: null },
        { lostReason: null, estimatedValue: 800 },
      ]);
      expect(stats[0].reason).toBe('UNCLASSIFIED');
      expect(stats[0].count).toBe(2);
      expect(stats[0].totalValue).toBe(800);
      expect(stats[0].percentage).toBe(100);
    });

    it('retorna array buit si no hi ha records', () => {
      expect(computeReasonStats([])).toEqual([]);
    });
  });

  describe('computeBreakdownByEventType i BySource', () => {
    it('agrupa per eventType i ordena per count desc', () => {
      const r = computeBreakdownByEventType([
        { eventType: 'WEDDING', estimatedValue: 5000 },
        { eventType: 'BIRTHDAY', estimatedValue: 1000 },
        { eventType: 'WEDDING', estimatedValue: 4000 },
      ]);
      expect(r[0]).toEqual({ key: 'WEDDING', count: 2, totalValue: 9000 });
      expect(r[1]).toEqual({ key: 'BIRTHDAY', count: 1, totalValue: 1000 });
    });

    it('agrupa per source i ordena', () => {
      const r = computeBreakdownBySource([
        { source: 'INSTAGRAM', estimatedValue: 800 },
        { source: 'WEBSITE', estimatedValue: 2000 },
        { source: 'INSTAGRAM', estimatedValue: 1200 },
      ]);
      expect(r[0]).toEqual({ key: 'INSTAGRAM', count: 2, totalValue: 2000 });
      expect(r[1]).toEqual({ key: 'WEBSITE', count: 1, totalValue: 2000 });
    });
  });

  describe('computeMonthlyStats', () => {
    it('combina lost (de archive) i won (de leads) per mes UTC', () => {
      const monthly = computeMonthlyStats(
        [
          { archivedAt: new Date('2026-01-15T10:00:00Z'), estimatedValue: 800 },
          { archivedAt: new Date('2026-01-20T10:00:00Z'), estimatedValue: 1200 },
          { archivedAt: new Date('2026-02-05T10:00:00Z'), estimatedValue: 500 },
        ],
        [
          { convertedAt: new Date('2026-01-25T10:00:00Z'), createdAt: new Date('2025-12-01T00:00:00Z') },
          { convertedAt: null, createdAt: new Date('2026-02-10T00:00:00Z') },
        ],
      );
      expect(monthly).toEqual([
        { monthKey: '2026-01', lost: 2, won: 1, lostValue: 2000 },
        { monthKey: '2026-02', lost: 1, won: 1, lostValue: 500 },
      ]);
    });

    it('un mes sense lost o sense won es preserva si l\'altre n\'hi té', () => {
      const monthly = computeMonthlyStats(
        [{ archivedAt: new Date('2026-03-01T10:00:00Z'), estimatedValue: 0 }],
        [],
      );
      expect(monthly).toEqual([{ monthKey: '2026-03', lost: 1, won: 0, lostValue: 0 }]);
    });
  });

  describe('computeArchiveStats (agregació total)', () => {
    it('retorna totalLost + totalLostValue + 4 panells', () => {
      const stats = computeArchiveStats({
        records: [
          { lostReason: 'PRICE_TOO_HIGH', eventType: 'WEDDING', source: 'WEBSITE', estimatedValue: 5000, archivedAt: new Date('2026-04-01T00:00:00Z') },
          { lostReason: 'DATE_UNAVAILABLE', eventType: 'BIRTHDAY', source: 'INSTAGRAM', estimatedValue: 1500, archivedAt: new Date('2026-04-10T00:00:00Z') },
        ],
        wonLeads: [{ convertedAt: new Date('2026-04-05T00:00:00Z'), createdAt: new Date('2026-03-01T00:00:00Z') }],
      });
      expect(stats.totalLost).toBe(2);
      expect(stats.totalLostValue).toBe(6500);
      expect(stats.byReason).toHaveLength(2);
      expect(stats.byEventType).toHaveLength(2);
      expect(stats.bySource).toHaveLength(2);
      expect(stats.monthly).toEqual([{ monthKey: '2026-04', lost: 2, won: 1, lostValue: 6500 }]);
    });

    it('zero records → tot a 0/[] excepte monthly', () => {
      const stats = computeArchiveStats({ records: [], wonLeads: [] });
      expect(stats.totalLost).toBe(0);
      expect(stats.totalLostValue).toBe(0);
      expect(stats.byReason).toEqual([]);
      expect(stats.monthly).toEqual([]);
    });
  });
});
