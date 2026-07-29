import { describe, expect, it } from 'vitest';

import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { computeDashboardNextEventEconomics, projectDashboardEconomicRiskBookings } from '@/app/admin/lib/next-event-economics';

describe('computeDashboardNextEventEconomics', () => {
  it('calcula pendent restant respectant efectiu cobrat', () => {
    const result = computeDashboardNextEventEconomics({
      total: 500,
      depositAmount: 100,
      depositPaid: false,
      remainingPaid: false,
      cashAmount: 200,
      pack: { price: 400, extraHourPrice: 50 },
    }, PROFITABILITY_MODEL_DEFAULTS);

    expect(result.outstandingAmount).toBe(300);
  });

  it('calcula marge estimat amb pack, extres, transport i línies de servei', () => {
    const result = computeDashboardNextEventEconomics({
      total: 1000,
      depositAmount: 200,
      depositPaid: true,
      remainingPaid: false,
      travelCost: 80,
      extraHours: 1,
      pack: { price: 600, extraHourPrice: 100 },
      extras: [{ price: 100, quantity: 2 }],
      serviceLines: [{ revenueAmount: 150, costAmount: 90, quantity: 1, collaboratorId: 'collab-1', kind: 'PROVIDER_SERVICE', label: 'Partner' }],
    }, PROFITABILITY_MODEL_DEFAULTS);

    expect(result.directCost).toBeGreaterThan(0);
    expect(result.netMargin).toBeLessThan(1000);
    expect(result.marginPct).toBeGreaterThan(0);
  });

  it('projecta riscos economics dels proxims bolos sense incloure bolos sans', () => {
    const now = new Date('2026-07-07T10:00:00.000Z');
    const rows = [
      {
        id: 'healthy',
        reference: 'OE-OK',
        clientName: 'Client sa',
        eventDate: new Date('2026-07-09T18:00:00.000Z'),
        total: 1200,
        depositAmount: 1200,
        depositPaid: true,
        remainingPaid: true,
        pack: { price: 300, extraHourPrice: 50 },
      },
      {
        id: 'cash',
        reference: 'OE-CASH',
        clientName: 'Client pendent',
        eventDate: new Date('2026-07-08T18:00:00.000Z'),
        total: 900,
        depositAmount: 100,
        depositPaid: false,
        remainingPaid: false,
        pack: { price: 200, extraHourPrice: 50 },
      },
      {
        id: 'cash-window',
        reference: 'OE-CASH-7D',
        clientName: 'Client pendent setmana',
        eventDate: new Date('2026-07-13T18:00:00.000Z'),
        total: 700,
        depositAmount: 100,
        depositPaid: false,
        remainingPaid: false,
        pack: { price: 200, extraHourPrice: 50 },
      },
      {
        id: 'cash-late',
        reference: 'OE-CASH-LATE',
        clientName: 'Client pendent tard',
        eventDate: new Date('2026-07-15T18:00:00.000Z'),
        total: 700,
        depositAmount: 100,
        depositPaid: false,
        remainingPaid: false,
        pack: { price: 200, extraHourPrice: 50 },
      },
      {
        id: 'margin',
        reference: 'OE-MARGIN',
        clientName: 'Client marge',
        eventDate: new Date('2026-07-10T18:00:00.000Z'),
        total: 250,
        depositAmount: 250,
        depositPaid: true,
        remainingPaid: true,
        pack: { price: 900, extraHourPrice: 50 },
      },
    ];

    const result = projectDashboardEconomicRiskBookings(rows, now, PROFITABILITY_MODEL_DEFAULTS);

    expect(result.map((booking) => booking.id)).toEqual(['margin', 'cash', 'cash-window']);
    expect(result[1]).toMatchObject({
      id: 'cash',
      daysUntil: 2,
      outstandingAmount: 900,
    });
    expect(result[2]).toMatchObject({
      id: 'cash-window',
      daysUntil: 7,
      outstandingAmount: 700,
    });
    expect(result[0].marginPct).toBeLessThan(25);
  });
});
