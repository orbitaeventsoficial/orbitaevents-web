// app/servicios/fiestas/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import Client from './FiestasClient';
import { getDbPacks } from '@/lib/packs-db';
import { getSiteUrl } from '@/lib/site';
import { getPublicServiceHeroImage } from '@/lib/services/publicServiceMediaService';
import { SERVICE_HUB_SEO } from '@/lib/serviceHubSeo';

const SEO = SERVICE_HUB_SEO.fiestas;

const getMinPrice = (packs: { priceValue: number }[]) =>
  packs.length ? Math.min(...packs.map((p) => p.priceValue)) : 0;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const packs = await getDbPacks({ service: 'fiestas', locale });
  const minPrice = getMinPrice(packs);
  const heroImage = await getPublicServiceHeroImage('fiestas');
  const t = await getTranslations({ locale, namespace: 'services.fiestas' });

  return {
    title: t('meta.title', { price: minPrice }),
    description: t('meta.description', { price: minPrice }),
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios/fiestas' },
    openGraph: {
      title: t('meta.ogTitle', { price: minPrice }),
      description: t('meta.ogDescription', { price: minPrice }),
      url: '/servicios/fiestas',
      images: [{ url: heroImage, alt: t('breadcrumb') }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.ogTitle', { price: minPrice }),
      description: t('meta.description', { price: minPrice }),
      images: [heroImage],
    },
    robots: { index: true, follow: true },
    keywords: SEO.keywords,
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FiestasPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.fiestas' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const packs = await getDbPacks({ service: 'fiestas', locale });
  const minPrice = getMinPrice(packs);
  const heroImage = await getPublicServiceHeroImage('fiestas');

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
          { name: t('breadcrumb'), url: '/servicios/fiestas' },
        ]}
      />

      <ServiceJsonLD
        name={SEO.jsonLd.name}
        slugPath="/servicios/fiestas"
        description={SEO.jsonLd.description(minPrice)}
        serviceType={SEO.jsonLd.serviceType}
        areaServed={SEO.jsonLd.areaServed}
        priceFrom={String(minPrice)}
        priceCurrency="EUR"
        availability={SEO.jsonLd.availability}
        offers={packs.map((pack: { name: string; priceValue: number; slug: string }) => ({
          '@type': 'Offer',
          price: String(pack.priceValue),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `${SEO.jsonLd.offerUrlPrefix}${pack.slug}`,
          name: pack.name,
        }))}
      />

      <Client heroImage={heroImage} />

      <FAQ items={faqItems} />
    </>
  );
}
