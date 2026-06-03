import { describe, expect, it } from 'vitest';
import {
  computeCollaboratorCost,
  computeFullBookingCost,
  getEquipmentCostPerHour,
  resolveServicePricingKey,
  SERVICE_HOURLY_RATES,
} from '@/lib/constants/pricing-intelligence';

describe('pricing-intelligence', () => {
  it('diferencia sonorització de DJ en una boda', () => {
    expect(resolveServicePricingKey({
      eventType: 'WEDDING',
      packName: 'Sonorització cerimònia',
      djHours: 0,
      soundWatts: 1600,
    })).toBe('boda_sonorizacion');

    expect(resolveServicePricingKey({
      eventType: 'WEDDING',
      packName: 'DJ festa + so',
      djHours: 5,
      soundWatts: 4000,
    })).toBe('boda_completa');
  });

  it('usa costPerHour del perfil del col·laborador abans que la comissió pactada', () => {
    const result = computeCollaboratorCost([
      { commissionAmount: 500, collaborator: { costPerHour: 35 } },
    ], 4);

    expect(result).toEqual({ cost: 140, source: 'hourly' });
  });

  it('fa fallback a la comissió si el perfil del col·laborador no té costPerHour', () => {
    const result = computeCollaboratorCost([
      { commissionAmount: 225, collaborator: { costPerHour: null } },
    ], 4);

    expect(result).toEqual({ cost: 225, source: 'commission' });
  });

  it('calcula amortització amb dades reals de l’ítem nou', () => {
    expect(getEquipmentCostPerHour({
      category: 'SOUND',
      purchasePrice: 1200,
      expectedLifeHours: 3000,
    })).toBe(0.4);
  });

  it('usa fallback configurable de categoria quan l’ítem no té compra ni vida útil', () => {
    expect(getEquipmentCostPerHour(
      { category: 'SOUND', value: null, purchasePrice: null, expectedLifeHours: null },
      { SOUND: { value: 5000, lifeHours: 2500 } },
    )).toBe(2);
  });

  it('manté extres i col·laboradors com a partides separades del cost total', () => {
    const result = computeFullBookingCost({
      total: 1000,
      billableHours: 4,
      serviceKey: 'dj',
      hourlyRate: SERVICE_HOURLY_RATES.dj,
      equipmentHourlyCost: 10,
      extraCost: 80,
      collaboratorCost: 140,
      travelCost: 30,
    });

    expect(result.costEquip).toBe(40);
    expect(result.costExtras).toBe(80);
    expect(result.costCollab).toBe(140);
    expect(result.costTotal).toBe(290);
    expect(result.margin).toBe(710);
  });

  it('usa tarifa i llindars injectats per la configuració efectiva', () => {
    const result = computeFullBookingCost({
      total: 300,
      billableHours: 3,
      serviceKey: 'sonorizacion',
      hourlyRate: { min: 120, recommended: 200, premium: 260 },
      targetMarginPct: 50,
      alertThresholds: {
        priceDeviationAlertPct: 10,
        priceDeviationCriticalPct: 40,
        lowMarginPct: 20,
      },
    });

    expect(result.recommendedPrice).toBe(600);
    expect(result.alerts.map((alert) => alert.code)).toContain('RATE_BELOW_MIN');
    expect(result.alerts.map((alert) => alert.code)).toContain('PRICE_DEVIATION_CRITICAL');
  });
});
