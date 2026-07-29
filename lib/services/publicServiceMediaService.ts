import { PUBLIC_SERVICE_MEDIA_CONFIG, type PublicServiceMediaKey } from '@/lib/constants/public-service-media';

export type { PublicMobileServiceCardId, PublicServiceMediaKey } from '@/lib/constants/public-service-media';
import { listPortfolioPhotos } from '@/lib/services/galleryService';
import { listPortfolioMedia } from '@/lib/services/portfolioMediaService';
import { getManagedImageCollection, getManagedImageOverride } from '@/lib/services/imageManagerService';

type ServiceMediaSnapshot = {
  managedHeroSrc: string | null;
  managedGalleryImages: string[];
  mediaImages: string[];
  bookingImages: string[];
  fallbackImage: string;
};

const PUBLIC_MEDIA_LOOKUP_LIMIT = 12;
const warningKeys = new Set<string>();
const serviceMediaSnapshotCache = new Map<PublicServiceMediaKey, Promise<ServiceMediaSnapshot>>();

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function logPublicMediaWarning(scope: string, key: string, error: unknown) {
  const warningKey = `${scope}:${key}`;
  if (warningKeys.has(warningKey)) return;
  warningKeys.add(warningKey);
  console.error(`[public-media] ${scope} fallback for ${key}`, error);
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production';
}

function getManagedHeroPlacementKey(key: PublicServiceMediaKey): string | null {
  switch (key) {
    case 'bodas': return 'services.bodas.hero';
    case 'fiestas': return 'services.fiestas.hero';
    case 'empresas': return 'services.empresas.hero';
    case 'discomovil': return 'services.discomovil.hero';
    case 'halloween': return 'themes.halloween.hero';
    case 'monmagic': return 'themes.monmagic.hero';
    default: return null;
  }
}

function getManagedGalleryPlacementKey(key: PublicServiceMediaKey): string | null {
  switch (key) {
    case 'bodas': return 'services.bodas.gallery';
    case 'fiestas': return 'services.fiestas.gallery';
    case 'discomovil': return 'services.discomovil.gallery';
    case 'halloween': return 'themes.halloween.gallery';
    case 'monmagic': return 'themes.monmagic.gallery';
    default: return null;
  }
}

async function resolveServiceMediaSnapshot(key: PublicServiceMediaKey): Promise<ServiceMediaSnapshot> {
  const config = PUBLIC_SERVICE_MEDIA_CONFIG[key];
  const managedHeroPlacementKey = getManagedHeroPlacementKey(key);
  const managedGalleryPlacementKey = getManagedGalleryPlacementKey(key);

  let managedHeroSrc: string | null = null;
  let managedGalleryImages: string[] = [];
  let mediaImages: string[] = [];
  let bookingImages: string[] = [];

  if (managedHeroPlacementKey) {
    try {
      const managed = await getManagedImageOverride(managedHeroPlacementKey);
      if (managed?.src) managedHeroSrc = managed.src;
    } catch (error) {
      logPublicMediaWarning('managed-hero', key, error);
    }
  }

  if (managedGalleryPlacementKey) {
    try {
      const managedItems = await getManagedImageCollection(managedGalleryPlacementKey);
      if (managedItems?.length) {
        managedGalleryImages = managedItems.map((item) => item.src).filter(Boolean);
      } else {
        const managedSingle = await getManagedImageOverride(managedGalleryPlacementKey);
        if (managedSingle?.src) managedGalleryImages = [managedSingle.src];
      }
    } catch (error) {
      logPublicMediaWarning('managed-gallery', key, error);
    }
  }

  try {
    const mediaItems = await listPortfolioMedia(config.portfolioSlug);
    mediaImages = mediaItems.filter((item) => item.mediaType === 'image').map((item) => item.mediaUrl);
  } catch (error) {
    logPublicMediaWarning('portfolio-media', key, error);
  }

  try {
    const { photos } = await listPortfolioPhotos({ slug: config.portfolioSlug, limit: PUBLIC_MEDIA_LOOKUP_LIMIT, includeTotal: false });
    bookingImages = photos.map((photo) => photo.photoUrl);
  } catch (error) {
    logPublicMediaWarning('booking-gallery', key, error);
  }

  return {
    managedHeroSrc,
    managedGalleryImages: dedupe(managedGalleryImages),
    mediaImages: dedupe(mediaImages),
    bookingImages: dedupe(bookingImages),
    fallbackImage: config.fallbackImage,
  };
}

function getServiceMediaSnapshot(key: PublicServiceMediaKey) {
  if (!isProductionRuntime()) {
    return resolveServiceMediaSnapshot(key);
  }

  const cached = serviceMediaSnapshotCache.get(key);
  if (cached) return cached;

  const next = resolveServiceMediaSnapshot(key);
  serviceMediaSnapshotCache.set(key, next);
  return next;
}

export async function getPublicServiceHeroImage(key: PublicServiceMediaKey): Promise<string> {
  const snapshot = await getServiceMediaSnapshot(key);
  return snapshot.managedHeroSrc
    || snapshot.mediaImages[0]
    || snapshot.bookingImages[0]
    || snapshot.fallbackImage;
}

export async function getPublicServiceGalleryImages(key: PublicServiceMediaKey, limit = 4): Promise<string[]> {
  const snapshot = await getServiceMediaSnapshot(key);

  if (snapshot.managedGalleryImages.length > 0) {
    return snapshot.managedGalleryImages.slice(0, limit);
  }

  const combined = dedupe([...snapshot.mediaImages, ...snapshot.bookingImages]).slice(0, limit);
  return combined.length > 0 ? combined : [snapshot.fallbackImage];
}
