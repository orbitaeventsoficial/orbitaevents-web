// app/[locale]/servicios/dj-bodas-costa-brava/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Costa Brava | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en la Costa Brava desde ${MIN_PRICE}€. Cadaqués, Tossa, Lloret, Begur y toda la costa. Sonido profesional resistente a exteriores.`,
  keywords: ['DJ bodas Costa Brava', 'DJ bodas Cadaqués', 'DJ bodas Tossa de Mar', 'DJ bodas Begur', 'bodas playa Costa Brava'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-costa-brava' },
  openGraph: {
    title: `DJ Bodas Costa Brava | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en la Costa Brava. Especialistas en bodas de costa y exteriores.',
    url: '/servicios/dj-bodas-costa-brava',
    images: [{ url: '/img/portfolio/bodas/bodas-03.avif', alt: 'DJ Bodas Costa Brava - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const costaBravaTowns = ['Cadaqués', 'Roses', 'L\'Escala', 'L\'Estartit', 'Begur', 'Calella de Palafrugell', 'Llafranc', 'Tamariu', 'Palamós', 'Sant Antoni de Calonge', 'Platja d\'Aro', 'Sant Feliu de Guíxols', 'Tossa de Mar', 'Lloret de Mar', 'Blanes'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasCostaBravaPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-costa-brava' });
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
    zone: 'Costa Brava',
    zoneSlug: 'costa-brava',
    service: 'bodas',
    heroTitle: 'DJ Bodas Costa Brava',
    heroSubtitle: 'Cadaqués · Tossa · Lloret · Begur · Toda la costa',
    minPrice: MIN_PRICE,
    towns: costaBravaTowns,
    // Keywords SEO reals
    highlights: ['DJ boda Costa Brava', 'Bodas playa Cadaqués', 'Precio DJ boda', 'DJ boda Begur'],
    description: `DJ profesional para bodas en la Costa Brava. Especialistas en bodas de costa con equipo resistente a exteriores.`,
    whyChooseUs: [
      'Especialistas en costa: Equipo preparado para exteriores',
      'Bodas en playa: Protección contra humedad y viento',
      'Conocemos la zona: Cap Roig, Aiguablava, Calella de Palafrugell',
      'Plan B preparado: Nos adaptamos a cambios de tiempo',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
    heroImage: '/img/portfolio/bodas/bodas-03.avif',
    galleryImages: [
      '/img/portfolio/bodas/bodas-01.avif',
      '/img/portfolio/bodas/bodas-02.avif',
      '/img/portfolio/bodas/bodas-04.avif',
      '/img/portfolio/discomovil/discomovil-04.avif',
    ],
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
        { name: 'DJ Bodas Costa Brava', url: '/servicios/dj-bodas-costa-brava' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Costa Brava"
        slugPath="/servicios/dj-bodas-costa-brava"
        description={`DJ profesional para bodas en la Costa Brava. Equipo resistente a exteriores. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Costa Brava', 'DJ bodas playa', 'Bodas costa Girona']}
        areaServed={costaBravaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
