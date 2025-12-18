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
  () => import('@/app/components/ui/HeaderChampion'),
  { ssr: false, loading: () => <div className="h-16 bg-zinc-950" /> }
);

const BottomNav = dynamic(
  () => import('@/app/components/ui/BottomNav'),
  { ssr: false }
);

// FloatingCTAs - FIX SOLAPAMENT BOTONS (WhatsApp desktop + Bottom bar mòbil)
const FloatingCTAs = dynamic(
  () => import('@/app/components/ui/FloatingCTAs'),
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

const FlashOfferPopup = dynamic(
  () => import('@/app/components/ui/FlashOfferPopup'),
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

  // Funció per treure l'overlay negre
  const removeOverlay = useCallback(() => {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 400);
    }
    document.body.classList.add('intro-done');
  }, []);

  // Evitar hydration mismatch + gestionar intro
  useEffect(() => {
    setIsMounted(true);

    const isHomePage = INTRO_PAGES.some(page => pathname === page);
    const hasSeenIntro = sessionStorage.getItem('orbita-intro-seen');

    if (isHomePage && !hasSeenIntro) {
      // Mostrar intro - l'overlay es queda
      setShowIntro(true);
    } else {
      // No mostrar intro - treure overlay immediatament
      removeOverlay();
    }
  }, [pathname, removeOverlay]);

  // Handler per quan acaba la intro
  const handleIntroFinish = useCallback(() => {
    setShowIntro(false);
    sessionStorage.setItem('orbita-intro-seen', 'true');
    // Treure overlay amb fade
    removeOverlay();
  }, [removeOverlay]);

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
      {/* Intro animada (només home, primer cop) - 4s total */}
      {showIntro && isMounted && (
        <HeroPortalLogo
          onFinish={handleIntroFinish}
          totalMs={4000}
          fadeMs={1200}
          introHoldMs={300}
          introFadeMs={400}
          speedMultiplier={1.2}
        />
      )}

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

      {/* FloatingCTAs - WhatsApp desktop + Bottom bar mòbil (FIX SOLAPAMENT) */}
      <FloatingCTAs />

      {/* Consentiment cookies */}
      <CookieConsent />

      {/* Popup oferta flash */}
      <FlashOfferPopup />
    </>
  );
}
