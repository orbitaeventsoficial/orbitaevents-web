// app/[locale]/servicios/dj-bodas-valles/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Vallès | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Vallès desde ${MIN_PRICE}€. Granollers, Sabadell, Terrassa, Mollet. DJ local con desplazamiento incluido.`,
  keywords: ['DJ bodas Vallès', 'DJ bodas Granollers', 'DJ bodas Sabadell', 'DJ bodas Terrassa', 'bodas Vallès Oriental'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-valles' },
  openGraph: {
    title: `DJ Bodas Vallès | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional local para bodas en el Vallès. Oriental y Occidental con desplazamiento incluido.',
    url: '/servicios/dj-bodas-valles',
    images: [{ url: '/img/portfolio/bodas/bodas-05.webp', alt: 'DJ Bodas Vallès - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const vallesTowns = ['Granollers', 'Sabadell', 'Terrassa', 'Mollet del Vallès', 'Cardedeu', 'Sant Cugat del Vallès', 'Rubí', 'Cerdanyola del Vallès', 'Parets del Vallès', 'La Garriga', 'Caldes de Montbui', 'Sant Celoni', 'Montornès del Vallès'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasVallesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-valles' });
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
    zone: 'Vallès',
    zoneSlug: 'valles',
    service: 'bodas',
    heroTitle: 'DJ Bodas Vallès',
    heroSubtitle: 'Granollers · Sabadell · Terrassa · Mollet · Toda la comarca',
    minPrice: MIN_PRICE,
    towns: vallesTowns,
    highlights: ['DJ local', 'Desplazamiento incluido', 'Conocemos las masías', 'Visita previa gratis'],
    description: `DJ profesional local para bodas en el Vallès. Base en Granollers, cubrimos Oriental y Occidental.`,
    whyChooseUs: [
      'DJ local: Base en Granollers, conocemos la zona',
      'Desplazamiento incluido: Sin costes adicionales',
      'Masías del Vallès: Can Bonastre, Cal Blay, Can Ribas...',
      'Visita previa: Conocemos el espacio antes del evento',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: 'Bodas', url: '/servicios/bodas' },
        { name: 'DJ Bodas Vallès', url: '/servicios/dj-bodas-valles' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Vallès"
        slugPath="/servicios/dj-bodas-valles"
        description={`DJ profesional local para bodas en el Vallès. Desplazamiento incluido. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Vallès', 'DJ bodas Granollers', 'DJ bodas Sabadell', 'DJ bodas Terrassa']}
        areaServed={vallesTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 22 }}
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
