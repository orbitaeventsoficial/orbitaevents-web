import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicPacks } from '@/lib/api/publicPacksClient';

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
  packs: [{ id: 'p1', name: 'Pack 1' }],
};

describe('fetchPublicPacks', () => {
  it("crida l'endpoint canònic /api/public/packs sense options i retorna la resposta parsejada", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    const result = await fetchPublicPacks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/public/packs', undefined);
    expect(result).toEqual(samplePayload);
  });

  it('afegeix service com a query param quan es proporciona', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicPacks({ service: 'bodas' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/packs?service=bodas', undefined);
  });

  it('afegeix locale com a query param quan es proporciona', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicPacks({ locale: 'ca' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/packs?locale=ca', undefined);
  });

  it('combina service i locale al query string', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicPacks({ service: 'bodas', locale: 'es' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/packs?service=bodas&locale=es', undefined);
  });

  it('escapa caràcters perillosos via URLSearchParams', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicPacks({ service: 'a&b=1', locale: 'ca?x' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/public/packs?service=a%26b%3D1&locale=ca%3Fx',
      undefined,
    );
  });

  it('llança error amb status quan la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(fetchPublicPacks()).rejects.toThrow(/503/);
  });

  it('propaga init (signal, cache) cap a fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchPublicPacks({ service: 'bodas' }, { signal: controller.signal, cache: 'no-store' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/packs?service=bodas', {
      signal: controller.signal,
      cache: 'no-store',
    });
  });
});
