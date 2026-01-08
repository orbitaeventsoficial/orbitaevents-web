// app/servicios/bodas/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import nextDynamic from 'next/dynamic';

import { getMinPriceByService, getPacksByService } from '@/config/packs-config';


const BodasClient = nextDynamic(() => import('./client'));

const MIN_PRICE = getMinPriceByService('bodas');
const PACKS = getPacksByService('bodas');

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.bodas' });

  return {
    title: t('meta.title', { price: MIN_PRICE }),
    description: t('meta.description', { price: MIN_PRICE }),
    keywords:
      'dj bodas barcelona, dj boda girona, dj bodas maresme, dj bodas costa brava, sonido bodas, musica boda, efectos especiales bodas',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: '/servicios/bodas' },
    openGraph: {
      title: t('meta.ogTitle', { price: MIN_PRICE }),
      description: t('meta.ogDescription', { price: MIN_PRICE }),
      url: '/servicios/bodas',
      images: [{ url: '/img/portfolio/bodas/bodas-01.webp', alt: t('breadcrumb') }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.ogTitle', { price: MIN_PRICE }),
      description: t('meta.description', { price: MIN_PRICE }),
      images: ['/img/portfolio/bodas/bodas-01.webp'],
    },
    robots: { index: true, follow: true },
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BodasPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.bodas' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  // Obtener FAQs del archivo de traducciones
  const faqItems = [];
  for (let i = 0; i < 6; i++) {
    try {
      const q = t(`faq.${i}.q`);
      const a = t(`faq.${i}.a`);
      if (q && a && !q.includes('faq.')) {
        faqItems.push({ q, a });
      }
    } catch {
      break;
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.services'), url: '/servicios' },
          { name: t('breadcrumb'), url: '/servicios/bodas' },
        ]}
      />

      <ServiceJsonLD
        name="Experiencia Completa para Bodas"
        slugPath="/servicios/bodas"
        description={`Experiencia completa personalizada para bodas: DJ profesional, sonido EV 4.000W, iluminación de ambiente y efectos especiales adaptados a vuestra historia. Packs desde ${MIN_PRICE}€.`}
        serviceType={[
          'DJ para bodas',
          'Sonido e iluminación bodas',
          'Producción musical bodas',
          'Efectos especiales bodas',
          'Animación bodas',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(MIN_PRICE)}
        priceCurrency="EUR"
        aggregateRating={{ ratingValue: 5.0, reviewCount: 1 }}
        offers={PACKS.map((p) => ({
          '@type': 'Offer',
          name: p.name,
          price: String(p.priceValue),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `/servicios/bodas#${p.slug}`,
          description: p.tagline,
        }))}
      />

      <BodasClient />

      <FAQ items={faqItems} />
    </>
  );
}
