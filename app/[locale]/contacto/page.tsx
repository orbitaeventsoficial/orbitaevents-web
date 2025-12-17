import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Client from './client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: { canonical: '/contacto' },
    robots: { index: true, follow: true },
  };
}

export default function ContactoPage() {
  return <Client />;
}
