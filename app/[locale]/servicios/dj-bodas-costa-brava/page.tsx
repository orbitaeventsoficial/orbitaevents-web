// app/[locale]/servicios/dj-bodas-costa-brava/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Costa Brava | Cadaqués, Tossa, Lloret | Desde ${MIN_PRICE}€ | Òrbita`,
  description: `DJ para bodas en la Costa Brava desde ${MIN_PRICE}€. Cadaqués, Tossa de Mar, Lloret, Roses, Begur, Palafrugell. Especialistas en bodas de costa. Presupuesto gratis.`,
  keywords: [
    'DJ bodas Costa Brava',
    'DJ bodas Cadaqués',
    'DJ bodas Tossa de Mar',
    'DJ boda Lloret de Mar',
    'DJ matrimonio Begur',
    'bodas playa Costa Brava',
    'música bodas costa',
    'DJ casament Costa Brava',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-costa-brava' },
  openGraph: {
    title: `DJ Bodas Costa Brava | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en la Costa Brava. Cadaqués, Tossa, Lloret, Begur y toda la costa. Especialistas en bodas con vistas al mar.',
    url: '/servicios/dj-bodas-costa-brava',
    images: [{ url: '/img/portfolio/bodas/bodas-03.webp', alt: 'DJ Bodas Costa Brava - Òrbita Events' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `DJ Bodas Costa Brava | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Cadaqués, Tossa de Mar, Lloret, Begur y toda la Costa Brava.',
    images: ['/img/portfolio/bodas/bodas-03.webp'],
  },
  robots: { index: true, follow: true },
};

const costaBravaTowns = [
  'Cadaqués', 'Roses', 'Empuriabrava', 'L\'Escala',
  'Begur', 'Palafrugell', 'Calella de Palafrugell',
  'Palamós', 'Sant Feliu de Guíxols', 'Tossa de Mar',
  'Lloret de Mar', 'Blanes', 'Platja d\'Aro', 'S\'Agaró',
  'Tamariu', 'Aiguablava',
];

const costaBravaFaqs = [
  {
    q: '¿Cuánto cuesta un DJ para bodas en la Costa Brava?',
    a: `El precio de DJ para bodas en la Costa Brava empieza desde ${MIN_PRICE}€. Este pack incluye DJ profesional, sonido 4000W resistente a exteriores, iluminación LED y desplazamiento a cualquier punto de la costa.`,
  },
  {
    q: '¿Hacéis bodas en la playa o chiringuitos?',
    a: 'Sí, somos especialistas en bodas de costa. Tenemos equipo preparado para exteriores, con protección contra la humedad y el viento. Hemos trabajado en playas, calas, chiringuitos y terrazas con vistas al mar.',
  },
  {
    q: '¿Qué pasa si hay viento o mal tiempo?',
    a: 'Tenemos protocolos para condiciones de costa: equipo resistente, cableado asegurado y plan B preparado. Si el evento se traslada a interior, nos adaptamos sin problema adicional.',
  },
  {
    q: '¿Conocéis los espacios para bodas de la Costa Brava?',
    a: 'Sí, hemos trabajado en los espacios más emblemáticos: desde masías con vistas al mar hasta hoteles boutique en calas escondidas. Conocemos Cap Roig, Aiguablava, Calella de Palafrugell y muchos más.',
  },
  {
    q: '¿El sonido se escucha bien en exteriores junto al mar?',
    a: 'Sí, nuestro equipo de 4000W está dimensionado para espacios abiertos. Hacemos prueba de sonido previa para ajustar la orientación y potencia según el espacio y la dirección del viento.',
  },
];

const zoneConfig: ZoneConfig = {
  zone: 'Costa Brava',
  zoneSlug: 'costa-brava',
  service: 'bodas',
  heroTitle: 'DJ Bodas Costa Brava',
  heroSubtitle: 'Cadaqués · Tossa · Lloret · Begur · Toda la costa',
  minPrice: MIN_PRICE,
  towns: costaBravaTowns,
  highlights: [
    'Especialistas en costa',
    'Equipo para exteriores',
    'Bodas con vistas al mar',
    'Experiencia en calas',
  ],
  description: `¿Tu boda es en la Costa Brava? En Òrbita Events somos especialistas en bodas de costa, desde Blanes hasta Cadaqués, pasando por las calas más espectaculares de la Costa Brava.

Conocemos los espacios más exclusivos de la Costa Brava: hoteles boutique con vistas al Mediterráneo, masías en el interior con encanto marinero, restaurantes en primera línea de mar y calas privadas donde crear momentos únicos.

Nuestro equipo está preparado para condiciones de costa: sonido profesional EV de 4000W resistente a la humedad, iluminación LED que compite con las puestas de sol y todos los efectos para hacer tu boda inolvidable.`,
  whyChooseUs: [
    'Especialistas en costa: Equipo preparado para exteriores, humedad y viento',
    'Espacios exclusivos: Experiencia en los venues más emblemáticos de la Costa Brava',
    'Bodas con vistas: Sabemos crear ambiente con el mar de fondo',
    'Plan B incluido: Protocolos para cambios meteorológicos sin coste adicional',
  ],
  faqs: costaBravaFaqs.map(f => ({ question: f.q, answer: f.a })),
};

export default function DJBodasCostaBravaPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Bodas', url: '/servicios/bodas' },
          { name: 'DJ Bodas Costa Brava', url: '/servicios/dj-bodas-costa-brava' },
        ]}
      />

      <ServiceJsonLD
        name="DJ Bodas Costa Brava"
        slugPath="/servicios/dj-bodas-costa-brava"
        description={`DJ profesional para bodas en la Costa Brava. Especialistas en bodas de costa: Cadaqués, Tossa de Mar, Lloret, Begur, Palafrugell y toda la costa. Equipo para exteriores. Desde ${MIN_PRICE}€.`}
        serviceType={[
          'DJ bodas Costa Brava',
          'DJ bodas playa',
          'DJ bodas Cadaqués',
          'DJ bodas Tossa de Mar',
          'Bodas costa mediterránea',
        ]}
        areaServed={costaBravaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 15 }}
      />

      <ZoneLandingPage config={zoneConfig} />

      <FAQ items={costaBravaFaqs} />
    </>
  );
}
