// app/[locale]/servicios/dj-bodas-emporda/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import ZoneLandingPage, { type ZoneConfig } from '@/components/zones/ZoneLandingPage';
import { getMinPriceByService } from '@/config/packs-config';

const MIN_PRICE = getMinPriceByService('bodas');

export const metadata: Metadata = {
  title: `DJ Bodas Empordà | Desde ${MIN_PRICE}€ | Òrbita Events`,
  description: `DJ para bodas en el Empordà desde ${MIN_PRICE}€. Figueres, Roses, Cadaqués, L'Escala. Especialistas en bodas con encanto empordanés.`,
  keywords: ['DJ bodas Empordà', 'DJ bodas Figueres', 'DJ bodas Roses', 'DJ bodas Costa Brava', 'bodas Empordà'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/dj-bodas-emporda' },
  openGraph: {
    title: `DJ Bodas Empordà | Desde ${MIN_PRICE}€`,
    description: 'DJ profesional para bodas en el Empordà. Especialistas en masías empordanesas y bodas con vistas al Mediterráneo.',
    url: '/servicios/dj-bodas-emporda',
    images: [{ url: '/img/portfolio/bodas/bodas-05.avif', alt: 'DJ Bodas Empordà - Òrbita Events' }],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const empordaTowns = ['Figueres', 'Roses', 'Cadaqués', 'L\'Escala', 'Empuriabrava', 'Castelló d\'Empúries', 'Peralada', 'Vilabertran', 'Sant Pere Pescador', 'Torroella de Montgrí'];

type PageProps = { params: Promise<{ locale: string }> };

export default async function DJBodasEmpordaPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.dj-bodas-emporda' });
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
    zone: 'Empordà',
    zoneSlug: 'emporda',
    service: 'bodas',
    heroTitle: 'DJ Bodas Empordà',
    heroSubtitle: 'Figueres · Roses · Cadaqués · Costa Brava Nord',
    minPrice: MIN_PRICE,
    towns: empordaTowns,
    highlights: ['Masías con historia', 'Vistas al Mediterráneo', 'Encanto empordanés', 'Desplazamiento incluido'],
    description: `DJ profesional para bodas en el Empordà. Especialistas en masías empordanesas y espacios con vistas al Mediterráneo.`,
    whyChooseUs: [
      'Masías con historia: Conocemos los mejores espacios del Empordà',
      'Costa Brava Nord: Bodas frente al mar en Roses y Cadaqués',
      'Encanto empordanés: Tradición y elegancia catalana',
      'Desplazamiento incluido: Cubrimos todo el Alt y Baix Empordà',
    ],
    faqs: faqItems.map(f => ({ question: f.q, answer: f.a })),
  };

  return (
    <>
      <Breadcrumbs items={[
        { name: tCommon('nav.home'), url: '/' },
        { name: tCommon('nav.services'), url: '/servicios' },
        { name: tCommon('nav.weddings'), url: '/servicios/bodas' },
        { name: 'DJ Bodas Empordà', url: '/servicios/dj-bodas-emporda' },
      ]} />
      <ServiceJsonLD
        name="DJ Bodas Empordà"
        slugPath="/servicios/dj-bodas-emporda"
        description={`DJ profesional para bodas en el Empordà. Masías y costa. Desde ${MIN_PRICE}€.`}
        serviceType={['DJ bodas Empordà', 'DJ bodas Figueres', 'DJ bodas Roses', 'DJ bodas Cadaqués']}
        areaServed={empordaTowns.slice(0, 8)}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
      />
      <ZoneLandingPage config={zoneConfig} />
      <FAQ items={faqItems} />
    </>
  );
}
