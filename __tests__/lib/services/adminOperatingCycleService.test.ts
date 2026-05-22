import { describe, expect, it } from 'vitest';
import { ADMIN_MANUAL_OPERATING_FLOW } from '@/lib/constants/adminManual';
import { formatCurrency } from '@/lib/constants';
import { buildDashboardOperatingCycle } from '@/lib/services/adminOperatingCycleService';

describe('buildDashboardOperatingCycle', () => {
  it('manté el cicle canònic del manual amb mètriques del dashboard', () => {
    const result = buildDashboardOperatingCycle({
      leadsThisMonth: 12,
      staleLeadsCount: 2,
      quotesInFlightCount: 3,
      bookingsConfirmed: 4,
      pendingPayments: 890.4,
      postEventPending: 1,
    });

    expect(result.map((item) => item.step)).toEqual(ADMIN_MANUAL_OPERATING_FLOW.map((item) => item.step));
    expect(result[0]).toMatchObject({
      step: '01',
      title: 'Captar demanda',
      href: '/admin/leads',
      metric: '12 entrades',
      tone: 'success',
    });
    expect(result[1]).toMatchObject({
      step: '02',
      metric: '2 fredes',
      tone: 'warning',
    });
    expect(result[4]).toMatchObject({
      step: '05',
      metric: formatCurrency(890.4),
      tone: 'warning',
    });
  });

  it('marca com a avisos els passos sense volum o sense propostes actives', () => {
    const result = buildDashboardOperatingCycle({
      leadsThisMonth: 0,
      staleLeadsCount: 0,
      quotesInFlightCount: 0,
      bookingsConfirmed: 0,
      pendingPayments: 0,
      postEventPending: 0,
    });

    expect(result.find((item) => item.step === '01')).toMatchObject({
      metric: '0 entrades',
      tone: 'warning',
    });
    expect(result.find((item) => item.step === '02')).toMatchObject({
      metric: '0 fredes',
      tone: 'success',
    });
    expect(result.find((item) => item.step === '03')).toMatchObject({
      metric: '0 pressupostos',
      tone: 'warning',
    });
    expect(result.find((item) => item.step === '05')).toMatchObject({
      metric: formatCurrency(0),
      tone: 'success',
    });
  });
});
