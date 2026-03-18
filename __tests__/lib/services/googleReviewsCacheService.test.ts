import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  writeGoogleReviewsCache,
  readGoogleReviewsCache,
} from '@/lib/services/googleReviewsCacheService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.upsert.mockResolvedValue({});
});

describe('writeGoogleReviewsCache', () => {
  it('escriu cache amb rating, total i reviews', async () => {
    const reviews = [
      { author_name: 'Anna', rating: 5, text: 'Genial!', time: 1234, relative_time_description: 'fa 1 dia' },
    ];

    const result = await writeGoogleReviewsCache({ rating: 4.8, total: 50, reviews });

    expect(result.rating).toBe(4.8);
    expect(result.total).toBe(50);
    expect(result.reviews).toEqual(reviews);
    expect(result.lastUpdated).toBeDefined();
    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(3);
  });

  it('guarda JSON complet a cache.googleReviews', async () => {
    await writeGoogleReviewsCache({ rating: 4.5, total: 10, reviews: [] });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'cache.googleReviews' },
        update: { value: expect.stringContaining('"rating":4.5') },
      }),
    );
  });

  it('guarda rating i count com a stats separades', async () => {
    await writeGoogleReviewsCache({ rating: 4.9, total: 100, reviews: [] });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'stats.googleRating' },
        update: { value: '4.9' },
      }),
    );
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'stats.googleReviewCount' },
        update: { value: '100' },
      }),
    );
  });
});

describe('readGoogleReviewsCache', () => {
  it('retorna cache parsejat', async () => {
    const payload = {
      lastUpdated: '2026-03-18T10:00:00Z',
      rating: 4.8,
      total: 50,
      reviews: [{ author_name: 'Test', rating: 5, text: 'Bé', time: 1, relative_time_description: 'ara' }],
    };
    mockPrisma.setting.findUnique.mockResolvedValue({ value: JSON.stringify(payload) });

    const result = await readGoogleReviewsCache();

    expect(result).toEqual(payload);
  });

  it('retorna null si no hi ha cache', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);

    expect(await readGoogleReviewsCache()).toBeNull();
  });

  it('retorna null si value és buit', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '' });

    expect(await readGoogleReviewsCache()).toBeNull();
  });

  it('retorna null si JSON és invàlid', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'not json' });

    expect(await readGoogleReviewsCache()).toBeNull();
  });

  it('retorna null si reviews no és array', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: JSON.stringify({ reviews: 'no' }) });

    expect(await readGoogleReviewsCache()).toBeNull();
  });
});
