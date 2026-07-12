import { describe, expect, it } from 'vitest';
import {
  getEquipmentCostPerHour,
  resolveServicePricingKey,
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
});
