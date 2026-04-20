import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
}));

vi.mock('fs', () => ({
  default: { readFileSync: mockReadFileSync },
  readFileSync: mockReadFileSync,
}));

import { readStaticGoogleReviewsData } from '@/lib/services/googleReviewsStaticFile';

describe('readStaticGoogleReviewsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna dades parsejades del fitxer JSON', () => {
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ lastUpdated: '2026-04-17', total: 25, rating: 4.8, reviews: [{ text: 'Genial' }] })
    );

    const result = readStaticGoogleReviewsData();

    expect(result.total).toBe(25);
    expect(result.rating).toBe(4.8);
    expect(result.lastUpdated).toBe('2026-04-17');
    expect(result.reviews).toHaveLength(1);
  });

  it('retorna objecte buit si el fitxer no existeix', () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });

    const result = readStaticGoogleReviewsData();

    expect(result).toEqual({});
  });

  it('retorna objecte buit si el JSON es malformat', () => {
    mockReadFileSync.mockReturnValue('not-json{{{');

    const result = readStaticGoogleReviewsData();

    expect(result).toEqual({});
  });
});
