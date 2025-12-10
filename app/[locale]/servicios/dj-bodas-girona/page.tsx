// app/[locale]/servicios/dj-bodas-girona/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Girona | Ciudad y Provincia | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en Girona desde ${MIN_PRICE}€. Cobertura en Girona ciudad, Figueres, Olot, Banyoles, Salt. Sonido profesional 4000W, iluminación y efectos. Presupuesto gratis.`,
  keywords: [
    'DJ bodas Girona',
    'DJ bodas Figueres',
    'DJ bodas Olot',
    'DJ boda Banyoles',
    'DJ matrimonio Girona',
    'discomóvil Girona',
    'música bodas Girona provincia',
    'DJ casament Girona',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-girona' },
  openGraph: {
    title: `DJ Bodas Girona | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Girona. Ciudad, Figueres, Olot, Banyoles y toda la provincia. Sonido 4000W + luces + efectos.',
    url: '/servicios/dj-bodas-girona',
    images: [{ url: '/img/portfolio/bodas/bodas-02.webp', alt: 'DJ Bodas Girona - Òrbita Events' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `DJ Bodas Girona | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Girona ciudad, Figueres, Olot y toda la provincia.',
    images: ['/img/portfolio/bodas/bodas-02.webp'],
  },
  robots: { index: true, follow: true },
};

const gironaTowns = [
  'Girona', 'Figueres', 'Olot', 'Banyoles', 'Salt',
  'Blanes', 'Lloret de Mar', 'Roses', 'Palafrugell',
  'Sant Feliu de Guíxols', 'Palamós', 'La Bisbal d\'Empordà',
  'Ripoll', 'Besalú', 'Torroella de Montgrí', 'Cassà de la Selva',
];

const gironaFaqs = [
  {
    q: '¿Cuánto cuesta un DJ para bodas en Girona?',
    a: `El precio de DJ para bodas en Girona empieza desde ${MIN_PRICE}€. Este pack incluye DJ profesional, sonido 4000W EV, iluminación LED y desplazamiento a cualquier punto de la provincia de Girona.`,
  },
  {
    q: '¿Cubrís toda la provincia de Girona?',
    a: 'Sí, trabajamos en toda la provincia: Girona ciudad, Figueres, Olot, Banyoles, Salt, la Costa Brava completa, el Empordà, la Garrotxa y más. El desplazamiento está incluido en el precio.',
  },
  {
    q: '¿Tenéis experiencia en masías del Empordà?',
    a: 'Sí, hemos trabajado en numerosas masías del Alt y Baix Empordà. Conocemos las particularidades de estos espacios: accesos, potencia eléctrica, acústica y coordinación con catering.',
  },
  {
    q: '¿Qué idiomas habláis para las bodas?',
    a: 'Hablamos catalán, castellano e inglés. Muchas bodas en Girona tienen invitados internacionales y nos adaptamos perfectamente a bodas multilingües.',
  },
  {
    q: '¿Hacéis bodas en espacios con historia como Besalú o Peratallada?',
    a: 'Sí, tenemos experiencia en espacios medievales y con patrimonio histórico. Adaptamos el montaje y el volumen respetando las normativas de cada espacio.',
  },
];

const zoneConfig: ZoneConfig = {
  zone: 'Girona',
  zoneSlug: 'girona',
  service: 'bodas',
  heroTitle: 'DJ Bodas Girona',
  heroSubtitle: 'Girona · Figueres · Olot · Banyoles · Toda la provincia',
  minPrice: MIN_PRICE,
  towns: gironaTowns,
  highlights: [
    'Toda la provincia',
    'Sonido profesional 4000W',
    'Experiencia en masías',
    'Catalán, castellano e inglés',
  ],
  description: `¿Buscas un DJ para tu boda en Girona? En Òrbita Events somos especialistas en bodas en toda la provincia de Girona: desde la ciudad hasta el Empordà, pasando por la Garrotxa, el Gironès y la Selva.

Conocemos perfectamente los espacios para bodas más emblemáticos de Girona: masías del Empordà con siglos de historia, espacios con encanto en pueblos medievales como Besalú o Peratallada, hoteles de lujo y fincas privadas con jardines espectaculares.

Nuestro equipo profesional incluye sonido EV de 4000W, iluminación LED personalizable, controladora Pioneer y efectos especiales. Nos desplazamos a cualquier punto de la provincia sin coste adicional.`,
  whyChooseUs: [
    'Cobertura completa: Trabajamos en toda la provincia de Girona, desde la costa hasta el interior',
    'Experiencia en masías: Conocemos las particularidades de las masías del Empordà y la Garrotxa',
    'Multilingüe: Catalán, castellano e inglés para bodas con invitados internacionales',
    'Espacios históricos: Experiencia en monumentos y espacios con patrimonio protegido',
  ],
  faqs: gironaFaqs.map(f => ({ question: f.q, answer: f.a })),
};

export default function DJBodasGironaPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Bodas', url: '/servicios/bodas' },
          { name: 'DJ Bodas Girona', url: '/servicios/dj-bodas-girona' },
        ]}
      />

      <ServiceJsonLD
        name="DJ Bodas Girona"
        slugPath="/servicios/dj-bodas-girona"
        description={`DJ profesional para bodas en Girona. Cobertura completa en Girona ciudad, Figueres, Olot, Banyoles y toda la provincia. Sonido 4000W, iluminación LED y efectos especiales. Desde ${MIN_PRICE}€.`}
        serviceType={[
          'DJ bodas Girona',
          'DJ bodas Figueres',
          'DJ bodas Olot',
          'Discomóvil Girona',
          'Música bodas Empordà',
        ]}
        areaServed={gironaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 18 }}
      />

      <ZoneLandingPage config={zoneConfig} />

      <FAQ items={gironaFaqs} />
    </>
  );
}
