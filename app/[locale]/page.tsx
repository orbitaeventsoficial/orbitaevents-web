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
const GarantiaSection = dynamic(() => import('@/app/components/marketing/GarantiaSection'), {
  ssr: false,
});
const CTAFinal = dynamic(() => import('@/app/components/marketing/CTAFinal'), {
  ssr: false,
});
const HomePageWrapper = dynamic(() => import('@/app/components/HomePageWrapper'), {
  loading: () => <HeroSkeleton />,
});

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
    alternates: { canonical: `/${locale}` },
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
        <HeroElegant />

        {/* 2. SERVEIS - Grid elegant 4 cards */}
        <ServicesGridElegant />

        {/* 3. CALENDARIO - Urgència subtil */}
        <section className="py-6 md:py-10 bg-[#0A0A0A]">
          <div className="container mx-auto px-6">
            <CalendarioUrgencia />
          </div>
        </section>

        {/* 4. RESEÑAS GOOGLE - Prova social */}
        <GoogleReviewsRotating />

        {/* 5. LOGOS CLIENTES - Confían en nosotros */}
        <TrustedByLogos />

        {/* 6. GARANTÍA - Confiança */}
        <GarantiaSection />

        {/* 6. CTA FINAL - Conversió */}
        <CTAFinal />
      </main>
    </HomePageWrapper>
  );
}
