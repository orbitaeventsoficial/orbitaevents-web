// app/[locale]/servicios/discomovil-valles/page.tsx
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
const COPY = LOCAL_SERVICE_LANDING_COPY['discomovil-valles'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  await getPublicServiceGalleryImages('discomovil');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/discomovil-valles' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/discomovil-valles',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const vallesTowns = ['Granollers', 'Mollet del Vallès', 'Sabadell', 'Terrassa', 'Cerdanyola del Vallès', 'Rubí', 'Sant Cugat del Vallès', 'Montcada i Reixac', 'Parets del Vallès', 'La Llagosta', 'Caldes de Montbui', 'Llinars del Vallès'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilVallesPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Hacéis discomóvil en el Vallès Occidental y Oriental?',
      a: `Sí, cubrimos todo el Vallès: Granollers, Mollet, Sabadell, Terrassa, Cerdanyola, Sant Cugat y municipios de ambas comarcas. Desplazamiento incluido desde ${MIN_PRICE}€.`,
    },
    {
      q: '¿Cubrís Granollers, Sabadell y Terrassa sin recargo?',
      a: 'Sí. El desplazamiento a estas ciudades y a toda la comarca del Vallès está incluido en el precio del pack. Sin costes adicionales por kilómetros.',
    },
    {
      q: '¿Para cuántos invitados montáis el equipo?',
      a: 'Tenemos packs desde 50 hasta 200+ invitados. Nuestra Oferta Flash es ideal para fiestas de hasta 50 personas. Para eventos más grandes, los packs Party Machine o VIP Experience son los más adecuados.',
    },
    {
      q: '¿Podéis hacer fiestas temáticas en el Vallès?',
      a: 'Sí, nos especializamos en fiestas temáticas: Halloween, años 80, tropical, neón... Preparamos la ambientación musical y visual para que tu fiesta sea única.',
    },
    {
      q: '¿Qué equipo de sonido lleváis al Vallès?',
      a: 'Llevamos 2 altavoces EV ETX de 2000W cada uno (4000W total), controladora Pioneer DDJ REV7, iluminación LED completa y máquina de humo. Todo profesional, nada de equipo doméstico.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Vallès',
    zoneSlug: 'valles',
    service: 'discomovil',
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
      <Breadcrumbs items={buildPublicZoneBreadcrumbs({
        service: 'discomovil',
        zoneSlug: 'discomovil-valles',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/discomovil-valles"
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
