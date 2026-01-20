// app/[locale]/opiniones/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import OpinionesClient from './client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === 'es';

  return {
    title: isEs
      ? 'Opiniones y Reseñas | Òrbita Events'
      : 'Opinions i Ressenyes | Òrbita Events',
    description: isEs
      ? 'Lee las opiniones de nuestros clientes. Más de 50 reseñas verificadas en Google. Deja tu valoración y obtén un descuento exclusivo.'
      : 'Llegeix les opinions dels nostres clients. Més de 50 ressenyes verificades a Google. Deixa la teva valoració i obtén un descompte exclusiu.',
    alternates: {
      canonical: '/opiniones',
    },
    openGraph: {
      title: isEs ? 'Opiniones | Òrbita Events' : 'Opinions | Òrbita Events',
      description: isEs
        ? 'Lee las opiniones de nuestros clientes y deja la tuya.'
        : 'Llegeix les opinions dels nostres clients i deixa la teva.',
      type: 'website',
    },
  };
}

export default async function OpinionesPage() {
  return <OpinionesClient />;
}
