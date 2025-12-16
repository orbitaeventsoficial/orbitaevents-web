// app/[locale]/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - MEGA PACK v1.0
// ═══════════════════════════════════════════════════════════════════════════

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';

// MEGA PACK Components
import HeroVideo from '@/app/components/home/HeroVideo';
import ServiciosGrid from '@/app/components/home/ServiciosGrid';
import TestimoniosReales from '@/app/components/home/TestimoniosReales';
import GarantiaSection from '@/app/components/marketing/GarantiaSection';
import CTAFinal from '@/app/components/marketing/CTAFinal';
import CalendarioUrgencia from '@/app/components/ui/CalendarioUrgencia';

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
// PAGE PRINCIPAL - MEGA PACK
// ═══════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* 1. HERO - Impacto visual con video */}
      <HeroVideo />

      {/* 2. SERVICIOS - Grid de servicios */}
      <ServiciosGrid />

      {/* 3. CALENDARIO - Urgencia/FOMO */}
      <section className="py-16 bg-zinc-950">
        <div className="container mx-auto px-4">
          <CalendarioUrgencia />
        </div>
      </section>

      {/* 4. TESTIMONIOS - Prueba social */}
      <TestimoniosReales />

      {/* 5. GARANTÍA - Confianza */}
      <GarantiaSection />

      {/* 6. CTA FINAL - Conversión */}
      <CTAFinal />
    </main>
  );
}
