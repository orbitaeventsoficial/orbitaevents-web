// app/[locale]/servicios/dj-bodas-selva/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';
import { getSiteUrl } from '@/lib/site';
import { getPublicServiceHeroImage, getPublicServiceGalleryImages } from '@/lib/services/publicServiceMediaService';


const MIN_PRICE = getMinPriceByService('bodas');

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('bodas');
  const galleryImages = await getPublicServiceGalleryImages('bodas');
  return {
  title: `DJ Bodas La Selva | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en La Selva desde ${MIN_PRICE}€. Blanes, Lloret, Santa Coloma, Hostalric. Costa y interior de Girona.`,
  keywords: ['DJ bodas La Selva', 'DJ bodas Blanes', 'DJ bodas Lloret', 'DJ bodas Santa Coloma', 'bodas La Selva Girona'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-bodas-selva' },
  openGraph: {
    title: `DJ Bodas La Selva | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en La Selva. Costa y interior de la comarca de Girona.',
    url: '/servicios/dj-bodas-selva',
    images: [{ url: heroImage, alt: 'DJ Bodas La Selva - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const selvaTowns = ['Blanes', 'Lloret de Mar', 'Santa Coloma de Farners', 'Hostalric', 'Arbúcies', 'Breda', 'Vidreres', 'Caldes de Malavella', 'Cassà de la Selva', 'Tossa de Mar', 'Sils', 'Maçanet de la Selva', 'Riudarenes', 'Anglès'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasSelvaPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-selva' });
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
    zone: 'La Selva',
    zoneSlug: 'selva',
    service: 'bodas',
    heroTitle: 'DJ Bodas La Selva',
    heroSubtitle: 'Blanes · Lloret · Santa Coloma · Hostalric · Costa e interior',
    minPrice: MIN_PRICE,
    towns: selvaTowns,
    // Keywords SEO reals
    highlights: ['DJ boda Lloret', 'Bodas Blanes Costa Brava', 'Precio DJ boda', 'Bodas playa Lloret'],
    description: `DJ profesional para bodas en La Selva. Costa e interior de la comarca entre Barcelona y Girona.`,
    whyChooseUs: [
      'Costa e interior: Blanes, Lloret y masías del interior',
      'Ubicación estratégica: Entre Barcelona y Girona',
      'Desplazamiento incluido: Toda la comarca cubierta',
      'Jardines botánicos: Marimurtra y espacios únicos',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: heroImage,
    galleryImages: galleryImages,
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
        { name: 'DJ Bodas La Selva', url: '/servicios/dj-bodas-selva' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas La Selva"
        slugPath="/servicios/dj-bodas-selva"
        description={`DJ profesional para bodas en La Selva. Costa e interior. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas La Selva', 'DJ bodas Blanes', 'DJ bodas Lloret']}
        areaServed={selvaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}

