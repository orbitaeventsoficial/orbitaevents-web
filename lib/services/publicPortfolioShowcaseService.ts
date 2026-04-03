import { PUBLIC_PORTFOLIO_SHOWCASE_ITEMS, getPublicPortfolioShowcasePhotos } from '@/lib/constants';
import { getManagedImageCollection } from '@/lib/services/imageManagerService';
import { listPortfolioPhotos } from '@/lib/services/galleryService';
import { listPortfolioMedia } from '@/lib/services/portfolioMediaService';

export type PublicPortfolioShowcaseStory = (typeof PUBLIC_PORTFOLIO_SHOWCASE_ITEMS)[number] & {
  photos: string[];
};

async function getShowcasePhotos(slug: string, limit: number): Promise<string[]> {
  try {
    const mediaItems = await listPortfolioMedia(slug);
    const mediaPhotos = mediaItems
      .filter((item) => item.mediaType === 'image')
      .map((item) => item.mediaUrl)
      .slice(0, limit);

    if (mediaPhotos.length > 0) return mediaPhotos;
  } catch {
    // continuar amb booking photos
  }

  try {
    const { photos } = await listPortfolioPhotos({ slug, limit });
    const bookingPhotos = photos.map((photo) => photo.photoUrl).slice(0, limit);
    if (bookingPhotos.length > 0) return bookingPhotos;
  } catch {
    // mantenir fallback estàtic
  }

  return getPublicPortfolioShowcasePhotos(slug as never, limit);
}

export async function listPublicPortfolioShowcaseStories(): Promise<PublicPortfolioShowcaseStory[]> {
  const managedCollection = await getManagedImageCollection('home.portfolioShowcase');
  let managedPool = managedCollection?.map((item) => item.src).filter(Boolean) || [];
  let managedOffset = 0;

  return Promise.all(
    PUBLIC_PORTFOLIO_SHOWCASE_ITEMS.map(async (item) => {
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

      return {
        ...item,
        photos,
      };
    })
  );
}
