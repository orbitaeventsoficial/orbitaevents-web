// app/[locale]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - ELEGANT EDITION v2.0 + MOBILE ULTIMATE
// ═══════════════════════════════════════════════════════════════════════════

import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';

// Components amb SSR desactivat per evitar errors d'hidratació
const HeroElegant = dynamic(() => import('@/app/components/ui/HeroElegant'), { ssr: false });
const ServicesGridElegant = dynamic(() => import('@/app/components/ui/ServicesGridElegant'), { ssr: false });
const CalendarioUrgencia = dynamic(() => import('@/app/components/ui/CalendarioUrgencia'), { ssr: false });
const GoogleReviewsRotating = dynamic(() => import('@/app/components/home/GoogleReviewsRotating'), { ssr: false });
const GarantiaSection = dynamic(() => import('@/app/components/marketing/GarantiaSection'), { ssr: false });
const CTAFinal = dynamic(() => import('@/app/components/marketing/CTAFinal'), { ssr: false });
const HomePageWrapper = dynamic(() => import('@/app/components/HomePageWrapper'), { ssr: false });

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
        <section className="py-6 md:py-10 bg-[#0A0A0A]">
          <div className="container mx-auto px-6">
            <CalendarioUrgencia />
          </div>
        </section>

        {/* 4. RESEÑAS GOOGLE - Prova social */}
        <GoogleReviewsRotating />

        {/* 5. GARANTÍA - Confiança */}
        <GarantiaSection />

        {/* 6. CTA FINAL - Conversió */}
        <CTAFinal />
      </main>
    </HomePageWrapper>
  );
}
