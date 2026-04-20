// app/[locale]/servicios/discomovil-barcelona/page.tsx
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
const COPY = LOCAL_SERVICE_LANDING_COPY['discomovil-barcelona'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');
  return {
  title: COPY.metadata.title(MIN_PRICE),
  description: COPY.metadata.description(MIN_PRICE),
  keywords: COPY.metadata.keywords,
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/discomovil-barcelona' },
  openGraph: {
    title: COPY.metadata.ogTitle(MIN_PRICE),
    description: COPY.metadata.ogDescription,
    url: '/servicios/discomovil-barcelona',
    images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const barcelonaTowns = ['Barcelona', "L'Hospitalet de Llobregat", 'Badalona', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Esplugues de Llobregat', 'Gavà', 'Viladecans', 'Castelldefels', 'Sant Feliu de Llobregat', 'Molins de Rei'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DiscomovilBarcelonaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('discomovil');
  const galleryImages = await getPublicServiceGalleryImages('discomovil');

  const faqItems = [
    {
      q: '¿Cuánto cuesta un discomóvil en Barcelona?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash para fiestas de hasta 50 personas. Los packs estándar empiezan desde 350€ para 3 horas con equipo completo, DJ profesional, sonido 4000W e iluminación.`,
    },
    {
      q: '¿El desplazamiento a Barcelona está incluido?',
      a: 'Sí, el desplazamiento a Barcelona capital y área metropolitana está incluido sin coste adicional en todos nuestros packs. Sin sorpresas en el presupuesto final.',
    },
    {
      q: '¿Podéis montar el equipo en pisos, terrazas o locales de Barcelona?',
      a: 'Sí, nos adaptamos a cualquier espacio: pisos, terrazas, jardines privados, locales alquilados... El montaje lleva unos 45 minutos y desmontamos al acabar.',
    },
    {
      q: '¿Qué tipos de fiestas hacéis con discomóvil en Barcelona?',
      a: 'Cumpleaños, aniversarios, despedidas de soltero/a, fiestas de fin de curso, reuniones familiares, fiestas temáticas... Cualquier celebración privada en Barcelona.',
    },
    {
      q: '¿Podemos hacer peticiones de canciones durante la fiesta?',
      a: 'Por supuesto. En todos nuestros packs aceptamos peticiones en directo. También puedes enviarnos una lista de canciones favoritas con antelación para que el DJ las prepare.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Barcelona',
    zoneSlug: 'barcelona',
    service: 'discomovil',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: barcelonaTowns,
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
        { name: COPY.breadcrumbLabel, url: '/servicios/discomovil-barcelona' },
      ]} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/discomovil-barcelona"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={barcelonaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
