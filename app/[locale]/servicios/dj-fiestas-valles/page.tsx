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
const COPY = LOCAL_PARTY_LANDING_COPY['dj-fiestas-valles'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('fiestas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-fiestas-valles' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-fiestas-valles',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const vallesTowns = ['Sabadell', 'Terrassa', 'Granollers', 'Cerdanyola del Vallès', 'Sant Cugat del Vallès', 'Mollet del Vallès', 'Rubí', 'Montcada i Reixac', 'Parets del Vallès', 'Les Franqueses del Vallès'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasVallesPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

  const faqItems = [
    {
      q: '¿Cuánto cuesta un DJ para fiestas en el Vallès?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash. Los packs estándar empiezan desde 350€ para 3 horas. Incluye DJ, equipo de sonido y iluminación.`,
    },
    {
      q: '¿Cubrís Sabadell, Terrassa y Granollers?',
      a: 'Sí. Cubrimos todo el Vallès Occidental y Oriental. Desplazamiento incluido.',
    },
    {
      q: '¿Podéis hacer fiestas en jardines o espacios exteriores?',
      a: 'Sí. Nuestro equipo es portátil y profesional. Lo montamos tanto en interiores (salas, pisos) como en exteriores (jardines, terrazas, masías).',
    },
    {
      q: '¿Aceptáis peticiones musicales?',
      a: 'Siempre. Las peticiones son bienvenidas en directo. También puedes enviarnos una playlist antes de la fiesta.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Vallès',
    zoneSlug: 'valles',
    service: 'fiestas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: vallesTowns,
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
          { name: COPY.breadcrumbLabel, url: '/servicios/dj-fiestas-valles' },
        ]}
      />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-fiestas-valles"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={vallesTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
