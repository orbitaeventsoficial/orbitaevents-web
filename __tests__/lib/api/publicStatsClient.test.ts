import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicStats } from '@/lib/api/publicStatsClient';

const fetchMock = vi.fn();

Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true,
});

afterEach(() => {
  fetchMock.mockReset();
});

const samplePayload = {
  ok: true,
  stats: {
    yearsExperience: '+3 anys',
    coverage: 'Catalunya',
    responseTime: '2h',
    yearStarted: 2023,
    peopleEntertained: 0,
    technicalIncidents: 0,
    totalEvents: 67,
    totalWeddings: 12,
    totalCorporate: 8,
    totalParties: 47,
    averageRating: 4.9,
    googleRating: 4.9,
    googleReviewsCount: 73,
  },
  generatedAt: '2026-04-27T00:00:00.000Z',
};

describe('fetchPublicStats', () => {
  it("crida l'endpoint canònic /api/public/stats sense locale i retorna la resposta parsejada", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    const result = await fetchPublicStats();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/public/stats', undefined);
    expect(result).toEqual(samplePayload);
  });

  it('afegeix locale com a query param quan es proporciona', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicStats('ca');

    expect(fetchMock).toHaveBeenCalledWith('/api/public/stats?locale=ca', undefined);
  });

  it('escapa caràcters perillosos al locale via encodeURIComponent', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicStats('es&hack=1');

    expect(fetchMock).toHaveBeenCalledWith('/api/public/stats?locale=es%26hack%3D1', undefined);
  });

  it('llança error amb status quan la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(fetchPublicStats()).rejects.toThrow(/503/);
  });

  it('propaga init (signal, cache) cap a fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicStats('en', { signal: controller.signal, cache: 'no-store' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/stats?locale=en', {
      signal: controller.signal,
      cache: 'no-store',
    });
  });
});
