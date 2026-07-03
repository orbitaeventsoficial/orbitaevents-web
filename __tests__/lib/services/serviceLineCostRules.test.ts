import { describe, expect, it } from 'vitest';
import {
  isIncludedSoundTechSettlementLine,
  sanitizeRevenueAmount,
  sanitizeServiceLineCostAmount,
} from '@/lib/services/serviceLineCostRules';

describe('serviceLineCostRules', () => {
  it('detecta el tècnic de so inclòs encara que el label porti accents', () => {
    expect(isIncludedSoundTechSettlementLine({
      kind: 'SOUND_TECH',
      label: 'Tècnic de so inclòs · 1h 30',
    })).toBe(true);
  });

  it('només preserva costos negatius per al tècnic inclòs', () => {
    expect(sanitizeServiceLineCostAmount({
      kind: 'SOUND_TECH',
      label: 'Tècnic de so inclòs · 1h 30',
      costAmount: -40,
    })).toBe(-40);
    expect(sanitizeServiceLineCostAmount({
      kind: 'PROVIDER_SERVICE',
      label: 'Servei extern',
      costAmount: -40,
    })).toBe(0);
  });

  it('saneja ingressos a imports no negatius', () => {
    expect(sanitizeRevenueAmount(12.345)).toBe(12.35);
    expect(sanitizeRevenueAmount(-10)).toBe(0);
    expect(sanitizeRevenueAmount(Number.NaN)).toBeNull();
  });
});
