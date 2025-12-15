// app/components/layout/LayoutWrapper.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - LAYOUT WRAPPER v3.1 - FIX HYDRATION
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';

// Components dinàmics (lazy loading + ssr: false per evitar hydration issues)
const Header = dynamic(
  () => import('@/app/components/ui/HeaderUltra'),
  { ssr: false, loading: () => <div className="h-16 bg-zinc-950" /> }
);

const BottomNav = dynamic(
  () => import('@/app/components/ui/BottomNav'),
  { ssr: false }
);

const FloatingContactButtons = dynamic(
  () => import('@/app/components/ui/FloatingContactButtons'),
  { ssr: false }
);

const CookieConsent = dynamic(
  () => import('@/app/components/legal/CookieConsent.client'),
  { ssr: false }
);

const HeroPortalLogo = dynamic(
  () => import('@/app/components/ui/HeroPortalLogo'),
  { ssr: false }
);

const FlashOffer = dynamic(
  () => import('@/app/components/marketing/FlashOffer'),
  { ssr: false }
);

const Footer = dynamic(
  () => import('@/app/components/ui/footer'),
  { ssr: false }
);

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// Pàgines immersives sense header/footer
const IMMERSIVE_PAGES = ['/sensorial'];

// Pàgines on mostrar la intro
const INTRO_PAGES = ['/', '/ca', '/es'];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Gestionar intro animada
  useEffect(() => {
    if (!isMounted) return;

    const isHomePage = INTRO_PAGES.some(page => pathname === page);
    const hasSeenIntro = sessionStorage.getItem('orbita-intro-seen');

    if (isHomePage && !hasSeenIntro) {
      setShowIntro(true);
    }
  }, [pathname, isMounted]);

  // Handler per quan acaba la intro
  const handleIntroFinish = useCallback(() => {
    setShowIntro(false);
    sessionStorage.setItem('orbita-intro-seen', 'true');
  }, []);

  // Comprovar si és pàgina immersiva
  const isImmersive = IMMERSIVE_PAGES.some(page => pathname?.includes(page));

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Pàgina immersiva (sense header/footer)
  // ─────────────────────────────────────────────────────────────────────────
  if (isImmersive) {
    return <>{children}</>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Pàgina normal
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Intro animada (només home, primer cop) */}
      {showIntro && isMounted && (
        <HeroPortalLogo
          onFinish={handleIntroFinish}
          totalMs={5000}
          fadeMs={2000}
        />
      )}

      {/* Flash Offer banner */}
      <FlashOffer />

      {/* Header unificat (desktop + mòbil) - dynamic amb ssr:false */}
      <Header />

      {/* Contingut principal */}
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen outline-none"
      >
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Botons flotants de contacte */}
      <FloatingContactButtons />

      {/* Navegació inferior mòbil */}
      <BottomNav />

      {/* Consentiment cookies */}
      <CookieConsent />
    </>
  );
}
