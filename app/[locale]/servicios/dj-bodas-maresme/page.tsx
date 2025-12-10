// app/[locale]/servicios/dj-bodas-maresme/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Maresme | Mataró, Calella, Arenys | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Maresme desde ${MIN_PRICE}€. Cobertura en Mataró, Calella, Arenys de Mar, Vilassar, Premià. Sonido profesional 4000W, iluminación y efectos. Presupuesto gratis en 2h.`,
  keywords: [
    'DJ bodas Maresme',
    'DJ bodas Mataró',
    'DJ bodas Calella',
    'DJ boda Arenys de Mar',
    'DJ boda Vilassar',
    'discomóvil Maresme',
    'música bodas costa Maresme',
    'DJ matrimonio Maresme',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-maresme' },
  openGraph: {
    title: `DJ Bodas Maresme | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Maresme. Mataró, Calella, Arenys de Mar y toda la comarca. Sonido 4000W + luces + efectos.',
    url: '/servicios/dj-bodas-maresme',
    images: [{ url: '/img/portfolio/bodas/bodas-01.webp', alt: 'DJ Bodas Maresme - Òrbita Events' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `DJ Bodas Maresme | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Mataró, Calella, Arenys y toda la comarca del Maresme.',
    images: ['/img/portfolio/bodas/bodas-01.webp'],
  },
  robots: { index: true, follow: true },
};

const maresmeTowns = [
  'Mataró', 'Calella', 'Arenys de Mar', 'Vilassar de Mar',
  'Premià de Mar', 'El Masnou', 'Canet de Mar', 'Sant Pol de Mar',
  'Pineda de Mar', 'Tordera', 'Argentona', 'Cabrera de Mar',
  'Arenys de Munt', 'Sant Vicenç de Montalt', 'Alella', 'Tiana',
];

const maresmeFaqs = [
  {
    q: '¿Cuánto cuesta un DJ para bodas en el Maresme?',
    a: `El precio de DJ para bodas en el Maresme empieza desde ${MIN_PRICE}€. Este precio incluye DJ profesional, sonido 4000W, iluminación LED y desplazamiento a cualquier población del Maresme como Mataró, Calella o Arenys de Mar.`,
  },
  {
    q: '¿Os desplazáis a todas las poblaciones del Maresme?',
    a: 'Sí, cubrimos toda la comarca del Maresme: Mataró, Calella, Arenys de Mar, Vilassar de Mar, Premià de Mar, El Masnou, Canet de Mar, Sant Pol de Mar, Pineda de Mar, Tordera, Argentona y más. El desplazamiento está incluido en el precio.',
  },
  {
    q: '¿Conocéis las fincas y espacios para bodas del Maresme?',
    a: 'Sí, hemos trabajado en múltiples espacios del Maresme: masías con encanto, restaurantes con vistas al mar, hoteles de costa y espacios privados. Conocemos las particularidades de cada tipo de espacio y adaptamos el equipo según necesidades.',
  },
  {
    q: '¿Qué pasa si mi boda es en una finca sin mucha potencia eléctrica?',
    a: 'Muchas fincas del Maresme tienen limitaciones eléctricas. Nuestro equipo está preparado para funcionar con generador o adaptarnos a la potencia disponible sin perder calidad de sonido.',
  },
  {
    q: '¿Hacéis bodas en la playa en el Maresme?',
    a: 'Sí, realizamos bodas en playas y chiringuitos de la costa del Maresme. Tenemos equipo resistente y experiencia en exteriores con protocolos específicos para espacios abiertos.',
  },
];

const zoneConfig: ZoneConfig = {
  zone: 'Maresme',
  zoneSlug: 'maresme',
  service: 'bodas',
  heroTitle: 'DJ Bodas Maresme',
  heroSubtitle: 'Mataró · Calella · Arenys de Mar · Vilassar · Toda la comarca',
  minPrice: MIN_PRICE,
  towns: maresmeTowns,
  highlights: [
    'Desplazamiento incluido',
    'Sonido profesional 4000W',
    'Experiencia en fincas de costa',
    'Presupuesto en 2h',
  ],
  description: `¿Buscas un DJ para tu boda en el Maresme? En Òrbita Events somos especialistas en bodas en la comarca del Maresme, desde Mataró hasta Tordera, pasando por las preciosas poblaciones costeras como Calella, Arenys de Mar o Sant Pol de Mar.

Conocemos perfectamente los espacios para bodas más populares del Maresme: masías con encanto, restaurantes con vistas al mar, hoteles de costa y espacios privados. Adaptamos nuestro equipo a las particularidades de cada espacio, ya sea una terraza con vistas al Mediterráneo o una masía en el interior de la comarca.

Nuestro equipo incluye sonido profesional EV de 4000W, iluminación LED ambiental, controladora Pioneer y todos los efectos especiales que necesites para crear momentos inolvidables en tu boda.`,
  whyChooseUs: [
    'Conocemos la zona: Hemos trabajado en bodas por todo el Maresme, desde masías hasta playas',
    'Desplazamiento incluido: Sin costes extra a cualquier población de la comarca',
    'Equipo adaptable: Preparados para fincas con limitaciones eléctricas o espacios reducidos',
    'Experiencia en exteriores: Bodas en terrazas, jardines y playas de la costa del Maresme',
  ],
  faqs: maresmeFaqs.map(f => ({ question: f.q, answer: f.a })),
};

export default function DJBodasMaresmePage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Bodas', url: '/servicios/bodas' },
          { name: 'DJ Bodas Maresme', url: '/servicios/dj-bodas-maresme' },
        ]}
      />

      <ServiceJsonLD
        name="DJ Bodas Maresme"
        slugPath="/servicios/dj-bodas-maresme"
        description={`DJ profesional para bodas en el Maresme. Cobertura completa en Mataró, Calella, Arenys de Mar, Vilassar y toda la comarca. Sonido 4000W, iluminación LED y efectos especiales. Desde ${MIN_PRICE}€.`}
        serviceType={[
          'DJ bodas Maresme',
          'DJ bodas Mataró',
          'DJ bodas Calella',
          'Discomóvil Maresme',
          'Música bodas costa',
        ]}
        areaServed={maresmeTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 23 }}
      />

      <ZoneLandingPage config={zoneConfig} />

      <FAQ items={maresmeFaqs} />
    </>
  );
}
