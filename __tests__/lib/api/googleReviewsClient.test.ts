import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicGoogleReviews } from '@/lib/api/googleReviewsClient';

const fetchMock = vi.fn();

Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true,
});

afterEach(() => {
  fetchMock.mockReset();
});

describe('fetchPublicGoogleReviews', () => {
  it('crida l\'endpoint canònic /api/google-reviews i retorna la resposta parsejada', async () => {
    const payload = {
      rating: 4.9,
      user_ratings_total: 73,
      reviews: [{ author_name: 'A', rating: 5, text: 'ok', time: 0, relative_time_description: '', source: 'google' }],
      source: 'google' as const,
      googleReviewsUrl: 'https://example.test',
      lastUpdated: '2026-04-26T00:00:00.000Z',
    };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    const result = await fetchPublicGoogleReviews();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/google-reviews', undefined);
    expect(result).toEqual(payload);
  });

  it('llança error amb status quan la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(fetchPublicGoogleReviews()).rejects.toThrow(/503/);
  });

  it('propaga init (signal, cache, headers) cap a fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        rating: 5,
        user_ratings_total: 0,
        reviews: [],
        source: 'json',
        googleReviewsUrl: '',
      }),
    });

    await fetchPublicGoogleReviews({ signal: controller.signal, cache: 'no-store' });

    expect(fetchMock).toHaveBeenCalledWith('/api/google-reviews', {
      signal: controller.signal,
      cache: 'no-store',
    });
  });
});
