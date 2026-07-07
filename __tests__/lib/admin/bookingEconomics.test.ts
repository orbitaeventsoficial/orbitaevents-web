import { describe, expect, it } from 'vitest';

import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import {
  computeDashboardNextEventEconomics,
  projectDashboardEconomicRiskBookings,
} from '@/lib/admin/bookingEconomics';

describe('bookingEconomics', () => {
  it('calcula pendent cash-aware i marge directe amb linies de servei', () => {
    const result = computeDashboardNextEventEconomics({
      total: 1000,
      depositAmount: 200,
      remainingAmount: 800,
      depositPaid: true,
      remainingPaid: false,
      cashAmount: 1000,
      extraHours: 1,
      travelCost: 30,
      distanceKm: 100,
      pack: { price: 600, extraHourPrice: 80 },
      extras: [{ price: 50, quantity: 2 }],
      serviceLines: [
        { revenueAmount: 200, costAmount: 120, quantity: 1, collaboratorId: 'collab-1', kind: 'PROVIDER_SERVICE', label: 'Partner' },
      ],
    }, PROFITABILITY_MODEL_DEFAULTS);

    expect(result.outstandingAmount).toBe(0);
    expect(result.directCost).toBeGreaterThan(0);
    expect(result.netMargin).toBeLessThan(1000);
    expect(result.marginPct).toBeGreaterThan(0);
  });

  it('projecta nomes bolos amb marge critic o caixa pendent imminent i els prioritza', () => {
    const now = new Date('2026-07-07T10:00:00.000Z');
    const rows = [
      {
        id: 'safe',
        reference: 'SAFE',
        clientName: 'Safe Client',
        eventDate: new Date('2026-07-12T10:00:00.000Z'),
        total: 2000,
        depositPaid: true,
        remainingPaid: true,
        pack: { price: 200, extraHourPrice: 0 },
      },
      {
        id: 'cash',
        reference: 'CASH',
        clientName: 'Cash Client',
        eventDate: new Date('2026-07-08T10:00:00.000Z'),
        total: 2000,
        depositAmount: 200,
        remainingAmount: 1800,
        depositPaid: true,
        remainingPaid: false,
        pack: { price: 200, extraHourPrice: 0 },
      },
      {
        id: 'margin',
        reference: 'MARGIN',
        clientName: 'Margin Client',
        eventDate: new Date('2026-07-10T10:00:00.000Z'),
        total: 300,
        depositPaid: true,
        remainingPaid: true,
        pack: { price: 0, extraHourPrice: 0 },
        serviceLines: [
          { revenueAmount: 0, costAmount: 500, quantity: 1, collaboratorId: 'collab-2', kind: 'PROVIDER_SERVICE', label: 'Partner car' },
        ],
      },
    ];

    const result = projectDashboardEconomicRiskBookings(rows, now, PROFITABILITY_MODEL_DEFAULTS);

    expect(result.map((booking) => booking.reference)).toEqual(['CASH', 'MARGIN']);
    expect(result[0]).toMatchObject({ outstandingAmount: 1800, daysUntil: 1 });
    expect(result[1].marginPct).toBeLessThan(25);
  });
});
