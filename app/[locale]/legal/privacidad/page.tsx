import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import nextDynamic from 'next/dynamic';

const PrivacidadClient = nextDynamic(() => import('./client'));

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacidad' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    alternates: { canonical: '/legal/privacidad' },
  };
}

export default function PrivacidadPage() {
  return <PrivacidadClient />;
}
