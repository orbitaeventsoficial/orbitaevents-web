// app/servicios/fiestas/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiceJsonLD from '@/components/seo/ServiceJsonLD';
import FAQ from '@/components/seo/FAQ';
import Client from './FiestasClient';
import { getDbPacks } from '@/lib/packs-db';

// ===============================
// DATOS CENTRALIZADOS DESDE DB (con fallback a config)
// ===============================
const getMinPrice = (packs: { priceValue: number }[]) =>
  packs.length ? Math.min(...packs.map((p) => p.priceValue)) : 0;

// ===============================
// METADATA SEO (USANDO CONFIG)
// ===============================

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const packs = await getDbPacks({ service: 'fiestas', locale });
  const minPrice = getMinPrice(packs);
  const t = await getTranslations({ locale, namespace: 'services.fiestas' });

  return {
    title: t('meta.title', { price: minPrice }),
    description: t('meta.description', { price: minPrice }),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: '/servicios/fiestas' },
    openGraph: {
      title: t('meta.ogTitle', { price: minPrice }),
      description: t('meta.ogDescription', { price: minPrice }),
      url: '/servicios/fiestas',
      images: [
        {
          url: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
          alt: t('breadcrumb'),
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.ogTitle', { price: minPrice }),
      description: t('meta.description', { price: minPrice }),
      images: ['/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif'],
    },
    robots: { index: true, follow: true },
    keywords: [
      'fiestas privadas barcelona',
      'dj cumpleaños barcelona',
      'dj fiestas barcelona',
      'despedidas barcelona',
      'fiestas temáticas barcelona',
      'dj fiestas girona',
      'cumpleaños con dj',
      'fiesta halloween barcelona',
    ],
  };
}

// ===============================
// PÁGINA
// ===============================
type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FiestasPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services.fiestas' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const packs = await getDbPacks({ service: 'fiestas', locale });
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
          { name: t('breadcrumb'), url: '/servicios/fiestas' },
        ]}
      />

      {/* JSON-LD tirando de packs-config */}
      <ServiceJsonLD
        name="Fiestas Privadas Completas y Personalizadas"
        slugPath="/servicios/fiestas"
        description={`Experiencias completas para fiestas privadas: desde cumpleaños temáticos hasta celebraciones familiares. DJ profesional, sonido 4.000W, iluminación LED, animación y juegos adaptados a todos los invitados. Tematización completa disponible (Halloween, años 80, mundo mágico, tropical). Desde ${minPrice}€.`}
        serviceType={[
          'DJ para fiestas',
          'Fiestas privadas',
          'Cumpleaños temáticos',
          'Despedidas',
          'Fiestas temáticas',
          'Animación fiestas',
          'Iluminación LED',
        ]}
        areaServed={['Barcelona', 'Girona', 'Costa Brava', 'Maresme']}
        priceFrom={String(minPrice)}
        priceCurrency="EUR"
        availability="https://schema.org/InStock"
        offers={packs.map((pack) => ({
          '@type': 'Offer',
          price: String(pack.priceValue),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `/servicios/fiestas#${pack.slug}`,
          name: pack.name,
        }))}
      />

      <Client />

      <FAQ items={faqItems} />
    </>
  );
}
