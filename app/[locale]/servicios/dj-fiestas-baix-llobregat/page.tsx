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
import { buildPublicZoneBreadcrumbs } from '@/lib/publicZoneBreadcrumbs';

const MIN_PRICE = getMinPriceByService('fiestas');
const COPY = LOCAL_PARTY_LANDING_COPY['dj-fiestas-baix-llobregat'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('fiestas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-fiestas-baix-llobregat' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-fiestas-baix-llobregat',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const baixLlobregatTowns = ['L\'Hospitalet de Llobregat', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Esplugues de Llobregat', 'Gavà', 'Viladecans', 'Sant Joan Despí', 'Sant Feliu de Llobregat', 'Molins de Rei'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasBaixLlobregatPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

  const faqItems = [
    {
      q: '¿Cuánto cuesta un DJ para fiestas en el Baix Llobregat?',
      a: `Desde ${MIN_PRICE}€ con Oferta Flash. Packs estándar desde 350€ para 3 horas con equipo completo.`,
    },
    {
      q: '¿Cubrís L\'Hospitalet, Cornellà y Sant Boi?',
      a: 'Sí. Cubrimos todo el Baix Llobregat: L\'Hospitalet, Cornellà, Sant Boi, El Prat, Gavà, Viladecans y más. Desplazamiento incluido.',
    },
    {
      q: '¿Qué incluye el servicio?',
      a: 'DJ profesional, equipo de sonido de 4000W (Electro-Voice ETX), iluminación ambiental, montaje y desmontaje incluido.',
    },
    {
      q: '¿Hacéis fiestas en locales y también en casas?',
      a: 'Sí. El equipo es adaptable a cualquier espacio: pisos, jardines, terrazas, salas de fiestas o restaurantes.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Baix Llobregat',
    zoneSlug: 'baix-llobregat',
    service: 'fiestas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: baixLlobregatTowns,
    highlights: COPY.zone.highlights,
    description: COPY.zone.description(MIN_PRICE),
    whyChooseUs: COPY.zone.whyChooseUs,
    faqs: faqItems.map((f) => ({ question: f.q, answer: f.a })),
    heroImage,
    galleryImages,
  };

  return (
    <>
      <Breadcrumbs items={buildPublicZoneBreadcrumbs({
        service: 'fiestas',
        zoneSlug: 'dj-fiestas-baix-llobregat',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-fiestas-baix-llobregat"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={baixLlobregatTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
