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
const COPY = LOCAL_PARTY_LANDING_COPY['dj-fiestas-garraf'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('fiestas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-fiestas-garraf' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-fiestas-garraf',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const garrafTowns = ['Sitges', 'Vilanova i la Geltrú', 'Sant Pere de Ribes', 'Cubelles', 'Olivella', 'Canyelles', 'Castellet i la Gornal'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasGarrafPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

  const faqItems = [
    {
      q: '¿Cuánto cuesta un DJ para fiestas en Sitges?',
      a: `Desde ${MIN_PRICE}€ con Oferta Flash. Packs estándar desde 350€ para 3 horas con equipo profesional completo.`,
    },
    {
      q: '¿Hacéis fiestas al aire libre en el Garraf?',
      a: 'Sí. Terrazas, jardines, azoteas y villas frente al mar. Nuestro equipo está preparado para exteriores con generador si cal.',
    },
    {
      q: '¿Qué estilo de música ponéis?',
      a: 'Open format: house, techno, reggaeton, pop, disco, indie... lo que tú y tus invitados queráis. O podemos preparar una selección especial.',
    },
    {
      q: '¿El desplazamiento a Sitges tiene coste extra?',
      a: 'No. El desplazamiento a todo el Garraf está incluido en el precio del pack.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Garraf',
    zoneSlug: 'garraf',
    service: 'fiestas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: garrafTowns,
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
          { name: COPY.breadcrumbLabel, url: '/servicios/dj-fiestas-garraf' },
        ]}
      />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-fiestas-garraf"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={garrafTowns}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
