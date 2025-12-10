// app/configurador/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@\/components/seo/Breadcrumbs';
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const ConfiguradorClient = nextDynamic(() => import('./client'));

export const metadata: Metadata = {
  title: 'Configurador de Eventos | Calcula tu Presupuesto Online | Òrbita Events',
  description:
    'Configura tu evento paso a paso y recibe presupuesto al instante. Elige tipo de evento, opciones de sonido, luces, DJ y extras. Compara packs y personaliza tu experiencia.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/configurador' },
  openGraph: {
    title: 'Configurador de Eventos | Tu Presupuesto en 3 Minutos',
    description:
      'Calcula el presupuesto de tu evento al instante. Compara opciones y personaliza todo.',
    url: '/configurador',
    images: [
      {
        url: '/api/og?title=Configurador%20de%20Eventos',
        alt: 'Configurador de presupuesto Òrbita Events',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Configurador de Eventos | Presupuesto Online',
    description: 'Configura tu evento y recibe presupuesto instantáneo.',
    images: ['/api/og?title=Configurador'],
  },
  robots: { index: true, follow: true },
  keywords: [
    'presupuesto eventos Barcelona',
    'calcular precio DJ',
    'configurador bodas',
    'presupuesto fiesta online',
    'comparar packs eventos',
  ],
};

export default function ConfiguradorPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Configurador', url: '/configurador' },
        ]}
      />
      <ConfiguradorClient />
    </>
  );
}
