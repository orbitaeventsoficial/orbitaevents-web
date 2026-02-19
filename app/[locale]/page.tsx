// app/[locale]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - ELEGANT EDITION v2.0 + MOBILE ULTIMATE
// ═══════════════════════════════════════════════════════════════════════════
// OPTIMIZADO: SSR habilitado para above-the-fold, lazy loading below-the-fold

import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON COMPONENTS - Para loading states rápidos
// ═══════════════════════════════════════════════════════════════════════════

function HeroSkeleton() {
  const t = useTranslations('homePage');

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/60 to-[#0A0A0A]" />
      <div className="relative z-10 container mx-auto px-5 py-24 md:py-32 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-500 text-lg">✨</span>
            <span className="text-amber-400 text-sm font-medium">{t('skeleton.badge')}</span>
          </div>
          <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl lg:text-7xl font-black text-white mb-3 tracking-tight">
            {t('skeleton.titleLine1')}
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              {t('skeleton.titleHighlight')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-6 max-w-xl mx-auto">
            {t('skeleton.description')}
          </p>
        </div>
      </div>
    </section>
  );
}

function SectionSkeleton() {
  return <div className="py-16 bg-[#0A0A0A] animate-pulse" />;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS - Above-the-fold con SSR, below-the-fold lazy loaded
// ═══════════════════════════════════════════════════════════════════════════

// Above-the-fold: SSR habilitado con loading skeleton
const HeroElegant = dynamic(() => import('@/app/components/ui/HeroElegant'), {
  loading: () => <HeroSkeleton />,
});

// Below-the-fold: Lazy loaded sin SSR para mejor performance
const ServicesGridElegant = dynamic(() => import('@/app/components/ui/ServicesGridElegant'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const CalendarioUrgencia = dynamic(() => import('@/app/components/ui/CalendarioUrgencia'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const GoogleReviewsRotating = dynamic(() => import('@/app/components/home/GoogleReviewsRotating'), {
  ssr: false,
});
const TrustedByLogos = dynamic(() => import('@/app/components/marketing/TrustedByLogos'), {
  ssr: false,
});
const StatsSection = dynamic(() => import('@/app/components/marketing/StatsSection'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const ProcessSection = dynamic(() => import('@/app/components/marketing/ProcessSection'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const PortfolioShowcase = dynamic(() => import('@/app/components/marketing/PortfolioShowcase'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const GarantiaSection = dynamic(() => import('@/app/components/marketing/GarantiaSection'), {
  ssr: false,
});
const CTAFinal = dynamic(() => import('@/app/components/marketing/CTAFinal'), {
  ssr: false,
});
const FAQSection = dynamic(() => import('@/app/components/home/FAQSection'), {
  ssr: false,
  loading: () => <SectionSkeleton />,
});
const HomePageWrapper = dynamic(() => import('@/app/components/HomePageWrapper'), {
  loading: () => <HeroSkeleton />,
});
const HomepageScrollTracker = dynamic(
  () => import('@/app/components/analytics/HomepageScrollTracker'),
  { ssr: false },
);

export const revalidate = 3600;

// ═══════════════════════════════════════════════════════════════════════════
// METADATA DINÀMICA
// ═══════════════════════════════════════════════════════════════════════════

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'homePage' });

  const base = 'https://orbitaevents.com';
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: locale === 'ca' ? base : `${base}/${locale}`,
      languages: {
        'ca': base,
        'es': `${base}/es`,
        'en': `${base}/en`,
        'x-default': base,
      },
    },
    openGraph: {
      title: t('meta.ogTitle'),
      description: t('meta.ogDescription'),
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Òrbita Events' }],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPAL - MEGA PACK
// ═══════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <HomePageWrapper>
      {/* Desktop: Contingut elegant */}
      <main className="min-h-screen bg-[#0A0A0A]">
        {/* 1. HERO ELEGANT - Sofisticat amb vídeo */}
        <div data-section-id="hero">
          <HeroElegant />
        </div>

        {/* 2. SERVEIS - Grid elegant 4 cards */}
        <div data-section-id="services">
          <ServicesGridElegant />
        </div>

        {/* 3. STATS - Per què triar Òrbita Events */}
        <div data-section-id="stats">
          <StatsSection />
        </div>

        {/* 4. CALENDARIO - Urgència subtil */}
        <section data-section-id="calendar" className="py-6 md:py-10 bg-[#0A0A0A]">
          <div className="container mx-auto px-6">
            <CalendarioUrgencia />
          </div>
        </section>

        {/* 5. PORTFOLIO - Fotos reals dels events */}
        <div data-section-id="portfolio">
          <PortfolioShowcase />
        </div>

        {/* 6. COM FUNCIONA - 3 passos */}
        <div data-section-id="process">
          <ProcessSection />
        </div>

        {/* 7. RESEÑAS GOOGLE - Prova social */}
        <div data-section-id="reviews">
          <GoogleReviewsRotating />
        </div>

        {/* 8. LOGOS CLIENTES - Confían en nosotros */}
        <div data-section-id="clients">
          <TrustedByLogos />
        </div>

        {/* 9. GARANTÍA - Confiança */}
        <div data-section-id="garantia">
          <GarantiaSection />
        </div>

        {/* 10. FAQ - Preguntes freqüents amb JSON-LD schema */}
        <div data-section-id="faq">
          <FAQSection />
        </div>

        {/* 11. CTA FINAL - Conversió */}
        <div data-section-id="cta">
          <CTAFinal />
        </div>
      </main>
      <HomepageScrollTracker />
    </HomePageWrapper>
  );
}
