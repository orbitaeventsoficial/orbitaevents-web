// app/[locale]/servicios/dj-bodas-costa-brava/page.tsx
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

const MIN_PRICE = getMinPriceByService('bodas');
const COPY = LOCAL_SERVICE_LANDING_COPY['dj-bodas-costa-brava'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('bodas');
  await getPublicServiceGalleryImages('bodas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-bodas-costa-brava' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-bodas-costa-brava',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const costaBravaTowns = ['Cadaqués', 'Roses', 'L\'Escala', 'L\'Estartit', 'Begur', 'Calella de Palafrugell', 'Llafranc', 'Tamariu', 'Palamós', 'Sant Antoni de Calonge', 'Platja d\'Aro', 'Sant Feliu de Guíxols', 'Tossa de Mar', 'Lloret de Mar', 'Blanes'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasCostaBravaPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-costa-brava' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const heroImage = await getPublicServiceHeroImage('bodas');
  const galleryImages = await getPublicServiceGalleryImages('bodas');

  const faqItems = [];
  for (let i = 0; i < 5; i++) {
    try {
      const q = t(`faq.${i}.q`);
      const a = t(`faq.${i}.a`);
      if (q && a && !q.includes('faq.')) {
        faqItems.push({ q, a });
      }
    } catch {
      break;
    }
  }

  const zoneConfig: ZoneConfig = {
    zone: 'Costa Brava',
    zoneSlug: 'costa-brava',
    service: 'bodas',
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
      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.services'), url: '/servicios' },
          { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
          { name: COPY.breadcrumbLabel, url: '/servicios/dj-bodas-costa-brava' },
        ]}
      />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-bodas-costa-brava"
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
