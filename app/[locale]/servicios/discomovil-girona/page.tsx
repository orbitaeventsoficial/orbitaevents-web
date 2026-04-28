// app/[locale]/servicios/discomovil-girona/page.tsx
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
const COPY = LOCAL_SERVICE_LANDING_COPY['discomovil-girona'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');
  return {
  title: COPY.metadata.title(MIN_PRICE),
  description: COPY.metadata.description(MIN_PRICE),
  keywords: COPY.metadata.keywords,
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/discomovil-girona' },
  openGraph: {
    title: COPY.metadata.ogTitle(MIN_PRICE),
    description: COPY.metadata.ogDescription,
    url: '/servicios/discomovil-girona',
    images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const gironaTowns = ['Girona', 'Figueres', 'Olot', 'Salt', 'Blanes', 'Lloret de Mar', 'Tossa de Mar', 'Roses', 'Cadaqués', 'Palamós', 'Sant Feliu de Guíxols', 'Platja d\'Aro'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilGironaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Hacéis discomóvil en toda la provincia de Girona?',
      a: `Sí, cubrimos toda la provincia de Girona: ciudad, Costa Brava, Empordà, Garrotxa y comarca de la Selva. El desplazamiento está incluido desde ${MIN_PRICE}€.`,
    },
    {
      q: '¿Cuánto cuesta llevar el equipo hasta Girona desde el área de Barcelona?',
      a: 'El desplazamiento a Girona capital y municipios de la provincia está incluido en todos nuestros packs. Sin recargos ocultos ni kilómetros extra.',
    },
    {
      q: '¿Podéis hacer el discomóvil en masías de la provincia de Girona?',
      a: 'Sí, somos expertos en fiestas en masías y casas rurales. Llevamos todo el equipo, incluido generador si es necesario, y montamos en cualquier espacio.',
    },
    {
      q: '¿Cubrís las comarcas del Empordà y la Selva?',
      a: 'Sí. Trabajamos en todo el Alt Empordà, Baix Empordà y la Selva: Figueres, Roses, Cadaqués, Palamós, Tossa, Lloret, Blanes y alrededores.',
    },
    {
      q: '¿Cuántos profesionales van al evento?',
      a: 'Normalmente un DJ profesional con el equipo completo. En packs premium incluimos un técnico de luces adicional para shows más espectaculares.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Girona',
    zoneSlug: 'girona',
    service: 'discomovil',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: gironaTowns,
    highlights: COPY.zone.highlights,
    description: COPY.zone.description(MIN_PRICE),
    whyChooseUs: COPY.zone.whyChooseUs,
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: heroImage,
    galleryImages: galleryImages,
  };

  return (
    <>
      <Breadcrumbs items={buildPublicZoneBreadcrumbs({
        service: 'discomovil',
        zoneSlug: 'discomovil-girona',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/discomovil-girona"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={gironaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
