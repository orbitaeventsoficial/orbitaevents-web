// app/servicios/bodas/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import nextDynamic from 'next/dynamic';

import { getDbPacks } from '@/lib/packs-db';


const BodasClient = nextDynamic(() => import('./client'));

const getMinPrice = (packs: { priceValue: number }[]) =>
  packs.length ? Math.min(...packs.map((p) => p.priceValue)) : 0;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const packs = await getDbPacks({ service: 'bodas', locale });
  const minPrice = getMinPrice(packs);
  const t = await getTranslations({ locale, namespace: 'services.bodas' });

  return {
    title: t('meta.title', { price: minPrice }),
    description: t('meta.description', { price: minPrice }),
    keywords:
      'dj bodas barcelona, dj boda girona, dj bodas maresme, dj bodas costa brava, sonido bodas, musica boda, efectos especiales bodas',
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: '/servicios/bodas' },
    openGraph: {
      title: t('meta.ogTitle', { price: minPrice }),
      description: t('meta.ogDescription', { price: minPrice }),
      url: '/servicios/bodas',
      images: [{ url: '/img/portfolio/bodas/bodas-01.avif', alt: t('breadcrumb') }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.ogTitle', { price: minPrice }),
      description: t('meta.description', { price: minPrice }),
      images: ['/img/portfolio/bodas/bodas-01.avif'],
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
  const packs = await getDbPacks({ service: 'bodas', locale });
  const minPrice = getMinPrice(packs);

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
        description={`Experiencia completa personalizada para bodas: DJ profesional, sonido EV 4.000W, iluminación de ambiente y efectos especiales adaptados a vuestra historia. Packs desde ${minPrice}€.`}
        serviceType={[
          'DJ para bodas',
          'Sonido e iluminación bodas',
          'Producción musical bodas',
          'Efectos especiales bodas',
          'Animación bodas',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(minPrice)}
        priceCurrency="EUR"
        offers={packs.map((p) => ({
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
