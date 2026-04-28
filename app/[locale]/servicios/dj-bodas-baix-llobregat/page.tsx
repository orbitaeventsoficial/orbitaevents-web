// app/[locale]/servicios/dj-bodas-baix-llobregat/page.tsx
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


const MIN_PRICE = getMinPriceByService('bodas');
const COPY = LOCAL_SERVICE_LANDING_COPY['dj-bodas-baix-llobregat'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('bodas');
  const galleryImages = await getPublicServiceGalleryImages('bodas');
  return {
  title: COPY.metadata.title(MIN_PRICE),
  description: COPY.metadata.description(MIN_PRICE),
  keywords: COPY.metadata.keywords,
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-bodas-baix-llobregat' },
  openGraph: {
    title: COPY.metadata.ogTitle(MIN_PRICE),
    description: COPY.metadata.ogDescription,
    url: '/servicios/dj-bodas-baix-llobregat',
    images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const baixLlobregatTowns = ['L\'Hospitalet de Llobregat', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Viladecans', 'Gavà', 'Castelldefels', 'Esplugues de Llobregat', 'Sant Joan Despí', 'Sant Just Desvern', 'Sant Feliu de Llobregat', 'Molins de Rei', 'Martorell', 'Sant Andreu de la Barca'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasBaixLlobregatPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-baix-llobregat' });
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
    } catch { break; }
  }

  const zoneConfig: ZoneConfig = {
    zone: 'Baix Llobregat',
    zoneSlug: 'baix-llobregat',
    service: 'bodas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: baixLlobregatTowns,
    // Keywords SEO reals
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
        service: 'bodas',
        zoneSlug: 'dj-bodas-baix-llobregat',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-bodas-baix-llobregat"
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
