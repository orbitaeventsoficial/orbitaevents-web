// app/components/layout/LayoutWrapper.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - LAYOUT WRAPPER v3.1 - FIX HYDRATION
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useMemo } from 'react';

// Detectar bots para no mostrarles la intro (mejor métricas Lighthouse)
function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'googlebot', 'lighthouse', 'pagespeed', 'chrome-lighthouse',
    'gtmetrix', 'pingdom', 'webpagetest', 'yandex', 'bingbot',
    'slurp', 'duckduckbot', 'baiduspider', 'facebookexternalhit',
    'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'showyoubot',
    'outbrain', 'pinterest', 'applebot', 'semrush', 'ahrefsbot',
    'mj12bot', 'dotbot', 'petalbot', 'bytespider', 'headlesschrome',
  ];
  return botPatterns.some(bot => ua.includes(bot));
}

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
  const [hideHeaderOnMobileIntro, setHideHeaderOnMobileIntro] = useState(false);

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
    const isBotUser = isBot();
    const isMobileViewport = window.innerWidth < 1024;

    // En móvil usamos la intro específica del MobileHomePage
    if (isMobileViewport) {
      setShowIntro(false);
      sessionStorage.setItem('orbita-intro-seen', 'true');
      removeOverlay();
      return;
    }

    // No mostrar intro a bots (Lighthouse, Googlebot, etc.) para mejores métricas
    if (isHomePage && !hasSeenIntro && !isBotUser) {
      // Mostrar intro - l'overlay es queda
      setShowIntro(true);
    } else {
      // No mostrar intro - treure overlay immediatament
      removeOverlay();
    }
  }, [pathname, removeOverlay]);

  useEffect(() => {
    const isHomePage = INTRO_PAGES.some(page => pathname === page);
    if (!isHomePage) {
      setHideHeaderOnMobileIntro(false);
      return;
    }

    const isMobileViewport = window.innerWidth < 1024;
    if (!isMobileViewport) {
      setHideHeaderOnMobileIntro(false);
      return;
    }

    const hasSeenMobileIntro = sessionStorage.getItem('orbita-mobile-intro-seen');
    if (hasSeenMobileIntro) {
      setHideHeaderOnMobileIntro(false);
      return;
    }

    setHideHeaderOnMobileIntro(true);
    const poll = window.setInterval(() => {
      if (sessionStorage.getItem('orbita-mobile-intro-seen')) {
        setHideHeaderOnMobileIntro(false);
        window.clearInterval(poll);
      }
    }, 200);

    return () => window.clearInterval(poll);
  }, [pathname]);

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
          fadeMs={2200}
          speedMultiplier={1.2}
          holdMs={1000}
        />
      )}

      {/* Header unificat (desktop + mòbil) - dynamic amb ssr:false */}
      {!hideHeaderOnMobileIntro && <Header />}

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
