import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHeroMedia } from '@/lib/api/heroMediaClient';

const fetchMock = vi.fn();

Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true,
});

afterEach(() => {
  fetchMock.mockReset();
});

describe('fetchHeroMedia', () => {
  it('crida l\'endpoint canònic /api/hero-media i retorna la resposta parsejada', async () => {
    const payload = [
      { id: 'a', url: '/img/a.jpg', type: 'image' as const, label: 'Slide A' },
      { id: 'b', url: '/video/b.mp4', type: 'video' as const, label: 'Slide B' },
    ];
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    const result = await fetchHeroMedia();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/hero-media', undefined);
    expect(result).toEqual(payload);
  });

  it('llança error amb status quan la resposta no és OK', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    await expect(fetchHeroMedia()).rejects.toThrow(/503/);
  });

  it('propaga init (signal, cache, headers) cap a fetch', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await fetchHeroMedia({ signal: controller.signal, cache: 'no-store' });

    expect(fetchMock).toHaveBeenCalledWith('/api/hero-media', {
      signal: controller.signal,
      cache: 'no-store',
    });
  });
});
