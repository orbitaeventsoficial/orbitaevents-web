import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import Client from './client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: { canonical: `/${locale}/contacto` },
    robots: { index: true, follow: true },
  };
}

export default function ContactoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />}>
      <Client />
    </Suspense>
  );
}
