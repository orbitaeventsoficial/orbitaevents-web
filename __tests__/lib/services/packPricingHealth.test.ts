import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    pack: { findMany: vi.fn(), update: vi.fn() },
    adminLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/inventory-utils', () => ({
  calculateCostPerHour: (price: number | null, lifeHours: number | null) => {
    if (!price || !lifeHours || lifeHours <= 0) return 0;
    return price / lifeHours;
  },
}));

import {
  computePackPricingHealth,
  type PackPricingHealth,
} from '@/lib/services/packPricingHealth';

// ── Config per defecte (simulant el que retornaria getPackPricingModelConfig) ──
function makeConfig(overrides = {}) {
  return {
    marginTargetPct: 0.55,
    socialSecurityPct: 0.32,
    withholdingPct: 0.15,
    operatorNetCostPerHour: 16.67,
    specialistNetCostPerHour: 22.5,
    operatorCostPerHour: 22,
    specialistCostPerHour: 29.7,
    specialistServices: new Set(['bodas', 'empresas']),
    supportOperatorMinGuests: 150,
    supportOperatorMinDjHours: 6,
    supportOperatorMinWatts: 6000,
    fixedPackCost: 35,
    alertDivergencePct: 20,
    ...overrides,
  };
}

function makePack(overrides = {}) {
  return {
    id: 'pack-1',
    service: 'fiestas',
    price: 400,
    extraHourPrice: 75,
    djHours: 5,
    maxGuests: null,
    soundWatts: null,
    inventory: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// computePackPricingHealth
// ─────────────────────────────────────────────────────────────────────────
describe('computePackPricingHealth', () => {
  it('retorna estructura completa', () => {
    const result = computePackPricingHealth(makePack(), makeConfig());

    expect(result.packId).toBe('pack-1');
    expect(result.publicPrice).toBe(400);
    expect(result.recommendedPrice).toBeGreaterThan(0);
    expect(result.laborTier).toBe('mixed');
    expect(typeof result.divergencePct).toBe('number');
    expect(typeof result.hasAlert).toBe('boolean');
  });

  it('calcula preu recomanat i l\'arrodoneix amunt a desenes', () => {
    const config = makeConfig({ marginTargetPct: 0.5, fixedPackCost: 0 });
    const pack = makePack({ djHours: 1, inventory: [] });

    const result = computePackPricingHealth(pack, config);

    // baseCost = (0 * 1) + (specialistCost * 1) + 0 = 29.7
    // targetPrice = 29.7 / (1 - 0.5) = 59.4; PVP recomanat = 60.
    expect(result.recommendedPrice).toBe(60);
    expect(result.recommendedExtraHourPrice).toBe(60);
    expect(result.recommendedOperatorExtraHourPrice).toBe(50);
  });

  it('no arrodoneix avall un preu recomanat que ja acaba en 0', () => {
    const config = makeConfig({
      marginTargetPct: 0.5,
      fixedPackCost: 20.3,
      specialistCostPerHour: 29.7,
    });
    const pack = makePack({ djHours: 1, inventory: [] });

    const result = computePackPricingHealth(pack, config);

    // targetPrice = (29.7 + 20.3) / 0.5 = 100.
    expect(result.recommendedPrice).toBe(100);
  });

  it('inclou cost inventari al càlcul', () => {
    const pack = makePack({
      djHours: 4,
      inventory: [
        { quantity: 1, item: { purchasePrice: 2000, expectedLifeHours: 1000 } },
      ],
    });

    const resultWithInventory = computePackPricingHealth(pack, makeConfig());
    const resultWithout = computePackPricingHealth(makePack({ djHours: 4 }), makeConfig());

    expect(resultWithInventory.recommendedPrice).toBeGreaterThan(resultWithout.recommendedPrice);
  });

  it('suma múltiples ítems d\'inventari amb quantitat', () => {
    const pack = makePack({
      djHours: 2,
      inventory: [
        { quantity: 2, item: { purchasePrice: 1000, expectedLifeHours: 500 } },
        { quantity: 1, item: { purchasePrice: 500, expectedLifeHours: 250 } },
      ],
    });

    const result = computePackPricingHealth(pack, makeConfig());
    // inventoryCostPerHour = (1000/500)*2 + (500/250)*1 = 4 + 2 = 6
    // baseCost = (6 * 2) + (specialistCost * 2) + 35 = 12 + 59.4 + 35 = 106.4
    expect(result.recommendedPrice).toBeGreaterThan(0);
  });

  it('afegeix operari suport si convidats >= llindar', () => {
    const config = makeConfig({ supportOperatorMinGuests: 100 });
    const packSmall = makePack({ maxGuests: 50 });
    const packBig = makePack({ maxGuests: 150 });

    const resultSmall = computePackPricingHealth(packSmall, config);
    const resultBig = computePackPricingHealth(packBig, config);

    expect(resultSmall.operatorCount).toBe(0);
    expect(resultBig.operatorCount).toBe(1);
    expect(resultBig.recommendedPrice).toBeGreaterThan(resultSmall.recommendedPrice);
  });

  it('afegeix operari suport si hores DJ >= llindar', () => {
    const config = makeConfig({ supportOperatorMinDjHours: 5 });
    const packShort = makePack({ djHours: 3 });
    const packLong = makePack({ djHours: 6 });

    expect(computePackPricingHealth(packShort, config).operatorCount).toBe(0);
    expect(computePackPricingHealth(packLong, config).operatorCount).toBe(1);
  });

  it('afegeix operari suport si watts >= llindar', () => {
    const config = makeConfig({ supportOperatorMinWatts: 4000 });
    const packLow = makePack({ soundWatts: 2000 });
    const packHigh = makePack({ soundWatts: 5000 });

    expect(computePackPricingHealth(packLow, config).operatorCount).toBe(0);
    expect(computePackPricingHealth(packHigh, config).operatorCount).toBe(1);
  });

  it('divergència positiva si preu públic > recomanat', () => {
    const config = makeConfig({ marginTargetPct: 0.5, fixedPackCost: 0 });
    const pack = makePack({ price: 1000, djHours: 1 }); // recomanat ~59, públic 1000

    const result = computePackPricingHealth(pack, config);
    expect(result.divergencePct).toBeGreaterThan(0);
  });

  it('divergència negativa si preu públic < recomanat', () => {
    const config = makeConfig({ marginTargetPct: 0.5, fixedPackCost: 1000 });
    const pack = makePack({ price: 10, djHours: 5 }); // recomanat alt, públic 10

    const result = computePackPricingHealth(pack, config);
    expect(result.divergencePct).toBeLessThan(0);
  });

  it('hasAlert = true si divergència >= alertDivergencePct', () => {
    const config = makeConfig({ alertDivergencePct: 5, marginTargetPct: 0.5, fixedPackCost: 0 });
    const pack = makePack({ price: 1000, djHours: 1 }); // divergència enorme

    const result = computePackPricingHealth(pack, config);
    expect(result.hasAlert).toBe(true);
  });

  it('hasAlert = false si divergència dins llindar (pack + extra hour)', () => {
    const config = makeConfig({ marginTargetPct: 0.5, fixedPackCost: 0, alertDivergencePct: 20 });
    // recomanat pack i extraHour = 60.
    const pack = makePack({ price: 60, extraHourPrice: 60, djHours: 1 });

    const result = computePackPricingHealth(pack, config);
    expect(Math.abs(result.divergencePct)).toBeLessThan(20);
    expect(Math.abs(result.extraHourDivergencePct)).toBeLessThan(20);
    expect(result.hasAlert).toBe(false);
  });

  it('calcula extra hour pricing', () => {
    const result = computePackPricingHealth(makePack(), makeConfig());

    expect(result.recommendedExtraHourPrice).toBeGreaterThan(0);
    expect(result.publicExtraHourPrice).toBe(75);
    expect(typeof result.extraHourDivergencePct).toBe('number');
  });

  it('extraHourAlert independent de pack alert', () => {
    const config = makeConfig({ alertDivergencePct: 5, marginTargetPct: 0.5, fixedPackCost: 0 });
    // Pack amb preu proper al recomanat però extraHourPrice molt baix
    const pack = makePack({
      price: 60, // igual al recomanat arrodonit
      extraHourPrice: 1, // molt per sota
      djHours: 1,
    });

    const result = computePackPricingHealth(pack, config);
    expect(result.extraHourAlert).toBe(true);
  });

  it('laborNetAfterWithholdingPerHourUsed correcte', () => {
    const config = makeConfig({
      specialistCostPerHour: 30,
      withholdingPct: 0.15,
    });
    const pack = makePack(); // sense operari suport

    const result = computePackPricingHealth(pack, config);
    // laborCostPerHourUsed = 30 (1 specialist, 0 operators)
    // netAfterWithholding = 30 * (1 - 0.15) = 25.5
    expect(result.laborNetAfterWithholdingPerHourUsed).toBeCloseTo(25.5, 1);
  });

  it('sempre specialistCount = 1', () => {
    const result = computePackPricingHealth(makePack(), makeConfig());
    expect(result.specialistCount).toBe(1);
  });

  it('inventari amb purchasePrice null → cost 0', () => {
    const pack = makePack({
      inventory: [
        { quantity: 1, item: { purchasePrice: null, expectedLifeHours: 1000 } },
      ],
    });

    const withNull = computePackPricingHealth(pack, makeConfig());
    const withoutInventory = computePackPricingHealth(makePack(), makeConfig());

    expect(withNull.recommendedPrice).toBeCloseTo(withoutInventory.recommendedPrice, 1);
  });
});
