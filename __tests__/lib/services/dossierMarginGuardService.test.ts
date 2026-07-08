import { describe, expect, it } from 'vitest';
import {
  computeDossierMarginGuard,
  computeDossierTransportBudget,
  DOSSIER_TRAVEL_HEADCOUNT,
} from '@/lib/services/dossierMarginGuardService';

const config = {
  packCostRatio: 0.35,
  extraCostRatio: 0.2,
  extraHourCostRatio: 0.2,
  orbitaServiceCostRatio: 0.2,
  fixedOperationalCost: 0,
  channelCac: { OTHER: 0, UNKNOWN: 0 },
};

describe('dossierMarginGuardService', () => {
  it('reusa el transport de dossier amb headcount pre-venda de 2 persones', () => {
    const budget = computeDossierTransportBudget(120);
    expect(budget.headcount).toBe(DOSSIER_TRAVEL_HEADCOUNT);
    expect(budget.km).toBe(120);
    expect(budget.cost).toBeGreaterThan(0);
    expect(budget.clientCharge).toBeGreaterThan(0);
    expect(budget.clientVehicleCost).toBeGreaterThan(0);
    expect(budget.vehicleKm).toBe(120);
    expect(budget.peopleCost).toBeGreaterThan(0);
    expect(budget.chargeableHours).toBeGreaterThan(0);
  });

  it('marca OK un subcontractat amb +20% sobre cost', () => {
    const guard = computeDossierMarginGuard({
      serviceLines: [{ kind: 'PROVIDER_SERVICE', collaboratorId: 'masquerade', revenueAmount: 240, costAmount: 200, quantity: 1 }],
      config,
    });
    expect(guard.subcontractedMarkupPct).toBe(20);
    expect(guard.subcontractedMarkupOk).toBe(true);
    expect(guard.warnings.join(' ')).not.toContain('Markup subcontractat');
  });

  it('avisa abans d\'enviar si el markup subcontractat queda sota el 20%', () => {
    const guard = computeDossierMarginGuard({
      serviceLines: [{ kind: 'PROVIDER_SERVICE', collaboratorId: 'masquerade', revenueAmount: 210, costAmount: 200, quantity: 1 }],
      config,
    });
    expect(guard.subcontractedMarkupPct).toBe(5);
    expect(guard.subcontractedMarkupOk).toBe(false);
    expect(guard.warnings.join(' ')).toContain('Markup subcontractat 5%');
  });

  it('inclou el desplaçament dins ingressos i costos de la decisió', () => {
    const guard = computeDossierMarginGuard({
      serviceLines: [{ kind: 'DJ', revenueAmount: 250, quantity: 1 }],
      travelKm: 180,
      config,
    });
    expect(guard.travelRevenue).toBeGreaterThan(0);
    expect(guard.travelCost).toBeGreaterThan(0);
    expect(guard.totalRevenue).toBe(250 + guard.travelRevenue);
  });

  it('inclou els peatges del lead al pressupost de transport del dossier', () => {
    const withoutTolls = computeDossierTransportBudget(180, 0);
    const withTolls = computeDossierTransportBudget(180, 18.5);

    expect(withTolls.tollsCost).toBe(18.5);
    expect(withTolls.clientCharge).toBe(withoutTolls.clientCharge + 18.5);
    expect(withTolls.cost).toBe(withoutTolls.cost + 18.5);
  });
});
