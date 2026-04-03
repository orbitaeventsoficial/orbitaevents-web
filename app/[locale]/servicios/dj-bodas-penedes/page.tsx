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


const MIN_PRICE = getMinPriceByService('bodas');

export async function generateMetadata(): Promise<Metadata> {
  const heroImage = await getPublicServiceHeroImage('bodas');
  const galleryImages = await getPublicServiceGalleryImages('bodas');
  return {
  title: `DJ Bodas Penedès | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Penedès desde ${MIN_PRICE}€. Vilafranca, Sant Sadurní, Sitges. Especialistas en bodas en bodegas y viñedos.`,
  keywords: ['DJ bodas Penedès', 'DJ bodas Vilafranca', 'DJ bodas Sant Sadurní', 'DJ bodas bodegas', 'bodas viñedos Penedès'],
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/dj-bodas-penedes' },
  openGraph: {
    title: `DJ Bodas Penedès | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Penedès. Especialistas en bodegas y viñedos.',
    url: '/servicios/dj-bodas-penedes',
    images: [{ url: heroImage, alt: 'DJ Bodas Penedès - Òrbita Events' }],
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
    } catch { break; }
  }

  const zoneConfig: ZoneConfig = {
    zone: 'Penedès',
    zoneSlug: 'penedes',
    service: 'bodas',
    heroTitle: 'DJ Bodas Penedès',
    heroSubtitle: 'Vilafranca · Sant Sadurní · Sitges · Bodegas y viñedos',
    minPrice: MIN_PRICE,
    towns: penedesTowns,
    // Keywords SEO reals
    highlights: ['Bodas bodega Penedès', 'DJ boda viñedos', 'Precio DJ boda', 'Bodas cava Sant Sadurní'],
    description: `DJ profesional para bodas en el Penedès. Especialistas en bodas en bodegas y viñedos.`,
    whyChooseUs: [
      'Especialistas en bodegas: Codorníu, Freixenet, Torres...',
      'Acústica en cavas: Sabemos ecualizar espacios subterráneos',
      'Desplazamiento incluido: Toda la comarca cubierta',
      'Generador propio: Por si la finca no tiene potencia',
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
        { name: 'DJ Bodas Penedès', url: '/servicios/dj-bodas-penedes' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Penedès"
        slugPath="/servicios/dj-bodas-penedes"
        description={`DJ profesional para bodas en el Penedès. Especialistas en bodegas y viñedos. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Penedès', 'DJ bodas Vilafranca', 'DJ bodas bodegas']}
        areaServed={penedesTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}

