/**
 * Pàgina Halloween — EXPERIÈNCIA IMMERSIVA
 * Server component: metadata + renderitza client interactiu
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import { getPublicServiceGalleryImages, getPublicServiceHeroImage } from '@/lib/services/publicServiceMediaService';
import HalloweenClient from './client';

export const revalidate = 86400;

type HalloweenGalleryItem = { src: string; alt: string };

async function getHalloweenGallery(): Promise<HalloweenGalleryItem[]> {
  const photos = await getPublicServiceGalleryImages('halloween', 12);
  return photos.map((src, index) => ({
    src,
    alt: `Halloween Orbita Events ${index + 1}`,
  }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('halloweenPage');
  const heroImage = await getPublicServiceHeroImage('halloween');
  const managedOg = await getManagedImageOverride('seo.og.halloween');
  const managedFavicon = await getManagedImageOverride('layout.favicon.halloween');
  const ogImage = managedOg?.src || heroImage;

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: t('meta.keywords').split(',').map((keyword) => keyword.trim()),
    alternates: { canonical: '/tematica-halloween' },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      images: [{ url: ogImage, alt: managedOg?.alt || 'Halloween immersiu Barcelona' }],
    },
    icons: {
      icon: [
        { url: managedFavicon?.src || '/favicon-halloween.svg', type: managedFavicon?.mimeType || 'image/svg+xml' },
      ],
    },
  };
}

export default async function HalloweenPage() {
  const initialGallery = await getHalloweenGallery();
  return <HalloweenClient initialGallery={initialGallery} />;
}
