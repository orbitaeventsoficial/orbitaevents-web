// app/[locale]/servicios/dj-bodas-maresme/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Maresme | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Maresme desde ${MIN_PRICE}€. Mataró, Calella, Arenys de Mar, Vilassar. Desplazamiento incluido.`,
  keywords: ['DJ bodas Maresme', 'DJ bodas Mataró', 'DJ bodas Calella', 'DJ bodas Arenys de Mar', 'bodas Maresme'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-maresme' },
  openGraph: {
    title: `DJ Bodas Maresme | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Maresme. Toda la comarca con desplazamiento incluido.',
    url: '/servicios/dj-bodas-maresme',
    images: [{ url: '/img/portfolio/bodas/bodas-04.webp', alt: 'DJ Bodas Maresme - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const maresmeTowns = ['Mataró', 'Calella', 'Arenys de Mar', 'Vilassar de Mar', 'Premià de Mar', 'El Masnou', 'Canet de Mar', 'Sant Pol de Mar', 'Pineda de Mar', 'Tordera', 'Argentona', 'Cabrera de Mar', 'Alella'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasMaresmePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-maresme' });
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
    zone: 'Maresme',
    zoneSlug: 'maresme',
    service: 'bodas',
    heroTitle: 'DJ Bodas Maresme',
    heroSubtitle: 'Mataró · Calella · Arenys de Mar · Vilassar · Toda la comarca',
    minPrice: MIN_PRICE,
    towns: maresmeTowns,
    highlights: ['Toda la comarca', 'Desplazamiento incluido', 'Masías y costa', 'Generador disponible'],
    description: `DJ profesional para bodas en el Maresme. Cubrimos toda la comarca con desplazamiento incluido.`,
    whyChooseUs: [
      'Toda la comarca: Mataró, Calella, Arenys y más',
      'Desplazamiento incluido: Sin costes adicionales',
      'Masías y costa: Experiencia en todo tipo de espacios',
      'Adaptable: Preparados para limitaciones eléctricas',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: 'Bodas', url: '/servicios/bodas' },
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
        aggregateRating={{ ratingValue: 5.0, reviewCount: 15 }}
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
