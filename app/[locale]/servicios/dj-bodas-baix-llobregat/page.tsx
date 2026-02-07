// app/[locale]/servicios/dj-bodas-baix-llobregat/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Baix Llobregat | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Baix Llobregat desde ${MIN_PRICE}€. Hospitalet, Cornellà, Sant Boi, El Prat. Desplazamiento incluido.`,
  keywords: ['DJ bodas Baix Llobregat', 'DJ bodas Hospitalet', 'DJ bodas Cornellà', 'DJ bodas Sant Boi', 'bodas Baix Llobregat'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-baix-llobregat' },
  openGraph: {
    title: `DJ Bodas Baix Llobregat | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Baix Llobregat. Toda la comarca con desplazamiento incluido.',
    url: '/servicios/dj-bodas-baix-llobregat',
    images: [{ url: '/img/portfolio/bodas/bodas-02.avif', alt: 'DJ Bodas Baix Llobregat - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const baixLlobregatTowns = ['L\'Hospitalet de Llobregat', 'Cornellà de Llobregat', 'Sant Boi de Llobregat', 'El Prat de Llobregat', 'Viladecans', 'Gavà', 'Castelldefels', 'Esplugues de Llobregat', 'Sant Joan Despí', 'Sant Just Desvern', 'Sant Feliu de Llobregat', 'Molins de Rei', 'Martorell', 'Sant Andreu de la Barca'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasBaixLlobregatPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-baix-llobregat' });
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
    zone: 'Baix Llobregat',
    zoneSlug: 'baix-llobregat',
    service: 'bodas',
    heroTitle: 'DJ Bodas Baix Llobregat',
    heroSubtitle: 'Hospitalet · Cornellà · Sant Boi · El Prat · Toda la comarca',
    minPrice: MIN_PRICE,
    towns: baixLlobregatTowns,
    highlights: ['Toda la comarca', 'Desplazamiento incluido', 'Masías y espacios rurales', 'Cerca de Barcelona'],
    description: `DJ profesional para bodas en el Baix Llobregat. Cubrimos toda la comarca con desplazamiento incluido.`,
    whyChooseUs: [
      'Toda la comarca: Hospitalet, Cornellà, Sant Boi y más',
      'Desplazamiento incluido: Sin costes adicionales',
      'Variedad de espacios: Masías, restaurantes y hoteles',
      'Conexión Barcelona: Fácil acceso desde la ciudad',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
        { name: 'DJ Bodas Baix Llobregat', url: '/servicios/dj-bodas-baix-llobregat' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Baix Llobregat"
        slugPath="/servicios/dj-bodas-baix-llobregat"
        description={`DJ profesional para bodas en el Baix Llobregat. Desplazamiento incluido. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Baix Llobregat', 'DJ bodas Hospitalet', 'DJ bodas Cornellà']}
        areaServed={baixLlobregatTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
