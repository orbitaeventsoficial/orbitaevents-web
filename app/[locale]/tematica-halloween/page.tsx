/**
 * Pàgina Halloween — EXPERIÈNCIA IMMERSIVA
 * Server component: metadata + renderitza client interactiu
 */

import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { PUBLIC_HALLOWEEN_HERO_IMAGE } from '@/lib/constants';

const HalloweenClient = dynamic(() => import('./client'), {
  ssr: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('halloweenPage');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: t('meta.keywords').split(',').map((keyword) => keyword.trim()),
    alternates: { canonical: '/tematica-halloween' },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      images: [{ url: PUBLIC_HALLOWEEN_HERO_IMAGE, alt: 'Halloween immersiu Barcelona' }],
    },
  };
}

export default function HalloweenPage() {
  return <HalloweenClient />;
}
