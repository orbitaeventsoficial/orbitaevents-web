import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import nextDynamic from 'next/dynamic';

const TerminosClient = nextDynamic(() => import('./client'));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.terminos' });

  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
    alternates: { canonical: '/legal/terminos' },
  };
}

export default function TerminosPage() {
  // Server Component wrapper for client-side terms page
  return <TerminosClient />;
}
