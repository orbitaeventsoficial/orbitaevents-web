import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetOverride, mockGetCollection, mockListMedia, mockListPhotos } = vi.hoisted(() => ({
  mockGetOverride: vi.fn(),
  mockGetCollection: vi.fn(),
  mockListMedia: vi.fn(),
  mockListPhotos: vi.fn(),
}));

vi.mock('@/lib/services/imageManagerService', () => ({
  getManagedImageOverride: mockGetOverride,
  getManagedImageCollection: mockGetCollection,
}));

vi.mock('@/lib/services/portfolioMediaService', () => ({
  listPortfolioMedia: mockListMedia,
}));

vi.mock('@/lib/services/galleryService', () => ({
  listPortfolioPhotos: mockListPhotos,
}));

import {
  getPublicServiceHeroImage,
  getPublicServiceGalleryImages,
} from '@/lib/services/publicServiceMediaService';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetOverride.mockResolvedValue(null);
  mockGetCollection.mockResolvedValue(null);
  mockListMedia.mockResolvedValue([]);
  mockListPhotos.mockResolvedValue({ photos: [] });
});

// ---------------------------------------------------------------------------
// getPublicServiceHeroImage
// ---------------------------------------------------------------------------

describe('getPublicServiceHeroImage', () => {
  it('retorna override del manager si existeix', async () => {
    mockGetOverride.mockResolvedValue({ src: '/managed/hero.avif' });

    const result = await getPublicServiceHeroImage('bodas');
    expect(result).toBe('/managed/hero.avif');
    expect(mockGetOverride).toHaveBeenCalledWith('services.bodas.hero');
  });

  it('retorna imatge de PortfolioMedia si no hi ha override', async () => {
    mockListMedia.mockResolvedValue([
      { mediaType: 'image', mediaUrl: '/portfolio/bodas-01.avif' },
    ]);

    const result = await getPublicServiceHeroImage('bodas');
    expect(result).toBe('/portfolio/bodas-01.avif');
  });

  it('retorna booking photo si no hi ha media ni override', async () => {
    mockListPhotos.mockResolvedValue({
      photos: [{ photoUrl: '/bookings/photo1.avif' }],
    });

    const result = await getPublicServiceHeroImage('bodas');
    expect(result).toBe('/bookings/photo1.avif');
  });

  it('retorna fallback estatic si tot falla', async () => {
    const result = await getPublicServiceHeroImage('bodas');
    expect(result).toBe('/img/portfolio/bodas/bodas-01.avif');
  });

  it('mapeja halloween a themes.halloween.hero', async () => {
    mockGetOverride.mockResolvedValue({ src: '/managed/halloween.avif' });

    await getPublicServiceHeroImage('halloween');
    expect(mockGetOverride).toHaveBeenCalledWith('themes.halloween.hero');
  });
});

// ---------------------------------------------------------------------------
// getPublicServiceGalleryImages
// ---------------------------------------------------------------------------

describe('getPublicServiceGalleryImages', () => {
  it('retorna col·leccio del manager si existeix', async () => {
    mockGetCollection.mockResolvedValue([
      { src: '/managed/g1.avif' },
      { src: '/managed/g2.avif' },
    ]);

    const result = await getPublicServiceGalleryImages('bodas', 4);
    expect(result).toEqual(['/managed/g1.avif', '/managed/g2.avif']);
  });

  it('retorna override single del manager si no hi ha col·leccio', async () => {
    mockGetOverride.mockResolvedValue({ src: '/managed/single.avif' });

    const result = await getPublicServiceGalleryImages('bodas', 4);
    expect(result).toEqual(['/managed/single.avif']);
  });

  it('retorna fallback si tot falla', async () => {
    const result = await getPublicServiceGalleryImages('bodas', 4);
    expect(result).toEqual(['/img/portfolio/bodas/bodas-01.avif']);
  });

  it('deduplicar resultats', async () => {
    mockListMedia.mockResolvedValue([
      { mediaType: 'image', mediaUrl: '/same.avif' },
    ]);
    mockListPhotos.mockResolvedValue({
      photos: [{ photoUrl: '/same.avif' }],
    });

    const result = await getPublicServiceGalleryImages('bodas', 4);
    expect(result).toEqual(['/same.avif']);
  });
});
