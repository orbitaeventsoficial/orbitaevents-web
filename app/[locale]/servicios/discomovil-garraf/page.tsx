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
const COPY = LOCAL_SERVICE_LANDING_COPY['discomovil-garraf'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/discomovil-garraf' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/discomovil-garraf',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const garrafTowns = ['Sitges', 'Vilanova i la Geltrú', 'Sant Pere de Ribes', 'Cubelles', 'Olivella', 'Canyelles'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilGarrafPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Cuánto cuesta una discomóvil en Sitges?',
      a: `Desde ${MIN_PRICE}€. Incluye DJ, equipo de sonido profesional, iluminación LED completa y montaje.`,
    },
    {
      q: '¿Se puede montar al aire libre?',
      a: 'Sí. Terrazas, jardines, villas y chiringuitos. El equipo está preparado para exteriores.',
    },
    {
      q: '¿Qué incluye la discomóvil?',
      a: 'DJ profesional, 2 altavoces de 2000W, controladora Pioneer, iluminación LED robotizada, láser, máquina de humo y bola de espejos.',
    },
    {
      q: '¿Hasta qué hora podéis hacer la fiesta?',
      a: 'Nos adaptamos al horario que necesites. Tenemos packs de 3h, 5h y noche completa.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Garraf',
    zoneSlug: 'garraf',
    service: 'discomovil',
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
          { name: 'Discomóvil', url: '/servicios/discomovil' },
          { name: COPY.breadcrumbLabel, url: '/servicios/discomovil-garraf' },
        ]}
      />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/discomovil-garraf"
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
