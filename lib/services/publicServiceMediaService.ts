import { PUBLIC_SERVICE_MEDIA_CONFIG, type PublicMobileServiceCardId, type PublicServiceMediaKey } from '@/lib/constants/public-service-media';

export type { PublicMobileServiceCardId, PublicServiceMediaKey } from '@/lib/constants/public-service-media';
import { listPortfolioPhotos } from '@/lib/services/galleryService';
import { listPortfolioMedia } from '@/lib/services/portfolioMediaService';
import { getManagedImageCollection, getManagedImageOverride } from '@/lib/services/imageManagerService';

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
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

export function getPublicServicePortfolioSlug(key: PublicServiceMediaKey) {
  return PUBLIC_SERVICE_MEDIA_CONFIG[key].portfolioSlug;
}

export async function getPublicServiceHeroImage(key: PublicServiceMediaKey): Promise<string> {
  const config = PUBLIC_SERVICE_MEDIA_CONFIG[key];
  const managedPlacementKey = getManagedHeroPlacementKey(key);

  if (managedPlacementKey) {
    const managed = await getManagedImageOverride(managedPlacementKey);
    if (managed?.src) return managed.src;
  }

  try {
    const mediaItems = await listPortfolioMedia(config.portfolioSlug);
    const mediaImage = mediaItems.find((item) => item.mediaType === 'image')?.mediaUrl;
    if (mediaImage) return mediaImage;
  } catch {
    // continuar amb booking photos
  }

  try {
    const { photos } = await listPortfolioPhotos({ slug: config.portfolioSlug, limit: 1 });
    const bookingImage = photos[0]?.photoUrl;
    if (bookingImage) return bookingImage;
  } catch {
    // mantenir fallback estàtic
  }

  return config.fallbackImage;
}

export async function getPublicServiceGalleryImages(key: PublicServiceMediaKey, limit = 4): Promise<string[]> {
  const config = PUBLIC_SERVICE_MEDIA_CONFIG[key];
  const managedPlacementKey = getManagedGalleryPlacementKey(key);

  if (managedPlacementKey) {
    const managedItems = await getManagedImageCollection(managedPlacementKey);
    if (managedItems?.length) {
      return managedItems.map((item) => item.src).slice(0, limit);
    }

    const managedSingle = await getManagedImageOverride(managedPlacementKey);
    if (managedSingle?.src) return [managedSingle.src];
  }

  const collected: string[] = [];

  try {
    const mediaItems = await listPortfolioMedia(config.portfolioSlug);
    collected.push(...mediaItems.filter((item) => item.mediaType === 'image').map((item) => item.mediaUrl));
  } catch {
    // continuar amb booking photos
  }

  try {
    const { photos } = await listPortfolioPhotos({ slug: config.portfolioSlug, limit: Math.max(limit, 8) });
    collected.push(...photos.map((photo) => photo.photoUrl));
  } catch {
    // mantenir fallback estàtic
  }

  const unique = dedupe(collected).slice(0, limit);
  return unique.length > 0 ? unique : [config.fallbackImage];
}

export async function listPublicMobileServiceCardImages(): Promise<Record<PublicMobileServiceCardId, string>> {
  const mapping: Record<PublicMobileServiceCardId, PublicServiceMediaKey> = {
    bodas: 'bodas',
    halloween: 'halloween',
    monmagic: 'monmagic',
    fiestas: 'fiestas',
    empresas: 'empresas',
  };

  const entries = await Promise.all(
    Object.entries(mapping).map(async ([cardId, serviceKey]) => {
      // Primer: override específic de la targeta mòbil
      const cardOverride = await getManagedImageOverride(`home.servicesCards.${cardId}`);
      if (cardOverride?.src) return [cardId as PublicMobileServiceCardId, cardOverride.src] as const;
      // Fallback: hero del servei (que ja passa pel manager services.*.hero)
      return [cardId as PublicMobileServiceCardId, await getPublicServiceHeroImage(serviceKey)] as const;
    })
  );

  return Object.fromEntries(entries) as Record<PublicMobileServiceCardId, string>;
}

