import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/config/packs-config', () => ({
  EXTRAS: [
    { id: 'fog', name: 'Màquina de fum', description: 'Efecte fum', price: 50, consultarPrecio: false, icon: '💨', category: 'effects', popular: true, premium: false },
    { id: 'lights', name: 'Llums LED', description: 'Il·luminació', price: 80, consultarPrecio: false, icon: '💡', category: 'effects', popular: false, premium: false },
  ],
}));
vi.mock('@/lib/services/publicExtrasService', () => ({
  resolvePublicExtraDefinition: vi.fn(),
}));

import {
  getDefaultExtrasConfig,
  sanitizeExtrasConfig,
  getExtrasConfiguratorConfig,
  saveExtrasConfiguratorConfig,
} from '@/lib/services/extrasConfiguratorService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
});

describe('getDefaultExtrasConfig', () => {
  it('retorna còpia dels EXTRAS', () => {
    const config = getDefaultExtrasConfig();

    expect(config).toHaveLength(2);
    expect(config[0].id).toBe('fog');
    expect(config[1].id).toBe('lights');
  });
});

describe('sanitizeExtrasConfig', () => {
  it('retorna array buit per input no-array', () => {
    expect(sanitizeExtrasConfig(null)).toEqual([]);
    expect(sanitizeExtrasConfig('string')).toEqual([]);
    expect(sanitizeExtrasConfig(42)).toEqual([]);
  });

  it('filtra extras sense id o name', () => {
    const result = sanitizeExtrasConfig([
      { id: '', name: 'NoID' },
      { id: 'ok', name: '' },
      { id: 'valid', name: 'Valid' },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid');
  });

  it('normalitza camps', () => {
    const result = sanitizeExtrasConfig([
      { id: ' extra1 ', name: ' Nom ', description: ' Desc ', price: 100, consultarPrecio: true, icon: ' 🎵 ', category: 'audio', popular: false, premium: true },
    ]);

    expect(result[0]).toEqual(expect.objectContaining({
      id: 'extra1',
      name: 'Nom',
      description: 'Desc',
      price: 100,
      consultarPrecio: true,
      icon: '🎵',
      category: 'audio',
      popular: false,
      premium: true,
    }));
  });

  it('usa defaults per camps absents', () => {
    const result = sanitizeExtrasConfig([{ id: 'x', name: 'X' }]);

    expect(result[0].price).toBeNull();
    expect(result[0].consultarPrecio).toBe(false);
    expect(result[0].popular).toBe(false);
    expect(result[0].premium).toBe(false);
    expect(result[0].category).toBe('other');
  });
});

describe('getExtrasConfiguratorConfig', () => {
  it('retorna default si no hi ha setting', async () => {
    const result = await getExtrasConfiguratorConfig();

    expect(result.isDefault).toBe(true);
    expect(result.config).toHaveLength(2);
  });

  it('parseja config de BD', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify([{ id: 'custom', name: 'Custom Extra', description: '' }]),
    });

    const result = await getExtrasConfiguratorConfig();

    expect(result.isDefault).toBe(false);
    expect(result.config[0].id).toBe('custom');
  });

  it('retorna default si JSON invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'broken-json' });

    const result = await getExtrasConfiguratorConfig();

    expect(result.isDefault).toBe(true);
  });
});

describe('saveExtrasConfiguratorConfig', () => {
  it('sanititza i desa', async () => {
    const config = await saveExtrasConfiguratorConfig([
      { id: 'new', name: 'New Extra', description: 'Desc', price: 30 },
    ]);

    expect(config).toHaveLength(1);
    expect(config[0].id).toBe('new');
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'extras.configurator' },
      })
    );
  });
});
