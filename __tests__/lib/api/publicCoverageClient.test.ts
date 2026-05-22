import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicCoverage } from '@/lib/api/publicCoverageClient';

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
  areas: [{ slug: 'barcelona' }],
  cities: [{ name: 'Girona' }],
};

describe('fetchPublicCoverage', () => {
  it("crida l'endpoint canònic /api/public/coverage i retorna la resposta parsejada", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    const result = await fetchPublicCoverage();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/public/coverage', undefined);
    expect(result).toEqual(samplePayload);
  });

  it('llança error amb status quan la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(fetchPublicCoverage()).rejects.toThrow(/503/);
  });

  it('propaga init (signal, cache) cap a fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicCoverage({ signal: controller.signal, cache: 'no-store' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/coverage', {
      signal: controller.signal,
      cache: 'no-store',
    });
  });

  it('retorna resposta amb areas/cities buits si el servidor torna `{ok:true}` sense dades', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const result = await fetchPublicCoverage();
    expect(result.ok).toBe(true);
    expect(result.areas).toBeUndefined();
    expect(result.cities).toBeUndefined();
  });
});
