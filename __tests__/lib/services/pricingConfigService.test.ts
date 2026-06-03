import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    pricingConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { getEffectivePricingConfig, upsertPricingConfig } from '@/lib/services/pricingConfigService';
import { PRICING_INTELLIGENCE, SERVICE_HOURLY_RATES } from '@/lib/constants/pricing-intelligence';

beforeEach(() => { vi.clearAllMocks(); });

describe('getEffectivePricingConfig', () => {
  it('retorna fallback canònic quan la BD no té cap fila', async () => {
    mockPrisma.pricingConfig.findUnique.mockResolvedValue(null);
    const cfg = await getEffectivePricingConfig('PRIVATE_PARTY');
    expect(cfg.source).toBe('fallback');
    expect(cfg.targetMarginPct).toBe(PRICING_INTELLIGENCE.margin.TARGET_MARGIN_PCT);
    expect(cfg.rate.recommended).toBe(SERVICE_HOURLY_RATES.fiesta_privada.recommended);
  });

  it('retorna valors de BD quan existeix la fila', async () => {
    mockPrisma.pricingConfig.findUnique.mockResolvedValue({
      id: 'default',
      targetMarginPct: 45,
      ourHourlyRateByService: { fiesta_privada: { min: 100, recommended: 150, premium: 200 } },
      depositPctRecommended: 35,
      alertThresholds: {},
      equipmentAmortization: null,
    });
    const cfg = await getEffectivePricingConfig('PRIVATE_PARTY');
    expect(cfg.source).toBe('db');
    expect(cfg.targetMarginPct).toBe(45);
    expect(cfg.rate.recommended).toBe(150);
  });

  it('fa fallback per camp absent a la BD (camp parcial null)', async () => {
    mockPrisma.pricingConfig.findUnique.mockResolvedValue({
      id: 'default',
      targetMarginPct: null,
      ourHourlyRateByService: {},
      depositPctRecommended: null,
      alertThresholds: {},
      equipmentAmortization: null,
    });
    const cfg = await getEffectivePricingConfig('WEDDING');
    // targetMarginPct null → fallback canònic
    expect(cfg.targetMarginPct).toBe(PRICING_INTELLIGENCE.margin.TARGET_MARGIN_PCT);
    // servei boda sense configuració → fallback SERVICE_HOURLY_RATES
    expect(cfg.rate.recommended).toBe(SERVICE_HOURLY_RATES.boda_completa.recommended);
  });

  it('resol sonorització de boda separada del DJ', async () => {
    mockPrisma.pricingConfig.findUnique.mockResolvedValue(null);
    const cfg = await getEffectivePricingConfig({
      eventType: 'WEDDING',
      packName: 'Sonorització cerimònia',
      packService: 'cerimonia',
      djHours: 0,
      soundWatts: 2000,
    });
    expect(cfg.serviceKey).toBe('boda_sonorizacion');
    expect(cfg.rate.recommended).toBe(SERVICE_HOURLY_RATES.boda_sonorizacion.recommended);
  });

  it('aplica tarifa BD per una clau nova de servei', async () => {
    mockPrisma.pricingConfig.findUnique.mockResolvedValue({
      id: 'default',
      targetMarginPct: 45,
      ourHourlyRateByService: {
        sonorizacion: { min: 90, recommended: 125, premium: 180 },
      },
      depositPctRecommended: 30,
      alertThresholds: {},
      equipmentAmortization: null,
    });
    const cfg = await getEffectivePricingConfig({
      packName: 'Sonorització sala',
      djHours: 0,
      soundWatts: 1200,
    });
    expect(cfg.serviceKey).toBe('sonorizacion');
    expect(cfg.rate).toEqual({ min: 90, recommended: 125, premium: 180 });
  });

  it('retorna fallback si la BD llança error', async () => {
    mockPrisma.pricingConfig.findUnique.mockRejectedValue(new Error('DB error'));
    const cfg = await getEffectivePricingConfig('CORPORATE');
    expect(cfg.source).toBe('fallback');
    expect(cfg.serviceKey).toBe('empresa');
  });

  it('resol eventType desconegut a fiesta_privada', async () => {
    mockPrisma.pricingConfig.findUnique.mockResolvedValue(null);
    const cfg = await getEffectivePricingConfig('TIPUS_INEXISTENT');
    expect(cfg.serviceKey).toBe('fiesta_privada');
  });
});

describe('upsertPricingConfig', () => {
  it('crida upsert amb les dades correctes', async () => {
    const mockResult = { id: 'default', targetMarginPct: 42 };
    mockPrisma.pricingConfig.upsert.mockResolvedValue(mockResult);
    const result = await upsertPricingConfig({ targetMarginPct: 42 });
    expect(mockPrisma.pricingConfig.upsert).toHaveBeenCalledOnce();
    expect(result).toEqual(mockResult);
  });
});
