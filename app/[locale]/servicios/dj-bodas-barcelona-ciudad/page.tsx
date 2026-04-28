// app/[locale]/servicios/dj-bodas-barcelona-ciudad/page.tsx
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
const COPY = LOCAL_SERVICE_LANDING_COPY['dj-bodas-barcelona-ciudad'];

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('bodas');
  const galleryImages = await getPublicServiceGalleryImages('bodas');
  return {
  title: COPY.metadata.title(MIN_PRICE),
  description: COPY.metadata.description(MIN_PRICE),
  keywords: COPY.metadata.keywords,
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-bodas-barcelona-ciudad' },
  openGraph: {
    title: COPY.metadata.ogTitle(MIN_PRICE),
    description: COPY.metadata.ogDescription,
    url: '/servicios/dj-bodas-barcelona-ciudad',
    images: [{ url: heroImage, alt: COPY.metadata.imageAlt }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const barcelonaCiudadDistricts = ['Eixample', 'Gràcia', 'Sarrià-Sant Gervasi', 'Ciutat Vella', 'Sant Martí', 'Les Corts', 'Sants-Montjuïc', 'Horta-Guinardó', 'Nou Barris', 'Sant Andreu', 'Pedralbes', 'Poblenou', 'El Born', 'Barceloneta'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasBarcelonaCiudadPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-barcelona-ciudad' });
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
    zone: 'Barcelona Ciudad',
    zoneSlug: 'barcelona-ciudad',
    service: 'bodas',
    heroTitle: COPY.zone.heroTitle,
    heroSubtitle: COPY.zone.heroSubtitle,
    minPrice: MIN_PRICE,
    towns: barcelonaCiudadDistricts,
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
        zoneSlug: 'dj-bodas-barcelona-ciudad',
        breadcrumbLabel: COPY.breadcrumbLabel,
        tCommon,
      })} />
      <ServiceJsonLD
        name={COPY.serviceJsonLd.name}
        slugPath="/servicios/dj-bodas-barcelona-ciudad"
        description={COPY.serviceJsonLd.description(MIN_PRICE)}
        serviceType={COPY.serviceJsonLd.serviceType}
        areaServed={barcelonaCiudadDistricts.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
