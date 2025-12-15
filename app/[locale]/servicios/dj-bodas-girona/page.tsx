// app/[locale]/servicios/dj-bodas-girona/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Girona | Ciudad y Provincia | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en Girona desde ${MIN_PRICE}€. Cobertura en Girona ciudad, Figueres, Olot, Banyoles, Salt. Sonido profesional 4000W, iluminación y efectos. Presupuesto gratis.`,
  keywords: ['DJ bodas Girona', 'DJ bodas Figueres', 'DJ bodas Olot', 'DJ boda Banyoles', 'DJ matrimonio Girona', 'discomóvil Girona'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-girona' },
  openGraph: {
    title: `DJ Bodas Girona | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en Girona. Ciudad, Figueres, Olot, Banyoles y toda la provincia.',
    url: '/servicios/dj-bodas-girona',
    images: [{ url: '/img/portfolio/bodas/bodas-02.webp', alt: 'DJ Bodas Girona - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const gironaTowns = ['Girona', 'Figueres', 'Olot', 'Banyoles', 'Salt', 'Blanes', 'Lloret de Mar', 'Roses', 'Palafrugell', 'Sant Feliu de Guíxols', 'Palamós', 'La Bisbal d\'Empordà', 'Ripoll', 'Besalú', 'Torroella de Montgrí', 'Cassà de la Selva'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasGironaPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-girona' });
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
    zone: 'Girona',
    zoneSlug: 'girona',
    service: 'bodas',
    heroTitle: 'DJ Bodas Girona',
    heroSubtitle: 'Girona · Figueres · Olot · Banyoles · Toda la provincia',
    minPrice: MIN_PRICE,
    towns: gironaTowns,
    highlights: ['Toda la provincia', 'Sonido profesional 4000W', 'Experiencia en masías', 'Catalán, castellano e inglés'],
    description: `¿Buscas un DJ para tu boda en Girona? En Òrbita Events somos especialistas en bodas en toda la provincia de Girona: desde la ciudad hasta el Empordà, pasando por la Garrotxa, el Gironès y la Selva.`,
    whyChooseUs: [
      'Cobertura completa: Trabajamos en toda la provincia de Girona',
      'Experiencia en masías: Conocemos las particularidades de las masías del Empordà',
      'Multilingüe: Catalán, castellano e inglés',
      'Espacios históricos: Experiencia en monumentos y patrimonio protegido',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: 'Bodas', url: '/servicios/bodas' },
        { name: 'DJ Bodas Girona', url: '/servicios/dj-bodas-girona' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Girona"
        slugPath="/servicios/dj-bodas-girona"
        description={`DJ profesional para bodas en Girona. Cobertura completa. Sonido 4000W, iluminación LED. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Girona', 'DJ bodas Figueres', 'DJ bodas Olot', 'Discomóvil Girona']}
        areaServed={gironaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 18 }}
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
