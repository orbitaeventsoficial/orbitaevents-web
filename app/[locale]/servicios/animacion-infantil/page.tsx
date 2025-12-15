// app/[locale]/servicios/animacion-infantil/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import AnimacionInfantilClient from './AnimacionInfantilClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Animació Infantil Barcelona | Festes Infantils Professionals | Òrbita Events',
  description:
    'Animació infantil professional per a festes, comunions i esdeveniments. Jocs, pintacares, màgia, globoflèxia, tallers i música infantil. Barcelona i Girona.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  alternates: { canonical: '/servicios/animacion-infantil' },
  openGraph: {
    title: 'Animació Infantil | Festes per als Més Petits',
    description:
      'Animadors professionals per a festes infantils. Jocs, màgia, pintacares, globoflèxia i molt més. Diversió garantida!',
    url: '/servicios/animacion-infantil',
    images: [
      {
        url: '/api/og?title=Animacio%20Infantil%20Barcelona',
        alt: 'Animació infantil amb jocs i activitats',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Animació Infantil | Festes Infantils Barcelona',
    description:
      'Animadors professionals + Jocs + Màgia + Pintacares + Globoflèxia. Festes inoblidables per als petits!',
    images: ['/api/og?title=Animacio%20Infantil'],
  },
  robots: { index: true, follow: true },
  keywords: [
    'animació infantil Barcelona',
    'festes infantils Girona',
    'animadors infantils',
    'pintacares Barcelona',
    'màgia infantil',
    'globoflèxia festes',
    'jocs infantils',
    'comunions Barcelona',
    'festes aniversari nens',
    'tallers infantils',
  ],
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
        name="Animació Infantil Professional"
        slugPath="/servicios/animacion-infantil"
        description="Servei d'animació infantil complet: jocs, pintacares, màgia, globoflèxia, tallers creatius i música infantil. Animadors professionals per a festes d'aniversari, comunions i esdeveniments familiars. Barcelona i Girona."
        serviceType={[
          'Animació infantil',
          'Festes infantils',
          'Pintacares',
          'Màgia infantil',
          'Globoflèxia',
          'Tallers creatius',
          'Jocs infantils',
        ]}
        areaServed={['Barcelona', 'Girona', 'Maresme', 'Vallès']}
        priceFrom="150"
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        aggregateRating={{
          ratingValue: 5.0,
          reviewCount: 45,
        }}
      />

      <AnimacionInfantilClient />

      <FAQ items={faqItems} />
    </>
  );
}
