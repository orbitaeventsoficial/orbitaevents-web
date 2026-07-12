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
  listHeroMedia,
  listActiveHeroMedia,
} from '@/lib/services/heroVideoService';

const SETTING_KEY = 'config.heroMedia';

const sampleMedia = [
  { id: 'v1', url: '/videos/hero.mp4', type: 'video', label: 'Vídeo 1', active: true, sortOrder: 0 },
  { id: 'i1', url: '/img/foto.avif', type: 'image', label: 'Imatge 1', active: true, sortOrder: 1 },
  { id: 'i2', url: '/img/foto2.avif', type: 'image', label: 'Imatge 2', active: false, sortOrder: 2 },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.upsert.mockResolvedValue({});
});

describe('listHeroMedia', () => {
  it('retorna defaults si no hi ha setting', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);
    const result = await listHeroMedia();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('type');
  });

  it('retorna media desada ordenada per sortOrder', async () => {
    const reversed = [...sampleMedia].reverse();
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(reversed),
    });
    const result = await listHeroMedia();
    expect(result[0].id).toBe('v1');
    expect(result[1].id).toBe('i1');
    expect(result[2].id).toBe('i2');
  });

  it('retorna defaults si JSON és invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: 'not-json',
    });
    const result = await listHeroMedia();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
  });
});

describe('listActiveHeroMedia', () => {
  it('filtra només els actius', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(sampleMedia),
    });
    const result = await listActiveHeroMedia();
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.active)).toBe(true);
  });

  it('retorna buit si cap és actiu', async () => {
    const allInactive = sampleMedia.map((m) => ({ ...m, active: false }));
    mockPrisma.setting.findUnique.mockResolvedValue({
      key: SETTING_KEY,
      value: JSON.stringify(allInactive),
    });
    const result = await listActiveHeroMedia();
    expect(result).toHaveLength(0);
  });
});
