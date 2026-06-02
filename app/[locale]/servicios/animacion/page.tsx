// app/[locale]/servicios/animacion/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import AnimacioClient from './AnimacioClient';
import { getSiteUrl } from '@/lib/site';
import { STANDALONE_SERVICE_SEO } from '@/lib/standaloneServiceSeo';
import { getAnimacioProducts } from '@/lib/constants/animacio-products-resolver';

const SEO = STANDALONE_SERVICE_SEO['animacion'];

export const metadata: Metadata = {
  title: SEO.metadata.title,
  description: SEO.metadata.description,
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/animacion' },
  openGraph: {
    title: SEO.metadata.openGraphTitle,
    description: SEO.metadata.openGraphDescription,
    url: '/servicios/animacion',
    images: [
      {
        url: SEO.metadata.openGraphImage!,
        alt: SEO.metadata.openGraphImageAlt,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.metadata.twitterTitle,
    description: SEO.metadata.twitterDescription,
    images: [SEO.metadata.twitterImage!],
  },
  robots: { index: true, follow: true },
  keywords: SEO.metadata.keywords,
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AnimacioPage({ params }: PageProps) {
  const { locale } = await params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const products = await getAnimacioProducts(locale);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.services'), url: '/servicios' },
          { name: 'Animació Musical', url: '/servicios/animacion' },
        ]}
      />

      <ServiceJsonLD
        name={SEO.jsonLd.name}
        slugPath="/servicios/animacion"
        description={SEO.jsonLd.description}
        serviceType={SEO.jsonLd.serviceType}
        areaServed={SEO.jsonLd.areaServed}
        priceFrom={SEO.jsonLd.priceFrom}
        priceCurrency={SEO.jsonLd.priceCurrency}
        availability={SEO.jsonLd.availability}
      />

      <AnimacioClient products={products} />
    </>
  );
}
