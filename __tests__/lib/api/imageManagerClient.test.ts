import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchImageManager } from '@/lib/api/imageManagerClient';

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
    'layout.logo.header': {
      item: { src: '/img/logo.svg', alt: 'Òrbita' },
    },
  },
};

describe('fetchImageManager', () => {
  it("crida l'endpoint canònic /api/public/image-manager amb una sola key string", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    const result = await fetchImageManager('layout.logo.header');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/public/image-manager?key=layout.logo.header',
      undefined,
    );
    expect(result).toEqual(samplePayload);
  });

  it('accepta una llista de keys i les afegeix com a múltiples params `key`', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchImageManager(['layout.logo.header', 'layout.logo.admin']);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/public/image-manager?key=layout.logo.header&key=layout.logo.admin',
      undefined,
    );
  });

  it('escapa caràcters perillosos a la key via URLSearchParams', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchImageManager('a&b=1');

    expect(fetchMock).toHaveBeenCalledWith('/api/public/image-manager?key=a%26b%3D1', undefined);
  });

  it('accepta llista buida (sense keys) i envia URL amb query buit', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchImageManager([]);

    expect(fetchMock).toHaveBeenCalledWith('/api/public/image-manager?', undefined);
  });

  it('llança error amb status quan la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(fetchImageManager('layout.logo.header')).rejects.toThrow(/500/);
  });

  it('propaga init (signal, cache) cap a fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });

    await fetchImageManager('k', { signal: controller.signal, cache: 'no-store' });

    expect(fetchMock).toHaveBeenCalledWith('/api/public/image-manager?key=k', {
      signal: controller.signal,
      cache: 'no-store',
    });
  });
});

describe('fetchImageManager — inflight deduplication', () => {
  it('coalesceix dues crides concurrents sense signal en una sola petició HTTP', async () => {
    vi.resetModules();
    const localFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });
    globalThis.fetch = localFetch;

    const { fetchImageManager: dedupFetch } = await import('@/lib/api/imageManagerClient');

    const [r1, r2] = await Promise.all([
      dedupFetch('layout.logo.header', { cache: 'no-store' }),
      dedupFetch('layout.logo.header', { cache: 'no-store' }),
    ]);

    expect(localFetch).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(samplePayload);
    expect(r2).toEqual(samplePayload);
  });

  it('NO coalesceix si les keys difereixen (dues crides legítimes separades)', async () => {
    vi.resetModules();
    const localFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });
    globalThis.fetch = localFetch;

    const { fetchImageManager: dedupFetch } = await import('@/lib/api/imageManagerClient');

    await Promise.all([
      dedupFetch('layout.logo.header', { cache: 'no-store' }),
      dedupFetch('layout.logo.admin', { cache: 'no-store' }),
    ]);

    expect(localFetch).toHaveBeenCalledTimes(2);
  });

  it('NO coalesceix si hi ha signal (AbortController) — cada caller és independent', async () => {
    vi.resetModules();
    const localFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => samplePayload,
    });
    globalThis.fetch = localFetch;

    const { fetchImageManager: dedupFetch } = await import('@/lib/api/imageManagerClient');
    const c1 = new AbortController();
    const c2 = new AbortController();

    const [r1, r2] = await Promise.all([
      dedupFetch('layout.logo.header', { signal: c1.signal }),
      dedupFetch('layout.logo.header', { signal: c2.signal }),
    ]);

    expect(localFetch).toHaveBeenCalledTimes(2);
    expect(r1).toEqual(samplePayload);
    expect(r2).toEqual(samplePayload);
  });
});
