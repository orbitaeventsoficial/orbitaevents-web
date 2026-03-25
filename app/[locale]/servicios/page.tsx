// app/servicios/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import ServiciosClient from './client';
import { getSiteUrl } from '@/lib/site';



export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.servicios' });
  const title = t('meta.title');
  const description = t('meta.description');
  const keywords = t.raw('meta.keywords') as string[];
  const imageAlt = t('meta.imageAlt');
  return {
    title,
    description,
    keywords,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/servicios' },
    openGraph: {
      title,
      description,
      url: '/servicios',
      images: [{ url: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif', alt: imageAlt }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif'],
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
    { key: 'bodas', href: '/servicios/bodas', popular: true, icon: 'heart', emoji: '💍' },
    { key: 'discomovil', href: '/servicios/discomovil', popular: true, icon: 'music', emoji: '🎧' },
    { key: 'fiestas', href: '/servicios/fiestas', popular: false, icon: 'cake', emoji: '🎉' },
    { key: 'animacionInfantil', href: '/servicios/animacion-infantil', popular: false, icon: 'party', emoji: '🧒' },
    { key: 'empresas', href: '/servicios/empresas', popular: false, icon: 'briefcase', emoji: '💼' },
  ];

  const servicios = serviciosConfig.map(s => ({
    ...s,
    name: t(`items.${s.key}.name`),
    tagline: t(`items.${s.key}.tagline`),
    desc: t(`items.${s.key}.desc`),
    features: t.raw(`items.${s.key}.features`) as string[],
  }));

  return (
    <div className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08),transparent_50%)] -z-10" />

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
          ctaWhatsappButton: t('cta.whatsappButton'),
        }}
      />
    </div>
  );
}
