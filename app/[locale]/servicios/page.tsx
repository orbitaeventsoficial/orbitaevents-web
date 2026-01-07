// app/servicios/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiciosClient from './client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: [
      'servicios eventos Barcelona',
      'DJ bodas Barcelona',
      'discomovil Barcelona',
      'fiestas privadas Barcelona',
      'eventos corporativos Barcelona',
      'animacion infantil Barcelona',
      'alquiler sonido Barcelona',
      'produccion tecnica eventos',
    ],
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: '/servicios' },
    openGraph: {
      title: 'Servicios DJ y Eventos Barcelona | Orbita Events',
      description: 'DJ profesional, discomovil, fiestas privadas, eventos corporativos, animacion infantil y mas. Desde 250 EUR. Barcelona y Girona.',
      url: '/servicios',
      images: [{ url: '/img/og-image.jpg', alt: 'Servicios Orbita Events Barcelona' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Servicios DJ y Eventos Barcelona | Orbita Events',
      description: 'DJ profesional, discomovil, fiestas privadas y mas. Desde 250 EUR.',
      images: ['/img/og-image.jpg'],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ServiciosPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  // Get all service data
  const serviciosConfig = [
    { key: 'bodas', href: '/servicios/bodas', popular: true, icon: 'heart', emoji: '??' },
    { key: 'discomovil', href: '/servicios/discomovil', popular: true, icon: 'music', emoji: '??' },
    { key: 'fiestas', href: '/servicios/fiestas', popular: false, icon: 'cake', emoji: '??' },
    { key: 'animacionInfantil', href: '/servicios/animacion-infantil', popular: false, icon: 'party', emoji: '??' },
    { key: 'empresas', href: '/servicios/empresas', popular: false, icon: 'briefcase', emoji: '??' },
    { key: 'produccion', href: '/servicios/produccion', popular: false, icon: 'settings', emoji: '???' },
    { key: 'alquiler', href: '/servicios/alquiler', popular: false, icon: 'package', emoji: '??' },
  ];

  const servicios = serviciosConfig.map(s => ({
    ...s,
    name: t(`items.${s.key}.name`),
    tagline: t(`items.${s.key}.tagline`),
    desc: t(`items.${s.key}.desc`),
    features: t.raw(`items.${s.key}.features`) as string[],
  }));

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08),transparent_50%)] -z-10" />

      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.services'), url: '/servicios' },
        ]}
      />

      <ServiciosClient
        servicios={servicios}
        texts={{
          badge: t('hero.badge'),
          title: t('hero.title'),
          titleHighlight: t('hero.titleHighlight'),
          subtitle: t('hero.subtitle'),
          cta: t('hero.cta'),
          configureButton: t('hero.configureButton'),
          exploreBelow: t('hero.exploreBelow'),
          equipment: t('hero.features.equipment'),
          backup: t('hero.features.backup'),
          guarantee: t('hero.features.guarantee'),
          mostPopular: t('mostPopular'),
          viewService: t('viewService'),
          ctaTitle: t('cta.title'),
          ctaSubtitle: t('cta.subtitle'),
          ctaResponseTime: t('cta.responseTime'),
          ctaButton: t('cta.button'),
          ctaWhatsappMessage: t('cta.whatsappMessage'),
        }}
      />
    </div>
  );
}