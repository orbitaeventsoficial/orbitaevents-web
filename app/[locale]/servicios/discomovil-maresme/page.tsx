// app/[locale]/servicios/discomovil-maresme/page.tsx
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
const COPY = LOCAL_SERVICE_LANDING_COPY['discomovil-maresme'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');
  return {
  title: COPY.metadata.title(MIN_PRICE),
  description: COPY.metadata.description(MIN_PRICE),
  keywords: COPY.metadata.keywords,
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/discomovil-maresme' },
  openGraph: {
    title: COPY.metadata.ogTitle(MIN_PRICE),
    description: COPY.metadata.ogDescription,
    url: '/servicios/discomovil-maresme',
    images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const maresmeTowns = ['Mataró', 'Calella', 'Pineda de Mar', 'Arenys de Mar', 'Canet de Mar', 'Malgrat de Mar', 'Santa Susanna', 'Caldes d\'Estrac', 'Premià de Mar', 'Vilassar de Mar', 'Argentona', 'Sant Andreu de Llavaneres'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilMaresmePage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Cuánto cuesta un discomóvil en el Maresme?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash. Los packs estándar empiezan desde 350€ para 3 horas. El desplazamiento al Maresme está incluido en todos los packs.`,
    },
    {
      q: '¿Cubrís Mataró, Calella y toda la costa del Maresme?',
      a: 'Sí, cubrimos toda la comarca del Maresme: Mataró, Calella, Pineda de Mar, Arenys de Mar, Canet, Malgrat, Premià y todos los municipios costeros.',
    },
    {
      q: '¿Podéis hacer el discomóvil en casas con jardín o terrazas del Maresme?',
      a: 'Por supuesto. Estamos especializados en fiestas en espacios privados: jardines, terrazas, salones... Nos adaptamos a tu espacio y montamos en 45 minutos.',
    },
    {
      q: '¿Para qué tipos de fiestas ponéis discomóvil en el Maresme?',
      a: 'Cumpleaños, aniversarios, despedidas, fiestas de verano, reuniones familiares... Todo tipo de celebraciones privadas en el Maresme, tanto en interior como exterior.',
    },
    {
      q: '¿Qué diferencia hay entre discomóvil y contratar solo un DJ?',
      a: 'El discomóvil incluye todo: DJ profesional, equipo de sonido completo (4000W), iluminación, montaje y desmontaje. Solo tienes que disfrutar. No necesitas alquilar nada por separado.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Maresme',
    zoneSlug: 'maresme',
    service: 'discomovil',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: maresmeTowns,
    highlights: COPY.zone.highlights,
    description: COPY.zone.description(MIN_PRICE),
    whyChooseUs: COPY.zone.whyChooseUs,
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: heroImage,
    galleryImages: galleryImages,
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.discomovil'), url: '/servicios/discomovil' },
        { name: COPY.breadcrumbLabel, url: '/servicios/discomovil-maresme' },
      ]} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/discomovil-maresme"
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
