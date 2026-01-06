// app/[locale]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - ELEGANT EDITION v2.0 + MOBILE ULTIMATE
// ═══════════════════════════════════════════════════════════════════════════

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

// ELEGANT Components - Nova versió sofisticada (Desktop)
import HeroElegant from '@/app/components/ui/HeroElegant';
import ServicesGridElegant from '@/app/components/ui/ServicesGridElegant';
import TestimoniosReales from '@/app/components/home/TestimoniosReales';
import GarantiaSection from '@/app/components/marketing/GarantiaSection';
import CTAFinal from '@/app/components/marketing/CTAFinal';
import CalendarioUrgencia from '@/app/components/ui/CalendarioUrgencia';

// Mobile/Desktop Detection Wrapper
import HomePageWrapper from '@/app/components/HomePageWrapper';

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
      images: [{ url: '/og-home.jpg', width: 1200, height: 630, alt: 'Òrbita Events' }],
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
        <section className="py-20 bg-[#0A0A0A]">
          <div className="container mx-auto px-6">
            <CalendarioUrgencia />
          </div>
        </section>

        {/* 4. TESTIMONIOS - Prova social */}
        <TestimoniosReales />

        {/* 5. GARANTÍA - Confiança */}
        <GarantiaSection />

        {/* 6. CTA FINAL - Conversió */}
        <CTAFinal />
      </main>
    </HomePageWrapper>
  );
}
