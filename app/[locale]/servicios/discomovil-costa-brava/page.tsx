import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';
import { getSiteUrl } from '@/lib/site';
import { getPublicServiceHeroImage, getPublicServiceGalleryImages } from '@/lib/services/publicServiceMediaService';
import { LOCAL_SERVICE_LANDING_COPY } from '@/lib/localServiceLandingCopy';
import { buildPublicZoneBreadcrumbs } from '@/lib/publicZoneBreadcrumbs';

const MIN_PRICE = getMinPriceByService('discomovil');
const COPY = LOCAL_SERVICE_LANDING_COPY['discomovil-costa-brava'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/discomovil-costa-brava' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/discomovil-costa-brava',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const costaBravaTowns = ['Lloret de Mar', 'Blanes', 'Tossa de Mar', 'Palamós', 'Palafrugell', 'Sant Feliu de Guíxols', 'Platja d\'Aro', 'Roses', 'L\'Estartit', 'Cadaqués'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilCostaBravaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Cuánto cuesta una discomóvil en la Costa Brava?',
      a: `Desde ${MIN_PRICE}€. Incluye DJ, equipo de sonido profesional, iluminación LED y montaje/desmontaje.`,
    },
    {
      q: '¿Os desplazáis a Lloret, Blanes y Palamós?',
      a: 'Sí. Cubrimos toda la Costa Brava: Lloret de Mar, Blanes, Tossa, Palamós, Palafrugell, Sant Feliu, Platja d\'Aro, Roses. Desplazamiento incluido.',
    },
    {
      q: '¿Se puede montar en la playa o al aire libre?',
      a: 'Sí. El equipo es portátil y resistente a exteriores. Chiringuitos, terrazas, jardines y villas frente al mar.',
    },
    {
      q: '¿Qué horario tenéis?',
      a: 'Flexible. Packs de 3h, 5h o noche completa. Nos adaptamos al horario que necesites.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Costa Brava',
    zoneSlug: 'costa-brava',
    service: 'discomovil',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: costaBravaTowns,
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
        service: 'discomovil',
        zoneSlug: 'discomovil-costa-brava',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/discomovil-costa-brava"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={costaBravaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
