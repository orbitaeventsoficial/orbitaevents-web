import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLeadCount, mockBookingCount, mockTaskCount } = vi.hoisted(() => ({
  mockLeadCount: vi.fn(),
  mockBookingCount: vi.fn(),
  mockTaskCount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: { count: mockLeadCount },
    booking: { count: mockBookingCount },
    task: { count: mockTaskCount },
  },
}));

import { detectAnomalies, loadAnomalyReport, type AnomalyInput, type AnomalyMetricInput } from '@/lib/services/dailyAnomalyService';

const NOW = new Date('2026-04-11T09:00:00Z');

function makeMetric(overrides: Partial<AnomalyMetricInput> = {}): AnomalyMetricInput {
  return {
    key: 'leads',
    label: 'Entrades noves',
    current: 5,
    avg30d: 5,
    higherIsBetter: true,
    icon: '📥',
    ...overrides,
  };
}

function makeInput(metrics: AnomalyMetricInput[], overrides: Partial<AnomalyInput> = {}): AnomalyInput {
  return {
    metrics,
    now: NOW,
    windowDays: 30,
    threshold: 0.5,
    ...overrides,
  };
}

describe('detectAnomalies', () => {
  it('retorna 0 anomalies quan tot dins rang normal', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ current: 5, avg30d: 5 }),
      makeMetric({ key: 'bookings', current: 2, avg30d: 2 }),
    ]));
    expect(result.anomalies).toHaveLength(0);
    expect(result.verdict).toContain('rang normal');
  });

  it('detecta anomalia POSITIVE quan mètrica higherIsBetter puja >50%', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ current: 10, avg30d: 5, higherIsBetter: true }),
    ]));
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].level).toBe('POSITIVE');
    expect(result.anomalies[0].deviation).toBe(1);
    expect(result.anomalies[0].message).toContain('per sobre');
  });

  it('detecta anomalia NEGATIVE quan mètrica higherIsBetter baixa >50%', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ current: 2, avg30d: 5, higherIsBetter: true }),
    ]));
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].level).toBe('NEGATIVE');
    expect(result.anomalies[0].message).toContain('per sota');
  });

  it('detecta anomalia POSITIVE quan mètrica !higherIsBetter baixa >50%', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ key: 'overdue', current: 1, avg30d: 5, higherIsBetter: false }),
    ]));
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].level).toBe('POSITIVE');
  });

  it('detecta anomalia NEGATIVE quan mètrica !higherIsBetter puja >50%', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ key: 'lost', current: 10, avg30d: 3, higherIsBetter: false }),
    ]));
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].level).toBe('NEGATIVE');
  });

  it('no genera anomalia si avg30d i current són negligibles (<0.5)', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ current: 0, avg30d: 0.2 }),
    ]));
    expect(result.anomalies).toHaveLength(0);
  });

  it('ordena anomalies per |deviation| descendent', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ key: 'a', current: 8, avg30d: 5 }),  // 60% → reportable
      makeMetric({ key: 'b', current: 15, avg30d: 5 }), // 200%
    ]));
    expect(result.anomalies).toHaveLength(2);
    expect(result.anomalies[0].metric).toBe('b');
    expect(result.anomalies[1].metric).toBe('a');
  });

  it('threshold personalitzat canvia la sensibilitat', () => {
    const result = detectAnomalies(makeInput(
      [makeMetric({ current: 6, avg30d: 5 })],
      { threshold: 0.15 },
    ));
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].deviation).toBeCloseTo(0.2, 1);
  });

  it('verdict menciona positives i negatives per separat', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ key: 'leads', current: 10, avg30d: 3, higherIsBetter: true }),
      makeMetric({ key: 'lost', current: 8, avg30d: 2, higherIsBetter: false }),
    ]));
    expect(result.anomalies).toHaveLength(2);
    expect(result.verdict).toContain('positiva');
    expect(result.verdict).toContain('negativa');
  });

  it('verdict solo positives', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ current: 12, avg30d: 4, higherIsBetter: true }),
    ]));
    expect(result.verdict).toContain('positiva');
    expect(result.verdict).not.toContain('negativa');
  });

  it('verdict solo negatives', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ current: 1, avg30d: 5, higherIsBetter: true }),
    ]));
    expect(result.verdict).toContain('negativa');
    expect(result.verdict).toContain('Revisa el brief');
  });

  it('generatedAt és ISO i windowDays és preservat', () => {
    const result = detectAnomalies(makeInput([], { windowDays: 14 }));
    expect(result.generatedAt).toBe('2026-04-11T09:00:00.000Z');
    expect(result.windowDays).toBe(14);
  });

  it('edge case: current 0 contra avg30d alt és anomalia negativa', () => {
    const result = detectAnomalies(makeInput([
      makeMetric({ current: 0, avg30d: 8, higherIsBetter: true }),
    ]));
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].level).toBe('NEGATIVE');
    expect(result.anomalies[0].deviation).toBe(-1);
  });
});

describe('loadAnomalyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadCount.mockResolvedValue(0);
    mockBookingCount.mockResolvedValue(0);
    mockTaskCount.mockResolvedValue(0);
  });

  it('overdue-today query NO inclou clàusula impossible (lt+gte sobre el mateix instant)', async () => {
    await loadAnomalyReport(NOW);

    const overdueTodayCall = mockTaskCount.mock.calls[0]?.[0];
    expect(overdueTodayCall).toBeDefined();
    expect(overdueTodayCall.where.status).toEqual({ in: ['OPEN', 'IN_PROGRESS'] });
    expect(overdueTodayCall.where.dueDate).toHaveProperty('lt');
    expect(overdueTodayCall.where.dueDate).not.toHaveProperty('gte');
  });

  it('overdue-today retorna comptador real de tasques vençudes quan DB en té', async () => {
    mockTaskCount
      .mockResolvedValueOnce(15) // overdueToday — pic anòmal
      .mockResolvedValueOnce(30); // overdueLast30d → avg 1/dia

    const report = await loadAnomalyReport(NOW);

    const overdue = report.anomalies.find((a) => a.metric === 'overdue');
    expect(overdue).toBeDefined();
    expect(overdue!.current).toBe(15);
    expect(overdue!.level).toBe('NEGATIVE');
  });

  it('overdue-last30d manté rang temporal [thirtyDaysAgo, todayStart)', async () => {
    await loadAnomalyReport(NOW);

    const overdueRangeCall = mockTaskCount.mock.calls[1]?.[0];
    expect(overdueRangeCall).toBeDefined();
    expect(overdueRangeCall.where.dueDate).toHaveProperty('lt');
    expect(overdueRangeCall.where.dueDate).toHaveProperty('gte');
    const { lt, gte } = overdueRangeCall.where.dueDate;
    expect(gte.getTime()).toBeLessThan(lt.getTime());
  });
});
