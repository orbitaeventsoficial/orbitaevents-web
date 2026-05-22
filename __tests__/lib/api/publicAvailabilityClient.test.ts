import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicAvailability } from '@/lib/api/publicAvailabilityClient';

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
  data: {
    nextAvailableDate: '2026-06-15',
    nextAvailableSaturday: '2026-06-20',
    monthlyAvailability: [],
    scarcityMessage: 'Nomes 3 dissabtes lliures',
    urgencyLevel: 'medium' as const,
  },
  generatedAt: '2026-05-05T00:00:00.000Z',
};

describe('fetchPublicAvailability', () => {
  it("crida l'endpoint canònic /api/public/availability sense locale i retorna la resposta parsejada", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    const result = await fetchPublicAvailability();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/public/availability', undefined);
    expect(result).toEqual(samplePayload);
  });

  it('afegeix locale com a query param quan es proporciona', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicAvailability('ca');

    expect(fetchMock).toHaveBeenCalledWith('/api/public/availability?locale=ca', undefined);
  });

  it('escapa caràcters perillosos al locale via encodeURIComponent', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicAvailability('es&hack=1');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/public/availability?locale=es%26hack%3D1',
      undefined,
    );
  });

  it('llança error amb status quan la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    });

    await expect(fetchPublicAvailability()).rejects.toThrow(/502/);
  });

  it('propaga init (signal, cache) cap a fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicAvailability('en', { signal: controller.signal, cache: 'no-store' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/availability?locale=en', {
      signal: controller.signal,
      cache: 'no-store',
    });
  });
});
