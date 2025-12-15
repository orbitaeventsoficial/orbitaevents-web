// app/[locale]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - LA MILLOR PUTA PÀGINA WEB DEL PLANETA
// ═══════════════════════════════════════════════════════════════════════════
// 
// Filosofia Manolo: Cada píxel ven. Zero fake. Tot connectat a BD.
// Versió: 3.0 DEFINITIVA - Desembre 2025
// ═══════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import ClientOnly from '../components/ClientOnly';
import HomeWrapper from '../components/home/HomeWrapper';

// Components REAL - Connectats a BD!
import HeroBrutalReal from '../components/home/HeroBrutal-REAL';
import TestimonialsBrutalReal from '../components/home/TestimonialsBrutal-REAL';
import StatsSectionReal from '../components/home/StatsSection-REAL';

// Components Marketing
import UrgencyBannerReal from '../components/marketing/UrgencyBanner-REAL';
import LiveNotifications from '../components/marketing/LiveNotifications';
import GuaranteeSection from '../components/marketing/GuaranteeSection';
import TransformationSection from '../components/marketing/TransformationSection';

// Components estàtics
import { CTASectionBrutal, WhyUsBrutal } from '../components/home';

export const revalidate = 3600;

// ═══════════════════════════════════════════════════════════════════════════
// METADATA DINÀMICA
// ═══════════════════════════════════════════════════════════════════════════

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'homePage' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.ogTitle'),
      description: t('meta.ogDescription'),
      images: [{ url: '/og-home.jpg', width: 1200, height: 630, alt: 'Òrbita Events' }],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIOS
// ═══════════════════════════════════════════════════════════════════════════

const SERVICES = [
  {
    id: 'bodas',
    emoji: '💍',
    titleKey: 'bodas.title',
    subtitleKey: 'bodas.subtitle',
    descriptionKey: 'bodas.description',
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
    popular: false,
    price: '550€',
  },
  {
    id: 'fiestas',
    emoji: '🎉',
    titleKey: 'fiestas.title',
    subtitleKey: 'fiestas.subtitle',
    descriptionKey: 'fiestas.description',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
    popular: true,
    price: '350€',
  },
  {
    id: 'empresas',
    emoji: '💼',
    titleKey: 'empresas.title',
    subtitleKey: 'empresas.subtitle',
    descriptionKey: 'empresas.description',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
    popular: false,
    price: '400€',
  },
];

async function ServicesSection() {
  const t = await getTranslations('services');

  return (
    <section className="py-20 bg-black" id="serveis">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 mb-4 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-full border border-amber-500/20">
            🎯 {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SERVICES.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className="group block h-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={service.image}
                  alt={t(service.titleKey)}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-4 left-4 text-4xl">{service.emoji}</span>
                {service.popular && (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full animate-pulse">
                    🔥 {t('popular')}
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {t(service.titleKey)}
                </h3>
                <p className="text-amber-400/80 text-sm mb-3">{t(service.subtitleKey)}</p>
                <p className="text-white/60 text-sm mb-4">{t(service.descriptionKey)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold">{t('from')} {service.price}</span>
                  <span className="text-white/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                    {t('viewMore')} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMATITZACIÓ
// ═══════════════════════════════════════════════════════════════════════════

const THEMES = [
  {
    id: 'mon-magic',
    emoji: '🪄',
    titleKey: 'monMagic.title',
    subtitleKey: 'monMagic.subtitle',
    descriptionKey: 'monMagic.description',
    image: '/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg',
    href: '/tematica-mon-magic',
    gradient: 'from-purple-600 to-blue-600',
  },
  {
    id: 'halloween',
    emoji: '🎃',
    titleKey: 'halloween.title',
    subtitleKey: 'halloween.subtitle',
    descriptionKey: 'halloween.description',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    href: '/tematica-halloween',
    gradient: 'from-orange-600 to-red-600',
  },
];

async function ThemesSection() {
  const t = await getTranslations('tematitzacio');

  return (
    <section className="py-20 bg-gradient-to-b from-black to-purple-950/20" id="tematitzacio">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 mb-4 bg-purple-500/10 text-purple-400 text-sm font-medium rounded-full border border-purple-500/20">
            ✨ {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{t('titleSuffix')}</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {THEMES.map((theme) => (
            <Link
              key={theme.id}
              href={theme.href}
              className="group relative block h-80 rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all"
            >
              <Image
                src={theme.image}
                alt={t(theme.titleKey)}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-4xl mb-2 block">{theme.emoji}</span>
                <h3 className="text-2xl font-black text-white mb-1">{t(theme.titleKey)}</h3>
                <p className="text-white/70 text-sm mb-2">{t(theme.subtitleKey)}</p>
                <p className="text-white/50 text-sm">{t(theme.descriptionKey)}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white text-sm group-hover:bg-white/20 transition-colors">
                  {t('cta')} <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center mt-8 text-white/40 text-sm">
          {t('custom')} <span className="text-purple-400">{t('customAny')}</span> {t('customSuffix')}
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPAL - LA MILLOR DEL PLANETA! 🔥
// ═══════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <ClientOnly>
      <HomeWrapper>
        <main className="min-h-screen bg-black">
          {/* 🔥 HERO - Stats i disponibilitat REALS de BD */}
          <HeroBrutalReal />

          {/* 🔥 NOTIFICACIONS EN VIU - "Joan acaba de reservar..." */}
          <LiveNotifications />

          {/* Serveis principals */}
          <ServicesSection />

          {/* 🔥 URGÈNCIA - Disponibilitat REAL */}
          <UrgencyBannerReal />

          {/* Tematització */}
          <ThemesSection />

          {/* Transformació - Abans vs Després */}
          <TransformationSection />

          {/* Per què nosaltres */}
          <WhyUsBrutal />

          {/* Garanties */}
          <GuaranteeSection />

          {/* 🔥 TESTIMONIALS - Opinions REALS de BD */}
          <TestimonialsBrutalReal />

          {/* 🔥 STATS - Números REALS */}
          <StatsSectionReal />

          {/* CTA Final */}
          <CTASectionBrutal />
        </main>
      </HomeWrapper>
    </ClientOnly>
  );
}

