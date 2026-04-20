import { PUBLIC_PORTFOLIO_SHOWCASE_ITEMS, getPublicPortfolioShowcasePhotos } from '@/lib/constants';
import { getManagedImageCollection } from '@/lib/services/imageManagerService';
import { listPortfolioPhotos } from '@/lib/services/galleryService';
import { listPortfolioMedia } from '@/lib/services/portfolioMediaService';

export type PublicPortfolioShowcaseStory = (typeof PUBLIC_PORTFOLIO_SHOWCASE_ITEMS)[number] & {
  photos: string[];
};

const SHOWCASE_WARNING_KEYS = new Set<string>();
const showcasePhotosCache = new Map<string, Promise<string[]>>();
let showcaseStoriesCache: Promise<PublicPortfolioShowcaseStory[]> | null = null;

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production';
}

function logShowcaseWarning(scope: string, slug: string, error: unknown) {
  const key = `${scope}:${slug}`;
  if (SHOWCASE_WARNING_KEYS.has(key)) return;
  SHOWCASE_WARNING_KEYS.add(key);
  console.error(`[public-portfolio-showcase] ${scope} fallback for ${slug}`, error);
}

async function resolveShowcasePhotos(slug: string, limit: number): Promise<string[]> {
  try {
    const mediaItems = await listPortfolioMedia(slug);
    const mediaPhotos = mediaItems
      .filter((item) => item.mediaType === 'image')
      .map((item) => item.mediaUrl)
      .slice(0, limit);

    if (mediaPhotos.length > 0) return mediaPhotos;
  } catch (error) {
    logShowcaseWarning('portfolio-media', slug, error);
  }

  try {
    const { photos } = await listPortfolioPhotos({ slug, limit, includeTotal: false });
    const bookingPhotos = photos.map((photo) => photo.photoUrl).slice(0, limit);
    if (bookingPhotos.length > 0) return bookingPhotos;
  } catch (error) {
    logShowcaseWarning('booking-gallery', slug, error);
  }

  return getPublicPortfolioShowcasePhotos(slug as never, limit);
}

async function getShowcasePhotos(slug: string, limit: number): Promise<string[]> {
  const cacheKey = `${slug}:${limit}`;

  if (!isProductionRuntime()) {
    return resolveShowcasePhotos(slug, limit);
  }

  const cached = showcasePhotosCache.get(cacheKey);
  if (cached) return cached;

  const next = resolveShowcasePhotos(slug, limit);
  showcasePhotosCache.set(cacheKey, next);
  return next;
}

async function resolvePortfolioShowcaseStories(): Promise<PublicPortfolioShowcaseStory[]> {
  let managedPool: string[] = [];
  let managedOffset = 0;

  try {
    const managedCollection = await getManagedImageCollection('home.portfolioShowcase');
    managedPool = managedCollection?.map((item) => item.src).filter(Boolean) || [];
  } catch (error) {
    logShowcaseWarning('managed-collection', 'home.portfolioShowcase', error);
  }

  const stories: PublicPortfolioShowcaseStory[] = [];

  for (const item of PUBLIC_PORTFOLIO_SHOWCASE_ITEMS) {
    const limit = Math.max(item.mobilePhotoCount, item.desktopPhotoCount);
    let photos: string[];

    if (managedPool.length > 0) {
      const nextChunk = managedPool.slice(managedOffset, managedOffset + limit);
      if (nextChunk.length > 0) {
        photos = nextChunk;
        managedOffset += limit;
      } else {
        photos = managedPool.slice(0, limit);
      }
    } else {
      photos = await getShowcasePhotos(item.slug, limit);
    }

    stories.push({
      ...item,
      photos,
    });
  }

  return stories;
}

export async function listPublicPortfolioShowcaseStories(): Promise<PublicPortfolioShowcaseStory[]> {
  if (!isProductionRuntime()) {
    return resolvePortfolioShowcaseStories();
  }

  if (!showcaseStoriesCache) {
    showcaseStoriesCache = resolvePortfolioShowcaseStories();
  }

  return showcaseStoriesCache;
}
