import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findMany: vi.fn(), upsert: vi.fn() },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminFeatures,
  updateAdminFeature,
  isAdminFeatureKey,
} from '@/lib/services/adminFeaturesService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findMany.mockResolvedValue([]);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('listAdminFeatures', () => {
  it('retorna 6 funcionalitats', async () => {
    const result = await listAdminFeatures();
    expect(result).toHaveLength(6);
  });

  it('enabled per defecte si no hi ha setting', async () => {
    const result = await listAdminFeatures();
    for (const feature of result) {
      expect(feature.enabled).toBe(true);
    }
  });

  it('respecta settings de BD', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'features.reviews_enabled', value: 'false' },
      { key: 'features.blog_enabled', value: 'true' },
    ]);

    const result = await listAdminFeatures();
    const reviews = result.find((f) => f.key === 'features.reviews_enabled');
    const blog = result.find((f) => f.key === 'features.blog_enabled');

    expect(reviews!.enabled).toBe(false);
    expect(blog!.enabled).toBe(true);
  });
});

describe('updateAdminFeature', () => {
  it('actualitza feature vàlida', async () => {
    await updateAdminFeature({ key: 'features.blog_enabled', enabled: false });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'features.blog_enabled' },
        update: { value: 'false' },
      })
    );
  });

  it('crea adminLog', async () => {
    await updateAdminFeature({ key: 'features.blog_enabled', enabled: true });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPDATE',
        entity: 'feature',
        entityId: 'features.blog_enabled',
      }),
    });
  });

  it('llança error per feature invàlida', async () => {
    await expect(
      updateAdminFeature({ key: 'features.invalid', enabled: true })
    ).rejects.toThrow('no vàlida');
  });
});

describe('isAdminFeatureKey', () => {
  it('retorna true per claus vàlides', () => {
    expect(isAdminFeatureKey('features.reviews_enabled')).toBe(true);
    expect(isAdminFeatureKey('features.blog_enabled')).toBe(true);
    expect(isAdminFeatureKey('features.configurator_enabled')).toBe(true);
  });

  it('retorna false per claus invàlides', () => {
    expect(isAdminFeatureKey('features.invalid')).toBe(false);
    expect(isAdminFeatureKey('something')).toBe(false);
  });
});
