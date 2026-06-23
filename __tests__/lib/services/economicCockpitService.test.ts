import { describe, it, expect } from 'vitest';
import { composeEconomicCockpit } from '@/lib/services/economicCockpitService';

// El cockpit econòmic (zenit) unifica pipeline ponderat + cash-flow en una font de
// comandament. Aquests tests blinden la composició pura (sense I/O).

function pm(month: string, over: Record<string, number> = {}) {
  return {
    month,
    historicalAvg: 0,
    pipeline: 0, pipelineLow: 0, pipelineHigh: 0,
    combined: 0, combinedLow: 0, combinedHigh: 0,
    previousYearActual: 0,
    confirmedBookings: 0,
    confirmedRevenue: 0,
    ...over,
  };
}

describe('composeEconomicCockpit', () => {
  it('fusiona pipeline i cash-flow per clau de mes', () => {
    const c = composeEconomicCockpit(
      [pm('2026-07', { pipeline: 1800, confirmedRevenue: 1000, combined: 2000 })],
      [{ month: '2026-07', income: 3000, costs: 1000, netFlow: 2000, cumulative: 2000 }],
    );
    expect(c.months).toHaveLength(1);
    expect(c.months[0]).toMatchObject({
      month: '2026-07', weightedPipeline: 1800, committedRevenue: 1000,
      combinedForecast: 2000, netCashFlow: 2000,
    });
  });

  it('netCashFlow = 0 si no hi ha entrada de cash-flow per al mes', () => {
    const c = composeEconomicCockpit([pm('2026-08', { pipeline: 500 })], []);
    expect(c.months[0].netCashFlow).toBe(0);
  });

  it('els totals agreguen tots els mesos', () => {
    const c = composeEconomicCockpit(
      [
        pm('2026-07', { pipeline: 1000, confirmedRevenue: 500, combined: 1200, previousYearActual: 1000 }),
        pm('2026-08', { pipeline: 2000, confirmedRevenue: 800, combined: 2200, previousYearActual: 1000 }),
      ],
      [],
    );
    expect(c.summary.weightedTotal).toBe(3000);
    expect(c.summary.committedTotal).toBe(1300);
    expect(c.summary.combinedTotal).toBe(3400);
    expect(c.summary.previousYearTotal).toBe(2000);
    expect(c.summary.monthsAhead).toBe(2);
  });

  it('yoyDeltaPct: variació de la previsió combinada vs any anterior', () => {
    const c = composeEconomicCockpit(
      [pm('2026-07', { combined: 1200, previousYearActual: 1000 })],
      [],
    );
    expect(c.summary.yoyDeltaPct).toBe(20); // (1200-1000)/1000 = +20%
  });

  it('yoyDeltaPct = null si no hi ha històric (evita divisió per zero)', () => {
    const c = composeEconomicCockpit([pm('2026-07', { combined: 1200 })], []);
    expect(c.summary.yoyDeltaPct).toBeNull();
  });

  it('netForecastTotal suma el netCashFlow + netMarginPct sobre el combinat', () => {
    const c = composeEconomicCockpit(
      [pm('2026-07', { combined: 1000 }), pm('2026-08', { combined: 1000 })],
      [
        { month: '2026-07', income: 1000, costs: 600, netFlow: 400, cumulative: 400 },
        { month: '2026-08', income: 1000, costs: 700, netFlow: 300, cumulative: 700 },
      ],
    );
    expect(c.summary.netForecastTotal).toBe(700); // 400 + 300
    expect(c.summary.netMarginPct).toBe(35); // 700 / 2000 = 35%
  });

  it('netMarginPct = null si no hi ha previsió combinada', () => {
    const c = composeEconomicCockpit([pm('2026-07')], []);
    expect(c.summary.netMarginPct).toBeNull();
  });

  it('cockpit buit: totals a 0, sense mesos', () => {
    const c = composeEconomicCockpit([], []);
    expect(c.months).toHaveLength(0);
    expect(c.summary.committedTotal).toBe(0);
    expect(c.summary.yoyDeltaPct).toBeNull();
  });
});
