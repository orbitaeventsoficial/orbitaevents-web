import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockComputeHealth, mockGetPricingConfig, mockTranslate } = vi.hoisted(() => ({
  mockPrisma: {
    pack: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
  mockComputeHealth: vi.fn(),
  mockGetPricingConfig: vi.fn(),
  mockTranslate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/packPricingHealth', () => ({
  computePackPricingHealth: mockComputeHealth,
  getPackPricingModelConfig: mockGetPricingConfig,
}));
vi.mock('@/lib/services/translationService', () => ({
  translateTextForLocale: mockTranslate,
}));
vi.mock('@/config/packs-config', () => ({ getAllPacks: () => [] }));
vi.mock('@/lib/pack-i18n', () => ({
  resolvePackI18nFeatures: () => [],
  resolvePackI18nKey: (key: string) => key,
}));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));

import {
  listAdminPacks,
  createAdminPack,
  getAdminPackById,
  updateAdminPack,
} from '@/lib/services/packAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.pack.findMany.mockResolvedValue([]);
  mockPrisma.pack.findUnique.mockResolvedValue(null);
  mockPrisma.pack.findFirst.mockResolvedValue(null);
  mockPrisma.pack.create.mockResolvedValue({ id: 'p1', slug: 'test' });
  mockPrisma.pack.update.mockResolvedValue({ id: 'p1', slug: 'updated' });
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockGetPricingConfig.mockResolvedValue({});
  mockComputeHealth.mockReturnValue({
    recommendedOperatorExtraHourPrice: 80,
    recommendedExtraHourPrice: 85,
  });
  mockTranslate.mockImplementation((text: string) => Promise.resolve(text));
});

describe('listAdminPacks', () => {
  it('retorna packs amb pricing health', async () => {
    mockPrisma.pack.findMany.mockResolvedValue([{ id: 'p1', slug: 'basic' }]);

    const result = await listAdminPacks('ca', false);

    expect(result.ok).toBe(true);
    expect(result.packs[0]).toHaveProperty('recommendedExtraHourPrice');
  });

  it('inclou inactius quan includeInactive', async () => {
    await listAdminPacks('ca', true);

    expect(mockPrisma.pack.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it('filtra actius per defecte', async () => {
    await listAdminPacks('ca', false);

    expect(mockPrisma.pack.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
  });
});

describe('createAdminPack', () => {
  it('retorna 400 sense slug', async () => {
    const result = await createAdminPack({ price: 500, djHours: 4 });

    expect(result.status).toBe(400);
  });

  it('retorna 400 sense price', async () => {
    const result = await createAdminPack({ slug: 'test', djHours: 4 });

    expect(result.status).toBe(400);
  });

  it('crea pack i adminLog', async () => {
    const result = await createAdminPack({
      slug: 'premium',
      price: 800,
      djHours: 5,
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.pack.create).toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalled();
  });
});

describe('getAdminPackById', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getAdminPackById('inexistent');

    expect(result.status).toBe(404);
  });

  it('retorna pack', async () => {
    mockPrisma.pack.findUnique.mockResolvedValue({ id: 'p1', slug: 'basic', translations: [] });

    const result = await getAdminPackById('p1');

    expect(result.status).toBe(200);
  });
});

describe('updateAdminPack', () => {
  it('retorna 400 si slug duplicat', async () => {
    mockPrisma.pack.findFirst.mockResolvedValue({ id: 'other', slug: 'used' });

    const result = await updateAdminPack('p1', { slug: 'used' });

    expect(result.status).toBe(400);
  });

  it('actualitza pack', async () => {
    const result = await updateAdminPack('p1', { price: 900 });

    expect(result.status).toBe(200);
    expect(mockPrisma.pack.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1' } })
    );
  });
});
