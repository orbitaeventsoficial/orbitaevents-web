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

  it('no duplica cost de ruta antic quan travelCost conviu amb línies [travel-cost]', () => {
    const result = computeDashboardNextEventEconomics({
      total: 1000,
      depositPaid: true,
      remainingPaid: true,
      extraHours: 0,
      travelCost: 158,
      distanceKm: 422,
      pack: { price: 0, extraHourPrice: 0 },
      serviceLines: [
        { revenueAmount: 240, costAmount: 200, quantity: 1, collaboratorId: 'masquerade', kind: 'PROVIDER_SERVICE', label: 'Bingo Musical' },
        { revenueAmount: 0, costAmount: 75, quantity: 1, collaboratorId: 'masquerade', kind: 'OTHER', label: 'Vehicle ruta', notes: '[travel-cost] vehicle · 422.0 km' },
        { revenueAmount: 0, costAmount: 83, quantity: 1, collaboratorId: 'masquerade', kind: 'OTHER', label: 'Temps ruta passatger', notes: '[travel-cost] PASSENGER · 5.50 h' },
      ],
    }, PROFITABILITY_MODEL_DEFAULTS);

    // 45 operatiu fix + 158 travelCost + 200 servei partner.
    // Les dues línies [travel-cost] són repartiment, no segon cost de marge.
    expect(result.directCost).toBe(403);
    expect(result.netMargin).toBe(577);
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
