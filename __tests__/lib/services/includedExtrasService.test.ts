import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  sanitizeIncludedExtrasMap,
  getIncludedExtrasMap,
  saveIncludedExtrasMap,
} from '@/lib/services/includedExtrasService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
});

// ─────────────────────────────────────────────────────────────────────────
// sanitizeIncludedExtrasMap (pure)
// ─────────────────────────────────────────────────────────────────────────
describe('sanitizeIncludedExtrasMap', () => {
  it('retorna {} per null/undefined', () => {
    expect(sanitizeIncludedExtrasMap(null)).toEqual({});
    expect(sanitizeIncludedExtrasMap(undefined)).toEqual({});
  });

  it('retorna {} per tipus invàlid', () => {
    expect(sanitizeIncludedExtrasMap('string')).toEqual({});
    expect(sanitizeIncludedExtrasMap(42)).toEqual({});
  });

  it('sanititza objecte vàlid', () => {
    const input = {
      'pack-basic': ['extra-hour', 'low-fog'],
      'pack-premium': ['sparklers'],
    };

    const result = sanitizeIncludedExtrasMap(input);

    expect(result['pack-basic']).toEqual(['extra-hour', 'low-fog']);
    expect(result['pack-premium']).toEqual(['sparklers']);
  });

  it('ignora entrades amb slug buit', () => {
    const result = sanitizeIncludedExtrasMap({ '': ['extra-hour'] });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('ignora entrades on IDs no és array', () => {
    const result = sanitizeIncludedExtrasMap({ 'pack-basic': 'not-array' });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('filtra IDs buits', () => {
    const result = sanitizeIncludedExtrasMap({ 'pack-basic': ['ok', '', null, 'ok2'] });
    expect(result['pack-basic']).toEqual(['ok', 'ok2']);
  });

  it('deduplicar IDs', () => {
    const result = sanitizeIncludedExtrasMap({ 'pack-basic': ['extra-hour', 'extra-hour', 'low-fog'] });
    expect(result['pack-basic']).toEqual(['extra-hour', 'low-fog']);
  });

  it('fa trim de slugs i IDs', () => {
    const result = sanitizeIncludedExtrasMap({ '  pack-basic  ': ['  extra-hour  '] });
    expect(result['pack-basic']).toEqual(['extra-hour']);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getIncludedExtrasMap
// ─────────────────────────────────────────────────────────────────────────
describe('getIncludedExtrasMap', () => {
  it('retorna {} si no hi ha setting', async () => {
    const result = await getIncludedExtrasMap();
    expect(result).toEqual({});
  });

  it('retorna mapa des de BD', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      value: JSON.stringify({ 'pack-basic': ['extra-hour'] }),
    });

    const result = await getIncludedExtrasMap();
    expect(result['pack-basic']).toEqual(['extra-hour']);
  });

  it('retorna {} si JSON invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'not-json' });

    const result = await getIncludedExtrasMap();
    expect(result).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────
// saveIncludedExtrasMap
// ─────────────────────────────────────────────────────────────────────────
describe('saveIncludedExtrasMap', () => {
  it('guarda i retorna mapa sanititzat', async () => {
    const input = { 'pack-basic': ['extra-hour', 'low-fog'] };

    const result = await saveIncludedExtrasMap(input);

    expect(result['pack-basic']).toEqual(['extra-hour', 'low-fog']);
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'packs.includedExtras' },
      })
    );
  });

  it('guarda {} si input invàlid', async () => {
    const result = await saveIncludedExtrasMap(null);
    expect(result).toEqual({});
  });
});
