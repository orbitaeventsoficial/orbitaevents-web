// app/[locale]/servicios/dj-fiestas-maresme/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('fiestas');

export const metadata: Metadata = {
  title: `DJ Fiestas Maresme | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para fiestas en el Maresme desde ${MIN_PRICE}€. Mataró, Calella, Pineda y toda la costa. Cumpleaños, aniversarios y fiestas privadas con equipo profesional.`,
  keywords: ['DJ fiestas Maresme', 'DJ fiesta Mataró', 'DJ fiesta Calella', 'DJ cumpleaños Maresme', 'contratar DJ Maresme'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-fiestas-maresme' },
  openGraph: {
    title: `DJ Fiestas Maresme | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para fiestas en el Maresme. Mataró, Calella, Pineda y toda la costa.',
    url: '/servicios/dj-fiestas-maresme',
    images: [{ url: '/img/portfolio/fiestas-privadas/fiestas-privadas-04.avif', alt: 'DJ Fiestas Maresme - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const maresmeTowns = ['Mataró', 'Calella', 'Pineda de Mar', 'Arenys de Mar', 'Canet de Mar', 'Malgrat de Mar', 'Santa Susanna', 'Premià de Mar', 'Vilassar de Mar', 'Argentona', 'Alella', 'Montgat'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasMaresmePage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const faqItems = [
    {
      q: '¿Cuánto cuesta un DJ para una fiesta en el Maresme?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash. Los packs estándar desde 350€ para 3 horas. El desplazamiento a toda la comarca del Maresme está siempre incluido.`,
    },
    {
      q: '¿Cubrís Mataró, Calella, Pineda y toda la costa del Maresme?',
      a: 'Sí, cubrimos toda la comarca: Mataró, Calella, Pineda de Mar, Arenys de Mar, Canet, Malgrat, Santa Susanna, Premià y el resto de municipios costeros y de interior.',
    },
    {
      q: '¿Hacéis fiestas en casas particulares del Maresme?',
      a: 'Sí, es nuestro fuerte. Fiestas en casas con jardín, terrazas, garajes... Nos adaptamos al espacio y montamos en 45 minutos. Somos expertos en fiestas privadas.',
    },
    {
      q: '¿Qué estilos musicales ponéis en las fiestas del Maresme?',
      a: 'Open format total: pop, reggaeton, electrónica, rumba, hits del momento, clásicos... Nos adaptamos a los gustos del cumpleañero/a y sus invitados. Puedes darnos una lista de referencia.',
    },
    {
      q: '¿Podéis hacer la fiesta de noche al aire libre en el Maresme?',
      a: 'Sí, pero hay que tener en cuenta la normativa de ruidos de cada municipio. Te orientamos sobre horarios y decibelios para que la fiesta sea perfecta y sin problemas.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Maresme',
    zoneSlug: 'maresme',
    service: 'fiestas',
    heroTitle: 'DJ Fiestas Maresme',
    heroSubtitle: 'Mataró · Calella · Pineda · Arenys · Canet · Malgrat',
    minPrice: MIN_PRICE,
    towns: maresmeTowns,
    highlights: ['DJ fiestas Maresme precio', 'DJ fiesta Mataró', 'DJ cumpleaños Calella', 'DJ fiestas costa Maresme'],
    description: `DJ profesional para fiestas privadas en el Maresme. Especialistas en fiestas de verano y celebraciones en la costa.`,
    whyChooseUs: [
      'Conocemos el Maresme: Somos de la zona',
      'Fiestas de verano: Expertos en exterior y costa',
      'Desplazamiento incluido: Sin costes extra a la comarca',
      'Open format: La música que vosotros queráis',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: '/img/portfolio/fiestas-privadas/fiestas-privadas-04.avif',
    galleryImages: [
      '/img/portfolio/fiestas-privadas/fiestas-privadas-06.avif',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-08.avif',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-10.avif',
      '/img/portfolio/discomovil/discomovil-06.avif',
    ],
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.parties'), url: '/servicios/fiestas' },
        { name: 'DJ Fiestas Maresme', url: '/servicios/dj-fiestas-maresme' },
      ]} />
      <ServiceJsonLD
        name="DJ Fiestas Maresme"
        slugPath="/servicios/dj-fiestas-maresme"
        description={`DJ profesional para fiestas privadas en el Maresme. Mataró, Calella y toda la costa. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ fiestas Maresme', 'DJ fiesta Mataró', 'DJ fiesta Calella Pineda']}
        areaServed={maresmeTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
