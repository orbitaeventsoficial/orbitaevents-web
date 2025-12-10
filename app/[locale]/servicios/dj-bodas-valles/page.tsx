// app/[locale]/servicios/dj-bodas-valles/page.tsx
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Vallès | Granollers, Sabadell, Terrassa | Desde ${MIN_PRICE}€ | Òrbita`,
  description: `DJ para bodas en el Vallès desde ${MIN_PRICE}€. Base en Granollers, sin costes de desplazamiento. Sabadell, Terrassa, Mollet, Sant Cugat. Presupuesto en 2h.`,
  keywords: [
    'DJ bodas Vallès',
    'DJ bodas Granollers',
    'DJ bodas Sabadell',
    'DJ bodas Terrassa',
    'DJ boda Mollet',
    'DJ matrimonio Sant Cugat',
    'discomóvil Vallès',
    'música bodas Vallès Oriental',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-valles' },
  openGraph: {
    title: `DJ Bodas Vallès | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Vallès. Granollers, Sabadell, Terrassa, Mollet. Base local, sin costes de desplazamiento.',
    url: '/servicios/dj-bodas-valles',
    images: [{ url: '/img/portfolio/bodas/bodas-04.webp', alt: 'DJ Bodas Vallès - Òrbita Events' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `DJ Bodas Vallès | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Granollers, Sabadell, Terrassa y todo el Vallès. Sin costes de desplazamiento.',
    images: ['/img/portfolio/bodas/bodas-04.webp'],
  },
  robots: { index: true, follow: true },
};

const vallesTowns = [
  'Granollers', 'Sabadell', 'Terrassa', 'Mollet del Vallès',
  'Sant Cugat del Vallès', 'Rubí', 'Cerdanyola del Vallès', 'Parets del Vallès',
  'La Garriga', 'Cardedeu', 'Sant Celoni', 'Caldes de Montbui',
  'Lliçà d\'Amunt', 'Les Franqueses', 'Montornès', 'Montmeló',
];

const vallesFaqs = [
  {
    q: '¿Cuánto cuesta un DJ para bodas en el Vallès?',
    a: `El precio de DJ para bodas en el Vallès empieza desde ${MIN_PRICE}€. Como tenemos base en Granollers, el desplazamiento está completamente incluido para cualquier población del Vallès Oriental y Occidental.`,
  },
  {
    q: '¿Por qué elegir un DJ local del Vallès?',
    a: 'Al tener base en Granollers, conocemos perfectamente la zona: las fincas, masías, restaurantes y espacios para bodas del Vallès. Además, el desplazamiento está incluido y podemos hacer visitas previas sin problema.',
  },
  {
    q: '¿Cubrís tanto el Vallès Oriental como el Occidental?',
    a: 'Sí, cubrimos ambas comarcas: desde Granollers, Mollet y Cardedeu en el Oriental hasta Sabadell, Terrassa y Sant Cugat en el Occidental. Todo el Vallès sin coste adicional de desplazamiento.',
  },
  {
    q: '¿Conocéis las masías y espacios del Vallès?',
    a: 'Sí, hemos trabajado en las masías más emblemáticas del Vallès: Can Bonastre, Cal Blay, Can Ribas, y muchas más. Conocemos los accesos, la potencia eléctrica y las particularidades de cada espacio.',
  },
  {
    q: '¿Podéis hacer la visita previa al espacio?',
    a: 'Sí, al ser locales hacemos visitas previas sin problema. Es importante conocer el espacio, revisar accesos, potencia eléctrica y planificar el montaje con el coordinador del venue.',
  },
];

const zoneConfig: ZoneConfig = {
  zone: 'Vallès',
  zoneSlug: 'valles',
  service: 'bodas',
  heroTitle: 'DJ Bodas Vallès',
  heroSubtitle: 'Granollers · Sabadell · Terrassa · Mollet · Toda la comarca',
  minPrice: MIN_PRICE,
  towns: vallesTowns,
  highlights: [
    'Base en Granollers',
    'Sin coste desplazamiento',
    'Conocemos las masías',
    'Visita previa incluida',
  ],
  description: `¿Buscas un DJ para tu boda en el Vallès? En Òrbita Events tenemos nuestra base en Granollers, lo que nos convierte en la opción ideal para bodas en el Vallès Oriental y Occidental.

Conocemos perfectamente las masías y espacios para bodas del Vallès: desde las fincas con jardines espectaculares hasta los restaurantes con encanto de la zona. Al ser locales, podemos hacer visitas previas, conocer el espacio y coordinar con el venue sin problemas.

Sin costes de desplazamiento a cualquier punto del Vallès. Nuestro equipo incluye sonido profesional EV de 4000W, iluminación LED, controladora Pioneer y todos los efectos que necesites.`,
  whyChooseUs: [
    'Somos locales: Base en Granollers, conocemos perfectamente la zona',
    'Sin desplazamiento: Incluido a cualquier punto del Vallès sin coste extra',
    'Conocemos los venues: Hemos trabajado en las masías más emblemáticas',
    'Visitas previas: Podemos visitar el espacio antes del día de la boda',
  ],
  faqs: vallesFaqs.map(f => ({ question: f.q, answer: f.a })),
};

export default function DJBodasVallesPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: 'Inicio', url: '/' },
          { name: 'Servicios', url: '/servicios' },
          { name: 'Bodas', url: '/servicios/bodas' },
          { name: 'DJ Bodas Vallès', url: '/servicios/dj-bodas-valles' },
        ]}
      />

      <ServiceJsonLD
        name="DJ Bodas Vallès"
        slugPath="/servicios/dj-bodas-valles"
        description={`DJ profesional para bodas en el Vallès. Base en Granollers, sin costes de desplazamiento. Cobertura en Sabadell, Terrassa, Mollet, Sant Cugat y toda la comarca. Desde ${MIN_PRICE}€.`}
        serviceType={[
          'DJ bodas Vallès',
          'DJ bodas Granollers',
          'DJ bodas Sabadell',
          'DJ bodas Terrassa',
          'Discomóvil Vallès Oriental',
        ]}
        areaServed={vallesTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 31 }}
      />

      <ZoneLandingPage config={zoneConfig} />

      <FAQ items={vallesFaqs} />
    </>
  );
}
