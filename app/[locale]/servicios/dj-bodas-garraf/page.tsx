// app/[locale]/servicios/dj-bodas-garraf/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Garraf | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Garraf desde ${MIN_PRICE}€. Sitges, Vilanova, Cubelles. Especialistas en bodas de costa y chiringuitos.`,
  keywords: ['DJ bodas Garraf', 'DJ bodas Sitges', 'DJ bodas Vilanova', 'DJ bodas costa', 'bodas playa Garraf'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-garraf' },
  openGraph: {
    title: `DJ Bodas Garraf | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Garraf. Especialistas en bodas de costa y espacios con vistas al mar.',
    url: '/servicios/dj-bodas-garraf',
    images: [{ url: '/img/portfolio/bodas/bodas-05.avif', alt: 'DJ Bodas Garraf - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const garrafTowns = ['Sitges', 'Vilanova i la Geltrú', 'Cubelles', 'Sant Pere de Ribes', 'Canyelles', 'Olivella', 'Garraf', 'Les Botigues de Sitges'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasGarrafPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-garraf' });
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
    zone: 'Garraf',
    zoneSlug: 'garraf',
    service: 'bodas',
    heroTitle: 'DJ Bodas Garraf',
    heroSubtitle: 'Sitges · Vilanova · Cubelles · Costa y chiringuitos',
    minPrice: MIN_PRICE,
    towns: garrafTowns,
    highlights: ['Bodas de costa', 'Vistas al Mediterráneo', 'Desplazamiento incluido', 'Equipo para exteriores'],
    description: `DJ profesional para bodas en el Garraf. Especialistas en bodas de costa y espacios con vistas al mar.`,
    whyChooseUs: [
      'Bodas de costa: Chiringuitos, terrazas y playas',
      'Vistas al Mediterráneo: Espacios emblemáticos de Sitges',
      'Desplazamiento incluido: Toda la comarca cubierta',
      'Equipo para exteriores: Protección contra humedad y viento',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
        { name: 'DJ Bodas Garraf', url: '/servicios/dj-bodas-garraf' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Garraf"
        slugPath="/servicios/dj-bodas-garraf"
        description={`DJ profesional para bodas en el Garraf. Especialistas en bodas de costa. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Garraf', 'DJ bodas Sitges', 'DJ bodas Vilanova']}
        areaServed={garrafTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
