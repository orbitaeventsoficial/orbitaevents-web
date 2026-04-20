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

const MIN_PRICE = getMinPriceByService('discomovil');
const COPY = LOCAL_SERVICE_LANDING_COPY['discomovil-baix-llobregat'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/discomovil-baix-llobregat' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/discomovil-baix-llobregat',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const baixLlobregatTowns = ['L\'Hospitalet de Llobregat', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Esplugues de Llobregat', 'Gavà', 'Viladecans', 'Sant Joan Despí', 'Sant Feliu de Llobregat', 'Molins de Rei'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilBaixLlobregatPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Cuánto cuesta una discomóvil en el Baix Llobregat?',
      a: `Desde ${MIN_PRICE}€. Incluye DJ, equipo de sonido profesional de 4000W, iluminación LED completa, montaje y desmontaje.`,
    },
    {
      q: '¿Qué diferencia hay entre discomóvil y DJ?',
      a: 'La discomóvil incluye todo el montaje visual: focos LED, láser, bola de espejos y efectos. Es un espectáculo completo, no solo música.',
    },
    {
      q: '¿Se puede montar en cualquier espacio?',
      a: 'Sí. Adaptamos el montaje al espacio: salas, jardines, terrazas, restaurantes o naves. Solo necesitamos un enchufe.',
    },
    {
      q: '¿El desplazamiento tiene coste extra?',
      a: 'No. Desplazamiento incluido a todo el Baix Llobregat.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Baix Llobregat',
    zoneSlug: 'baix-llobregat',
    service: 'discomovil',
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
      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.services'), url: '/servicios' },
          { name: 'Discomóvil', url: '/servicios/discomovil' },
          { name: COPY.breadcrumbLabel, url: '/servicios/discomovil-baix-llobregat' },
        ]}
      />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/discomovil-baix-llobregat"
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
