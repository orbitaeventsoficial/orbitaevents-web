import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock globals de browser que no existeixen a jsdom/vitest
const revokeObjectURL = vi.fn();
const createObjectURL = vi.fn(() => 'blob:fake-url');
const appendChildSpy = vi.fn();
const removeChildSpy = vi.fn();
const clickSpy = vi.fn();

beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL,
    revokeObjectURL,
  });

  // Mock createElement per retornar un anchor fals
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return { href: '', download: '', click: clickSpy } as unknown as HTMLElement;
    }
    return document.createElement.call(document, tag);
  });
  vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildSpy);
  vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildSpy);

  globalThis.fetch = vi.fn().mockResolvedValue({
    blob: () => Promise.resolve(new Blob(['fake'], { type: 'image/jpeg' })),
  } as unknown as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

import { downloadImage, downloadImages } from '@/lib/utils/pdfDownload';

describe('downloadImage', () => {
  it('descarrega una imatge sense llançar error', async () => {
    await expect(downloadImage('https://example.com/img.jpg', 'test.jpg')).resolves.toBeUndefined();
    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/img.jpg');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });

  it('propaga errors de fetch', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    await expect(downloadImage('https://bad.url/img.jpg', 'fail.jpg')).rejects.toThrow('Network error');
  });
});

describe('downloadImages', () => {
  it('descarrega múltiples imatges amb prefix correcte', async () => {
    const images = [
      { src: 'https://example.com/a.jpg', alt: 'a' },
      { src: 'https://example.com/b.png', alt: 'b' },
    ];
    await downloadImages(images, 'orbita');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('usa prefix per defecte si no es passa', async () => {
    const images = [{ src: 'https://example.com/c.jpg', alt: 'c' }];
    await downloadImages(images);
    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/c.jpg');
  });
});
