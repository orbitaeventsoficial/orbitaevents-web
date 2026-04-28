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
const COPY = LOCAL_PARTY_LANDING_COPY['dj-fiestas-girona'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('fiestas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-fiestas-girona' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-fiestas-girona',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const gironaTowns = ['Girona', 'Salt', 'Figueres', 'Olot', 'Banyoles', 'Blanes', 'Lloret de Mar', 'Sant Feliu de Guíxols', 'Palafrugell', 'La Bisbal d\'Empordà'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJFiestasGironaPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const galleryImages = await getPublicServiceGalleryImages('fiestas');

  const faqItems = [
    {
      q: '¿Cuánto cuesta contratar un DJ para una fiesta en Girona?',
      a: `Desde ${MIN_PRICE}€ con nuestra Oferta Flash. Los packs estándar empiezan desde 350€ para 3 horas. Incluye DJ, equipo de sonido profesional e iluminación.`,
    },
    {
      q: '¿Os desplazáis a toda la provincia de Girona?',
      a: 'Sí. Cubrimos toda la provincia: Girona ciudad, Costa Brava, Empordà, Selva, Garrotxa y Pla de l\'Estany. El desplazamiento está incluido.',
    },
    {
      q: '¿Qué tipo de fiestas hacéis en Girona?',
      a: 'Todo tipo: cumpleaños, despedidas, aniversarios, fiestas privadas, graduaciones y celebraciones. Nos adaptamos al espacio y al estilo musical que queráis.',
    },
    {
      q: '¿El equipo de sonido es profesional?',
      a: 'Sí. Altavoces Electro-Voice ETX de 4000W total y controladora Pioneer DDJ REV7. El mismo equipo que usamos en bodas y eventos de empresa.',
    },
  ];

  const zoneConfig: ZoneConfig = {
    zone: 'Girona',
    zoneSlug: 'girona',
    service: 'fiestas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: gironaTowns,
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
        zoneSlug: 'dj-fiestas-girona',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-fiestas-girona"
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
