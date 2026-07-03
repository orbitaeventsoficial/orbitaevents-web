import { describe, expect, it } from 'vitest';
import {
  computeSubcontractedMarkupSummary,
  isIncludedSoundTechSettlementLine,
  sanitizeRevenueAmount,
  sanitizeServiceLineCostAmount,
  SUBCONTRACTED_MARKUP_TARGET_PCT,
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

  it('calcula subcontractats com a +20% sobre cost de proveïdor', () => {
    const r = computeSubcontractedMarkupSummary([
      { kind: 'PROVIDER_SERVICE', collaboratorId: 'masquerade', revenueAmount: 240, costAmount: 200, quantity: 1 },
      { kind: 'SOUND_TECH', collaboratorId: 'masquerade', label: 'Tècnic de so inclòs · 1h 30', revenueAmount: 0, costAmount: -40, quantity: 1 },
    ]);

    expect(r.targetPct).toBe(SUBCONTRACTED_MARKUP_TARGET_PCT);
    expect(r.cost).toBe(200);
    expect(r.revenue).toBe(240);
    expect(r.markupAmount).toBe(40);
    expect(r.markupPct).toBe(20);
    expect(r.ok).toBe(true);
    expect(r.orbitaTechIncome).toBe(40);
  });
});
