import { describe, expect, it } from 'vitest';

import { PROFITABILITY_MODEL_DEFAULTS } from '@/lib/constants/admin';
import { computeBookingEconomicGuard } from '@/app/admin/lib/booking-economic-guard';

describe('computeBookingEconomicGuard', () => {
  it('calcula pendent de caixa amb efectiu cobrat i classifica el risc', () => {
    const result = computeBookingEconomicGuard({
      total: 500,
      depositAmount: 100,
      remainingAmount: 400,
      depositPaid: false,
      remainingPaid: false,
      cashAmount: 500,
      packPrice: 300,
      extrasTotal: 0,
      extraHours: 0,
      extraHourPrice: 0,
    }, PROFITABILITY_MODEL_DEFAULTS);

    expect(result.outstandingAmount).toBe(0);
    expect(result.outstandingBand).toBe('ok');
  });

  it('resumeix marge directe amb pack, extres, transport i linies de servei', () => {
    const result = computeBookingEconomicGuard({
      total: 1000,
      depositAmount: 200,
      remainingAmount: 800,
      depositPaid: true,
      remainingPaid: false,
      packPrice: 600,
      extrasTotal: 100,
      extraHours: 1,
      extraHourPrice: 80,
      distanceKm: 100,
      vehicleCostPerKm: 0.3,
      serviceLines: [
        { revenueAmount: 200, costAmount: 120, quantity: 1, collaboratorId: 'collab-1', kind: 'PROVIDER_SERVICE', label: 'Partner' },
      ],
    }, PROFITABILITY_MODEL_DEFAULTS);

    expect(result.directCost).toBeGreaterThan(0);
    expect(result.netMargin).toBeLessThan(1000);
    expect(result.marginPct).toBeGreaterThan(0);
    expect(result.outstandingAmount).toBe(800);
    expect(result.outstandingBand).toBe('err');
  });

  it('prioritza travelCost guardat sobre el calcul aproximat per km', () => {
    const withStoredTravel = computeBookingEconomicGuard({
      total: 1000,
      depositAmount: 200,
      remainingAmount: 800,
      depositPaid: true,
      remainingPaid: false,
      packPrice: 0,
      extrasTotal: 0,
      extraHours: 0,
      extraHourPrice: 0,
      distanceKm: 100,
      vehicleCostPerKm: 0.3,
      travelCost: 180,
    }, PROFITABILITY_MODEL_DEFAULTS);

    expect(withStoredTravel.directCost).toBeGreaterThan(180);
    expect(withStoredTravel.netMargin).toBeLessThan(1000 - 180);
  });
});
