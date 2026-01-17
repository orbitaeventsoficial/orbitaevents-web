import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import nextDynamic from 'next/dynamic';

const PrivacitatClient = nextDynamic(() => import('./client'));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPortal' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    alternates: { canonical: '/privacitat' },
  };
}

export default function PrivacitatPage() {
  return <PrivacitatClient />;
}
