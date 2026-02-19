// app/[locale]/servicios/discomovil-girona/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('discomovil');

export const metadata: Metadata = {
  title: `Discomóvil Girona | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `Discomóvil en Girona desde ${MIN_PRICE}€. Girona ciudad, Figueres, Olot, Costa Brava. DJ profesional + equipo completo para fiestas y celebraciones.`,
  keywords: ['discomovil Girona', 'discomóvil Costa Brava', 'DJ fiesta Girona', 'discomóvil Figueres', 'DJ fiestas provincia Girona'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/discomovil-girona' },
  openGraph: {
    title: `Discomóvil Girona | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para fiestas en Girona y provincia. Costa Brava, Empordà y toda la comarca.',
    url: '/servicios/discomovil-girona',
    images: [{ url: '/img/portfolio/discomovil/discomovil-11.avif', alt: 'Discomóvil Girona - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const gironaTowns = ['Girona', 'Figueres', 'Olot', 'Salt', 'Blanes', 'Lloret de Mar', 'Tossa de Mar', 'Roses', 'Cadaqués', 'Palamós', 'Sant Feliu de Guíxols', 'Platja d\'Aro'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilGironaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const faqItems = [
    {
      q: '¿Hacéis discomóvil en toda la provincia de Girona?',
      a: `Sí, cubrimos toda la provincia de Girona: ciudad, Costa Brava, Empordà, Garrotxa y comarca de la Selva. El desplazamiento está incluido desde ${MIN_PRICE}€.`,
    },
    {
      q: '¿Cuánto cuesta llevar el equipo hasta Girona desde el área de Barcelona?',
      a: 'El desplazamiento a Girona capital y municipios de la provincia está incluido en todos nuestros packs. Sin recargos ocultos ni kilómetros extra.',
    },
    {
      q: '¿Podéis hacer el discomóvil en masías de la provincia de Girona?',
      a: 'Sí, somos expertos en fiestas en masías y casas rurales. Llevamos todo el equipo, incluido generador si es necesario, y montamos en cualquier espacio.',
    },
    {
      q: '¿Cubrís las comarcas del Empordà y la Selva?',
      a: 'Sí. Trabajamos en todo el Alt Empordà, Baix Empordà y la Selva: Figueres, Roses, Cadaqués, Palamós, Tossa, Lloret, Blanes y alrededores.',
    },
    {
      q: '¿Cuántos profesionales van al evento?',
      a: 'Normalmente un DJ profesional con el equipo completo. En packs premium incluimos un técnico de luces adicional para shows más espectaculares.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Girona',
    zoneSlug: 'girona',
    service: 'discomovil',
    heroTitle: 'Discomóvil Girona',
    heroSubtitle: 'Girona · Figueres · Olot · Empordà · Costa Brava · Selva',
    minPrice: MIN_PRICE,
    towns: gironaTowns,
    highlights: ['Discomóvil Girona precio', 'DJ fiesta Girona', 'Discomóvil Empordà', 'DJ fiestas masía Girona'],
    description: `DJ profesional con discomóvil en Girona y provincia. Especialistas en masías y fiestas rurales.`,
    whyChooseUs: [
      'Toda la provincia cubierta: Girona, Costa Brava, Empordà',
      'Expertos en masías: Adaptamos el equipo a cualquier espacio',
      'Desplazamiento incluido: Sin recargos por distancia',
      'Plan B siempre preparado: Nos adaptamos al clima',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: '/img/portfolio/discomovil/discomovil-11.avif',
    galleryImages: [
      '/img/portfolio/discomovil/discomovil-13.avif',
      '/img/portfolio/discomovil/discomovil-15.avif',
      '/img/portfolio/discomovil/discomovil-17.avif',
      '/img/portfolio/discomovil/discomovil-19.avif',
    ],
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.discomovil'), url: '/servicios/discomovil' },
        { name: 'Discomóvil Girona', url: '/servicios/discomovil-girona' },
      ]} />
      <ServiceJsonLD
        name="Discomóvil Girona"
        slugPath="/servicios/discomovil-girona"
        description={`Discomóvil profesional en Girona y provincia. DJ + equipo completo para fiestas y masías. Desde ${MIN_PRICE}€.`}
        serviceType={['Discomóvil Girona', 'DJ fiestas Girona', 'Discomóvil Costa Brava']}
        areaServed={gironaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
