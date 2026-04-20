// app/[locale]/servicios/animacion-infantil/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import AnimacionInfantilClient from './AnimacionInfantilClient';
import { getSiteUrl } from '@/lib/site';
import { STANDALONE_SERVICE_SEO } from '@/lib/standaloneServiceSeo';

const SEO = STANDALONE_SERVICE_SEO['animacion-infantil'];

export const metadata: Metadata = {
  title: SEO.metadata.title,
  description: SEO.metadata.description,
  metadataBase: new URL(getSiteUrl()),
  alternates: { canonical: '/servicios/animacion-infantil' },
  openGraph: {
    title: SEO.metadata.openGraphTitle,
    description: SEO.metadata.openGraphDescription,
    url: '/servicios/animacion-infantil',
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

export default async function AnimacionInfantilPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.animacion-infantil' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

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
          { name: 'Animació Infantil', url: '/servicios/animacion-infantil' },
        ]}
      />

      <ServiceJsonLD
        name={SEO.jsonLd.name}
        slugPath="/servicios/animacion-infantil"
        description={SEO.jsonLd.description}
        serviceType={SEO.jsonLd.serviceType}
        areaServed={SEO.jsonLd.areaServed}
        priceFrom={SEO.jsonLd.priceFrom}
        priceCurrency={SEO.jsonLd.priceCurrency}
        availability={SEO.jsonLd.availability}
      />

      <AnimacionInfantilClient />

      <FAQ items={faqItems} />
    </>
  );
}
