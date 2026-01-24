// app/servicios/discomovil/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import Client from './client';
import { getMinPriceByService, getPacksByService } from '@/config/packs-config';

const DISCO_MIN_PRICE = getMinPriceByService('discomovil');
const DISCO_PACKS = getPacksByService('discomovil');


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.discomovil' });

  return {
    title: t('meta.title', { price: DISCO_MIN_PRICE }),
    description: t('meta.description', { price: DISCO_MIN_PRICE }),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: '/servicios/discomovil' },
    openGraph: {
      title: t('meta.ogTitle', { price: DISCO_MIN_PRICE }),
      description: t('meta.ogDescription', { price: DISCO_MIN_PRICE }),
      url: '/servicios/discomovil',
      images: [{ url: '/img/portfolio/discomovil/discomovil-01.png', alt: t('breadcrumb') }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.ogTitle', { price: DISCO_MIN_PRICE }),
      description: t('meta.description', { price: DISCO_MIN_PRICE }),
      images: ['/img/portfolio/discomovil/discomovil-01.png'],
    },
    robots: { index: true, follow: true },
    keywords: ['discomóvil barcelona', 'discomóvil girona', 'dj fiestas privadas barcelona', 'discomóvil cumpleaños', 'discomóvil bodas'],
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DiscomovilPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.discomovil' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const faqItems = [];
  for (let i = 0; i < 6; i++) {
    try {
      const q = t(`faq.${i}.q`);
      const a = t(`faq.${i}.a`);
      if (q && a && !q.includes('faq.')) {
        faqItems.push({ q, a });
      }
    } catch { break; }
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.services'), url: '/servicios' },
          { name: t('breadcrumb'), url: '/servicios/discomovil' },
        ]}
      />
      <ServiceJsonLD
        name="Discomóvil Completa - Experiencia Personalizada"
        slugPath="/servicios/discomovil"
        description={`Experiencia completa personalizada: DJ profesional, sonido EV profesional, iluminación LED ambiente y efectos especiales. Packs desde ${DISCO_MIN_PRICE}€.`}
        serviceType={['Discomóvil', 'DJ para fiestas', 'DJ bodas', 'DJ cumpleaños', 'Iluminación LED', 'Efectos especiales']}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(DISCO_MIN_PRICE)}
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        offers={DISCO_PACKS.map((pack) => ({
          '@type': 'Offer',
          name: pack.name,
          price: String(pack.priceValue),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `/servicios/discomovil#${pack.slug}`,
          description: pack.tagline,
        }))}
      />
      <Client />
      <FAQ items={faqItems} />
    </>
  );
}
