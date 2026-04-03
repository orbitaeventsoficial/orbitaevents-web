// app/[locale]/servicios/dj-bodas-maresme/page.tsx
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
  title: `DJ Bodas Maresme | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Maresme desde ${MIN_PRICE}€. Mataró, Calella, Arenys de Mar, Vilassar. Desplazamiento incluido.`,
  keywords: ['DJ bodas Maresme', 'DJ bodas Mataró', 'DJ bodas Calella', 'DJ bodas Arenys de Mar', 'bodas Maresme'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-bodas-maresme' },
  openGraph: {
    title: `DJ Bodas Maresme | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Maresme. Toda la comarca con desplazamiento incluido.',
    url: '/servicios/dj-bodas-maresme',
    images: [{ url: heroImage, alt: 'DJ Bodas Maresme - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  };
}

const maresmeTowns = ['Mataró', 'Calella', 'Arenys de Mar', 'Vilassar de Mar', 'Premià de Mar', 'El Masnou', 'Canet de Mar', 'Sant Pol de Mar', 'Pineda de Mar', 'Tordera', 'Argentona', 'Cabrera de Mar', 'Alella'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasMaresmePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-maresme' });
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
    zone: 'Maresme',
    zoneSlug: 'maresme',
    service: 'bodas',
    heroTitle: 'DJ Bodas Maresme',
    heroSubtitle: 'Mataró · Calella · Arenys de Mar · Vilassar · Toda la comarca',
    minPrice: MIN_PRICE,
    towns: maresmeTowns,
    // Keywords SEO reals
    highlights: ['DJ boda Mataró', 'Bodas playa Maresme', 'Precio DJ boda', 'DJ boda Calella'],
    description: `DJ profesional para bodas en el Maresme. Cubrimos toda la comarca con desplazamiento incluido.`,
    whyChooseUs: [
      'Toda la comarca: Mataró, Calella, Arenys y más',
      'Desplazamiento incluido: Sin costes adicionales',
      'Masías y costa: Experiencia en todo tipo de espacios',
      'Adaptable: Preparados para limitaciones eléctricas',
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
        { name: 'DJ Bodas Maresme', url: '/servicios/dj-bodas-maresme' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Maresme"
        slugPath="/servicios/dj-bodas-maresme"
        description={`DJ profesional para bodas en el Maresme. Desplazamiento incluido. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Maresme', 'DJ bodas Mataró', 'DJ bodas Calella']}
        areaServed={maresmeTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}

