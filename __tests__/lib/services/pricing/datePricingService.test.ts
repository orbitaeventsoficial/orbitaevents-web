import { describe, it, expect } from 'vitest';
import { applyDatePricing, findApplicableRule } from '@/lib/services/pricing/datePricingService';
import { DATE_PRICING_RULES } from '@/lib/constants/pricingRules';

describe('findApplicableRule', () => {
  it('retorna null per dates ordinàries (dilluns d\'octubre)', () => {
    const monday = new Date('2026-10-12T12:00:00Z'); // dilluns
    expect(findApplicableRule(monday)).toBeNull();
  });

  it('detecta dissabte com a cap de setmana', () => {
    const saturday = new Date('2026-10-10T12:00:00Z'); // dissabte
    const rule = findApplicableRule(saturday);
    expect(rule?.id).toBe('weekend');
  });

  it('detecta divendres com a cap de setmana', () => {
    const friday = new Date('2026-10-09T12:00:00Z'); // divendres
    const rule = findApplicableRule(friday);
    expect(rule?.id).toBe('weekend');
  });

  it('detecta alta temporada (juliol)', () => {
    const summer = new Date('2026-07-15T12:00:00Z'); // dimecres juliol
    const rule = findApplicableRule(summer);
    expect(rule?.id).toBe('high-season');
  });

  it('alta temporada en cap de setmana → guanya alta temporada (multiplicador més alt)', () => {
    const summerSaturday = new Date('2026-07-11T12:00:00Z'); // dissabte juliol
    const rule = findApplicableRule(summerSaturday);
    expect(rule?.id).toBe('high-season');
    expect(rule?.multiplier).toBe(1.15);
  });

  it('detecta Nadal — 20 desembre dins el rang', () => {
    const xmas = new Date('2026-12-20T12:00:00Z');
    const rule = findApplicableRule(xmas);
    expect(rule?.id).toBe('christmas');
  });

  it('detecta Nadal wrap-around — 3 gener', () => {
    const newYear = new Date('2026-01-03T12:00:00Z');
    const rule = findApplicableRule(newYear);
    expect(rule?.id).toBe('christmas');
  });

  it('Nochevieja específica (31 desembre) guanya per multiplicador més alt', () => {
    const nye = new Date('2026-12-31T12:00:00Z');
    const rule = findApplicableRule(nye);
    expect(rule?.id).toBe('new-year-eve');
    expect(rule?.multiplier).toBe(1.50);
  });

  it('regla 7 gener (fora del rang Nadal) → null', () => {
    const out = new Date('2026-01-07T12:00:00Z'); // dimecres, fora rang
    const rule = findApplicableRule(out);
    expect(rule).toBeNull();
  });

  it('14 desembre (just abans Nadal) → null', () => {
    const before = new Date('2026-12-14T12:00:00Z'); // dilluns, fora
    const rule = findApplicableRule(before);
    expect(rule).toBeNull();
  });
});

describe('applyDatePricing', () => {
  it('sense data: retorna preu base sense recàrrec', () => {
    const result = applyDatePricing(1000, null);
    expect(result).toEqual({
      basePrice: 1000,
      finalPrice: 1000,
      surchargeEur: 0,
      surchargePct: 0,
      appliedRule: null,
    });
  });

  it('data invàlida: retorna preu base sense recàrrec', () => {
    const result = applyDatePricing(1000, 'no-date');
    expect(result.appliedRule).toBeNull();
    expect(result.finalPrice).toBe(1000);
  });

  it('preu base negatiu: sanititza a 0', () => {
    const result = applyDatePricing(-50, '2026-10-10');
    expect(result.basePrice).toBe(0);
    expect(result.finalPrice).toBe(0);
  });

  it('cap de setmana: aplica multiplicador 1.10', () => {
    const result = applyDatePricing(1000, '2026-10-10'); // dissabte
    expect(result.appliedRule?.id).toBe('weekend');
    expect(result.finalPrice).toBe(1100);
    expect(result.surchargeEur).toBe(100);
    expect(result.surchargePct).toBe(10);
  });

  it('alta temporada: multiplicador 1.15', () => {
    const result = applyDatePricing(1000, '2026-07-15');
    expect(result.appliedRule?.id).toBe('high-season');
    expect(result.finalPrice).toBe(1150);
    expect(result.surchargeEur).toBe(150);
    expect(result.surchargePct).toBe(15);
  });

  it('Nochevieja: multiplicador 1.50, label segons locale', () => {
    const ca = applyDatePricing(1000, '2026-12-31', 'ca');
    expect(ca.appliedRule?.label).toBe('Recàrrec Cap d\'Any');
    expect(ca.finalPrice).toBe(1500);

    const es = applyDatePricing(1000, '2026-12-31', 'es');
    expect(es.appliedRule?.label).toBe('Recargo Nochevieja');

    const en = applyDatePricing(1000, '2026-12-31', 'en');
    expect(en.appliedRule?.label).toBe('New Year\'s Eve surcharge');
  });

  it('arrodoneix a 2 decimals', () => {
    const result = applyDatePricing(123.456, '2026-10-10'); // dissabte 1.10
    expect(result.basePrice).toBe(123.46);
    expect(result.finalPrice).toBe(135.80);
    expect(result.surchargeEur).toBeCloseTo(12.34, 2);
  });

  it('regla custom: pot rebre llista alternativa', () => {
    const customRules = [
      {
        id: 'custom',
        kind: 'recurring-weekday' as const,
        weekdays: [1], // dilluns
        multiplier: 2,
        label: { ca: 'Custom', es: 'Custom', en: 'Custom' },
        priority: 1,
      },
    ];
    const monday = applyDatePricing(100, '2026-10-12', 'ca', customRules);
    expect(monday.finalPrice).toBe(200);
    expect(monday.appliedRule?.id).toBe('custom');
  });

  it('canòniques: regles per defecte cobertes', () => {
    expect(DATE_PRICING_RULES.length).toBeGreaterThanOrEqual(4);
    const ids = DATE_PRICING_RULES.map((r) => r.id);
    expect(ids).toContain('weekend');
    expect(ids).toContain('high-season');
    expect(ids).toContain('christmas');
    expect(ids).toContain('new-year-eve');
  });
});
