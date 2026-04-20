// app/[locale]/servicios/dj-fiestas-maresme/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';
import { getSiteUrl } from '@/lib/site';
import { getPublicServiceHeroImage, getPublicServiceGalleryImages } from '@/lib/services/publicServiceMediaService';
import { LOCAL_PARTY_LANDING_COPY } from '@/lib/localPartyLandingCopy';

const MIN_PRICE = getMinPriceByService('fiestas');
const COPY = LOCAL_PARTY_LANDING_COPY['dj-fiestas-maresme'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('fiestas');
  await getPublicServiceGalleryImages('fiestas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-fiestas-maresme' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-fiestas-maresme',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const maresmeTowns = ['Mataró', 'Calella', 'Pineda de Mar', 'Arenys de Mar', 'Canet de Mar', 'Malgrat de Mar', 'Santa Susanna', 'Premià de Mar', 'Vilassar de Mar', 'Argentona', 'Alella', 'Montgat'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasMaresmePage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

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
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: maresmeTowns,
    highlights: COPY.zone.highlights,
    description: COPY.zone.description(MIN_PRICE),
    whyChooseUs: COPY.zone.whyChooseUs,
    faqs: faqItems.map((f) => ({ question: f.q, answer: f.a })),
    heroImage,
    galleryImages,
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.services'), url: '/servicios' },
          { name: tCommon('nav.parties'), url: '/servicios/fiestas' },
          { name: COPY.breadcrumbLabel, url: '/servicios/dj-fiestas-maresme' },
        ]}
      />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-fiestas-maresme"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={maresmeTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
