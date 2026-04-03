/**
 * Pàgina Món Màgic — Lacre Artesanal per a Casaments
 * Server component: metadata traduïble + renderitza client interactiu
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PUBLIC_MON_MAGIC_IMAGES } from '@/lib/constants';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import { getPublicServiceGalleryImages, getPublicServiceHeroImage } from '@/lib/services/publicServiceMediaService';
import ProductesMonMagic from './client';

export const revalidate = 86400;

type MonMagicImageSet = {
  hero: string;
  featured: string;
  cartell: string;
  mussolDecoratiu: string;
  taulaCompleta: string;
  gabiaPerga: string;
  llegintCarta: string;
};

async function getMonMagicImageSet(): Promise<MonMagicImageSet> {
  const fallback = PUBLIC_MON_MAGIC_IMAGES;
  const heroOverride = await getManagedImageOverride('themes.monmagic.hero');
  const featuredOverride = await getManagedImageOverride('themes.monmagic.featured');
  const cartellOverride = await getManagedImageOverride('themes.monmagic.cartell');
  const hero = heroOverride?.src || await getPublicServiceHeroImage('monmagic');
  const photos = await getPublicServiceGalleryImages('monmagic', 7);

  return {
    hero,
    featured: featuredOverride?.src || photos[0] || hero || fallback.featured,
    cartell: cartellOverride?.src || photos[1] || fallback.cartell,
    mussolDecoratiu: photos[2] || fallback.mussolDecoratiu,
    taulaCompleta: photos[3] || fallback.taulaCompleta,
    gabiaPerga: photos[4] || fallback.gabiaPerga,
    llegintCarta: photos[5] || photos[4] || fallback.llegintCarta,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('monMagic');
  const imageSet = await getMonMagicImageSet();
  const managedOg = await getManagedImageOverride('seo.og.monmagic');
  const managedFavicon = await getManagedImageOverride('layout.favicon.monmagic');
  const ogImage = managedOg?.src || imageSet.hero;
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: [
      'boda temàtica màgica',
      'invitacions escola de màgia',
      'lacre artesanal boda',
      'cartes màgiques personalitzades',
      'boda temàtica fantasia',
      'sobres lacre màgic',
      'casament temàtic',
      'papereria màgica',
      'segell cera artesanal',
      'boda bruixeria fantasia',
    ],
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: managedOg?.alt || t('meta.title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
      images: [ogImage],
    },
    icons: {
      icon: [
        { url: managedFavicon?.src || '/favicon-mon-magic.svg', type: managedFavicon?.mimeType || 'image/svg+xml' },
      ],
    },
    alternates: {
      canonical: '/tematica-mon-magic',
      languages: {
        'ca': '/ca/tematica-mon-magic',
        'es': '/es/tematica-mon-magic',
      },
    },
  };
}

export default async function TematicaMonMagicPage() {
  const imageSet = await getMonMagicImageSet();
  return <ProductesMonMagic imageSet={imageSet} />;
}
