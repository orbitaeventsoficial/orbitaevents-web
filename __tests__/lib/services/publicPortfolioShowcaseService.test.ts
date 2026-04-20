import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockListPortfolioMedia, mockListPortfolioPhotos, mockGetManagedImageCollection } = vi.hoisted(() => ({
  mockListPortfolioMedia: vi.fn(),
  mockListPortfolioPhotos: vi.fn(),
  mockGetManagedImageCollection: vi.fn(),
}));

vi.mock('@/lib/services/portfolioMediaService', () => ({
  listPortfolioMedia: mockListPortfolioMedia,
}));
vi.mock('@/lib/services/galleryService', () => ({
  listPortfolioPhotos: mockListPortfolioPhotos,
}));
vi.mock('@/lib/services/imageManagerService', () => ({
  getManagedImageCollection: mockGetManagedImageCollection,
}));
vi.mock('@/lib/constants', () => ({
  PUBLIC_PORTFOLIO_SHOWCASE_ITEMS: [
    { slug: 'boda-playa', title: 'Boda a la platja', mobilePhotoCount: 2, desktopPhotoCount: 4 },
    { slug: 'corporate', title: 'Corporatiu', mobilePhotoCount: 2, desktopPhotoCount: 3 },
  ],
  getPublicPortfolioShowcasePhotos: (slug: string, limit: number) =>
    Array.from({ length: limit }, (_, i) => `static-${slug}-${i}.jpg`),
}));

import { listPublicPortfolioShowcaseStories } from '@/lib/services/publicPortfolioShowcaseService';

beforeEach(() => {
  vi.clearAllMocks();
  // Force non-production to avoid cache
  vi.stubEnv('NODE_ENV', 'test');
});

describe('listPublicPortfolioShowcaseStories', () => {
  it('uses portfolioMedia as first source', async () => {
    mockGetManagedImageCollection.mockResolvedValue(null);
    mockListPortfolioMedia.mockResolvedValue([
      { mediaType: 'image', mediaUrl: '/media/boda1.jpg' },
      { mediaType: 'image', mediaUrl: '/media/boda2.jpg' },
      { mediaType: 'video', mediaUrl: '/media/boda.mp4' },
      { mediaType: 'image', mediaUrl: '/media/boda3.jpg' },
      { mediaType: 'image', mediaUrl: '/media/boda4.jpg' },
    ]);

    const stories = await listPublicPortfolioShowcaseStories();

    expect(stories[0].photos).toEqual(['/media/boda1.jpg', '/media/boda2.jpg', '/media/boda3.jpg', '/media/boda4.jpg']);
    expect(mockListPortfolioPhotos).not.toHaveBeenCalledWith(expect.objectContaining({ slug: 'boda-playa' }));
  });

  it('falls back to galleryService if portfolioMedia returns no images', async () => {
    mockGetManagedImageCollection.mockResolvedValue(null);
    mockListPortfolioMedia.mockResolvedValue([]);
    mockListPortfolioPhotos.mockResolvedValue({
      photos: [
        { photoUrl: '/gallery/g1.jpg' },
        { photoUrl: '/gallery/g2.jpg' },
        { photoUrl: '/gallery/g3.jpg' },
      ],
    });

    const stories = await listPublicPortfolioShowcaseStories();

    expect(stories[0].photos).toEqual(['/gallery/g1.jpg', '/gallery/g2.jpg', '/gallery/g3.jpg']);
  });

  it('falls back to static photos if both sources fail', async () => {
    mockGetManagedImageCollection.mockResolvedValue(null);
    mockListPortfolioMedia.mockRejectedValue(new Error('DB error'));
    mockListPortfolioPhotos.mockRejectedValue(new Error('gallery error'));

    const stories = await listPublicPortfolioShowcaseStories();

    expect(stories[0].photos[0]).toContain('static-boda-playa');
    expect(stories[0].photos.length).toBe(4); // max(2, 4) = 4
  });

  it('uses managed collection pool when available', async () => {
    mockGetManagedImageCollection.mockResolvedValue([
      { src: '/managed/m1.jpg' },
      { src: '/managed/m2.jpg' },
      { src: '/managed/m3.jpg' },
      { src: '/managed/m4.jpg' },
      { src: '/managed/m5.jpg' },
      { src: '/managed/m6.jpg' },
      { src: '/managed/m7.jpg' },
    ]);

    const stories = await listPublicPortfolioShowcaseStories();

    // First story gets first 4 (max(2,4))
    expect(stories[0].photos).toEqual(['/managed/m1.jpg', '/managed/m2.jpg', '/managed/m3.jpg', '/managed/m4.jpg']);
    // Second story gets next 3 (max(2,3))
    expect(stories[1].photos).toEqual(['/managed/m5.jpg', '/managed/m6.jpg', '/managed/m7.jpg']);
    // Should NOT call portfolioMedia or gallery
    expect(mockListPortfolioMedia).not.toHaveBeenCalled();
  });

  it('wraps managed pool when not enough photos for second story', async () => {
    mockGetManagedImageCollection.mockResolvedValue([
      { src: '/managed/a.jpg' },
      { src: '/managed/b.jpg' },
      { src: '/managed/c.jpg' },
      { src: '/managed/d.jpg' },
    ]);

    const stories = await listPublicPortfolioShowcaseStories();

    // First story uses all 4
    expect(stories[0].photos).toHaveLength(4);
    // Second story wraps back to the beginning (slice(0, 3))
    expect(stories[1].photos).toEqual(['/managed/a.jpg', '/managed/b.jpg', '/managed/c.jpg']);
  });

  it('returns correct structure with slug and title', async () => {
    mockGetManagedImageCollection.mockResolvedValue(null);
    mockListPortfolioMedia.mockResolvedValue([
      { mediaType: 'image', mediaUrl: '/photo.jpg' },
    ]);

    const stories = await listPublicPortfolioShowcaseStories();

    expect(stories[0]).toMatchObject({
      slug: 'boda-playa',
      title: 'Boda a la platja',
    });
    expect(stories[0].photos).toBeDefined();
    expect(stories).toHaveLength(2);
  });
});
