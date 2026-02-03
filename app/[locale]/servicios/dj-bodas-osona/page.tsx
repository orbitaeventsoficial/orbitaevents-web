// app/[locale]/servicios/dj-bodas-osona/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Osona | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en Osona desde ${MIN_PRICE}€. Vic, Manlleu, Torelló, Centelles. Especialistas en masías y entornos rurales.`,
  keywords: ['DJ bodas Osona', 'DJ bodas Vic', 'DJ bodas Manlleu', 'DJ bodas Torelló', 'bodas masías Osona'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-osona' },
  openGraph: {
    title: `DJ Bodas Osona | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Osona. Especialistas en masías y entornos rurales.',
    url: '/servicios/dj-bodas-osona',
    images: [{ url: '/img/portfolio/bodas/bodas-04.avif', alt: 'DJ Bodas Osona - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const osonaTowns = ['Vic', 'Manlleu', 'Torelló', 'Centelles', 'Tona', 'Taradell', 'Sant Hipòlit de Voltregà', 'Roda de Ter', 'Seva', 'Les Masies de Voltregà', 'Sant Julià de Vilatorta', 'Gurb', 'Santa Eugènia de Berga', 'Balenyà'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasOsonaPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-osona' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

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
    zone: 'Osona',
    zoneSlug: 'osona',
    service: 'bodas',
    heroTitle: 'DJ Bodas Osona',
    heroSubtitle: 'Vic · Manlleu · Torelló · Centelles · Masías con encanto',
    minPrice: MIN_PRICE,
    towns: osonaTowns,
    // Keywords SEO reals
    highlights: ['DJ boda Vic', 'Bodas masía Osona', 'Precio DJ boda', 'Bodas rurales Catalunya'],
    description: `DJ profesional para bodas en Osona. Especialistas en masías y entornos rurales de la comarca.`,
    whyChooseUs: [
      'Masías con encanto: Experiencia en los mejores espacios de Osona',
      'Generador propio: Para fincas sin conexión eléctrica',
      'Desplazamiento incluido: Toda la comarca cubierta',
      'Paisajes únicos: Bodas con vistas al Montseny y los Pirineos',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: '/img/portfolio/bodas/bodas-01.avif',
    galleryImages: [
      '/img/portfolio/bodas/bodas-02.avif',
      '/img/portfolio/bodas/bodas-03.avif',
      '/img/portfolio/bodas/bodas-04.avif',
      '/img/portfolio/discomovil/discomovil-05.avif',
    ],
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
        { name: 'DJ Bodas Osona', url: '/servicios/dj-bodas-osona' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Osona"
        slugPath="/servicios/dj-bodas-osona"
        description={`DJ profesional para bodas en Osona. Especialistas en masías y entornos rurales. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Osona', 'DJ bodas Vic', 'DJ bodas masías']}
        areaServed={osonaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
