// app/servicios/empresas/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import Client from './client';
import { getMinPriceByService, getPacksByService } from '@/config/packs-config';

const EMP_MIN_PRICE = getMinPriceByService('empresas');
const EMP_PACKS = getPacksByService('empresas');


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.empresas' });

  return {
    title: t('meta.title', { price: EMP_MIN_PRICE }),
    description: t('meta.description', { price: EMP_MIN_PRICE }),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: '/servicios/empresas' },
    openGraph: {
      title: t('meta.ogTitle', { price: EMP_MIN_PRICE }),
      description: t('meta.ogDescription', { price: EMP_MIN_PRICE }),
      url: '/servicios/empresas',
      images: [
        {
          url: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
          alt: t('breadcrumb'),
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.ogTitle', { price: EMP_MIN_PRICE }),
      description: t('meta.description', { price: EMP_MIN_PRICE }),
      images: ['/img/portfolio/eventos-empresa/eventos-empresa-01.webp'],
    },
    robots: { index: true, follow: true },
    keywords: [
      'eventos corporativos barcelona',
      'dj eventos empresa barcelona',
      'team building barcelona',
      'cenas de empresa barcelona',
      'eventos empresariales',
      'presentaciones corporativas',
      'dj empresa girona',
    ],
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function EmpresasPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.empresas' });
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
          { name: t('breadcrumb'), url: '/servicios/empresas' },
        ]}
      />

      <ServiceJsonLD
        name="Eventos Corporativos Profesionales con Toque Humano"
        slugPath="/servicios/empresas"
        description="Eventos corporativos que refuerzan tu marca: cenas de empresa, team building, presentaciones y networking elegante. Producción técnica profesional con sonido Pioneer + EV y coordinación completa."
        serviceType={[
          'Eventos corporativos',
          'Team building',
          'Cenas de empresa',
          'Eventos empresariales',
          'Networking empresarial',
          'Presentaciones corporativas',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(EMP_MIN_PRICE)}
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        aggregateRating={{
          ratingValue: 5.0,
          reviewCount: 47,
        }}
        offers={EMP_PACKS.map((pack) => ({
          '@type': 'Offer',
          name: pack.name,
          price: String(pack.priceValue),
          priceCurrency: 'EUR',
          url: `/servicios/empresas#${pack.slug}`,
          availability: 'https://schema.org/InStock',
          description: pack.tagline,
        }))}
      />

      <Client />

      <FAQ items={faqItems} />
    </>
  );
}
