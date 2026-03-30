/**
 * Pàgina Món Màgic — Lacre Artesanal per a Casaments
 * Server component: metadata traduïble + renderitza client interactiu
 */

import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ProductesMonMagic from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('monMagic');
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
          url: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-hero.avif',
          width: 1200,
          height: 630,
          alt: t('meta.title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.title'),
      description: t('meta.description'),
      images: ['/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-hero.avif'],
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

export default function TematicaMonMagicPage() {
  return <ProductesMonMagic />;
}
