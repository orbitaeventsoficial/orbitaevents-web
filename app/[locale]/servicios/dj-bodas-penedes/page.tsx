// app/[locale]/servicios/dj-bodas-penedes/page.tsx
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
const COPY = LOCAL_SERVICE_LANDING_COPY['dj-bodas-penedes'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('bodas');
  await getPublicServiceGalleryImages('bodas');
  return {
    title: COPY.metadata.title(MIN_PRICE),
    description: COPY.metadata.description(MIN_PRICE),
    keywords: COPY.metadata.keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/dj-bodas-penedes' },
    openGraph: {
      title: COPY.metadata.ogTitle(MIN_PRICE),
      description: COPY.metadata.ogDescription,
      url: '/servicios/dj-bodas-penedes',
      images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

const penedesTowns = ['Vilafranca del Penedès', 'Sant Sadurní d\'Anoia', 'Sitges', 'Vilanova i la Geltrú', 'El Vendrell', 'Calafell', 'Sant Pere de Ribes', 'Cubelles', 'Cunit', 'Olèrdola', 'Subirats', 'Torrelavit', 'Gelida', 'Santa Margarida i els Monjos'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasPenedesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-penedes' });
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
    zone: 'Penedès',
    zoneSlug: 'penedes',
    service: 'bodas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: penedesTowns,
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
          { name: COPY.breadcrumbLabel, url: '/servicios/dj-bodas-penedes' },
        ]}
      />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-bodas-penedes"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={penedesTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
