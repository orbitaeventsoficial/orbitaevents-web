// app/[locale]/servicios/dj-fiestas-barcelona/page.tsx
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
const COPY = LOCAL_PARTY_LANDING_COPY['dj-fiestas-barcelona'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('fiestas');
  await getPublicServiceGalleryImages('fiestas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-fiestas-barcelona' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-fiestas-barcelona',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const barcelonaTowns = ['Barcelona', "L'Hospitalet de Llobregat", 'Badalona', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Esplugues de Llobregat', 'Gavà', 'Viladecans', 'Castelldefels', 'Rubí', 'Molins de Rei'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasBarcelonaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

  const faqItems = [
    {
      q: '¿Cuánto cuesta contratar un DJ para una fiesta en Barcelona?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash para fiestas de hasta 50 personas. Los packs estándar empiezan desde 350€ para 3 horas. Incluye DJ, equipo de sonido 4000W e iluminación.`,
    },
    {
      q: '¿Hacéis DJ para cumpleaños en Barcelona?',
      a: 'Sí, los cumpleaños son uno de nuestros eventos más frecuentes en Barcelona. Desde pequeñas reuniones hasta grandes celebraciones, nos adaptamos a cualquier tamaño y presupuesto.',
    },
    {
      q: '¿Qué diferencia hay entre un DJ para bodas y uno para fiestas?',
      a: 'El DJ de fiestas tiene un enfoque más dinámico y open format: se adapta al momento, acepta peticiones y lleva la energía de la sala. No hay horarios estrictos ni protocolo, ¡solo fiesta!',
    },
    {
      q: '¿El equipo de sonido es realmente profesional?',
      a: 'Sí. Llevamos 2 altavoces Electro-Voice ETX de 2000W (4000W total) y controladora Pioneer DDJ REV7. El mismo equipo que usamos en bodas y eventos de empresa. Nada de altavoces domésticos.',
    },
    {
      q: '¿Podemos hacer peticiones durante la fiesta?',
      a: 'Por supuesto. Las peticiones son bienvenidas en directo. También puedes enviarnos una playlist con tus canciones favoritas antes de la fiesta para que el DJ las prepare.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Barcelona',
    zoneSlug: 'barcelona',
    service: 'fiestas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: barcelonaTowns,
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
        zoneSlug: 'dj-fiestas-barcelona',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-fiestas-barcelona"
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
