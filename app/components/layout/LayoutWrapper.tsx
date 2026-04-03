// app/components/layout/LayoutWrapper.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - LAYOUT WRAPPER v3.1 - FIX HYDRATION
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import HeroPortalLogo from '@/app/components/ui/HeroPortalLogo';
import { trackPageView } from '@/app/lib/analytics';
import { APP_IMMERSIVE_PAGES } from '@/lib/constants';
import { getClientIntroMode, hasSeenMobileIntro, isIntroPage, markMobileIntroSeen, MOBILE_INTRO_COMPLETE_EVENT, MOBILE_INTRO_STORAGE_KEY, type IntroMode } from '@/lib/intro';

// Components dinàmics (lazy loading + ssr: false per evitar hydration issues)
const Header = dynamic(
  () => import('@/app/components/ui/HeaderChampion'),
  { loading: () => <div className="h-16 bg-zinc-950" /> }
);


const MobileBottomNav = dynamic(
  () => import('@/app/components/mobile-ultimate/MobileBottomNav'),
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

const Footer = dynamic(
  () => import('@/app/components/ui/footer')
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(false);
  const [hideHeaderOnMobileIntro, setHideHeaderOnMobileIntro] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [activeIntroMode, setActiveIntroMode] = useState<IntroMode>('none');

  // Funció per treure l'overlay negre
  const removeOverlay = useCallback(() => {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      window.setTimeout(() => {
        if (!overlay.isConnected) return;
        overlay.style.display = 'none';
      }, 400);
    }
    document.documentElement.style.overflow = '';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = '';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = 'relative';
    document.documentElement.classList.add('scroll-unlocked');
    document.body.classList.add('scroll-unlocked');
    document.body.classList.remove('hero-loading');
    document.body.classList.add('intro-done');
    document.documentElement.dataset.orbitaIntroMode = 'none';
  }, []);

  // Gestiona la intro usando la misma decision que se calcula en el bootstrap inicial.
  useEffect(() => {
    const introMode = getClientIntroMode({
      pathname,
      search: window.location.search,
      isMobileViewport: window.innerWidth < 1024,
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      userAgent: window.navigator.userAgent,
      hasSeenDesktopIntro: sessionStorage.getItem('orbita-intro-seen'),
      hasSeenMobileIntro: hasSeenMobileIntro(localStorage),
    });

    document.documentElement.dataset.orbitaIntroMode = introMode;

    if (introMode === 'none') {
      setShowIntro(false);
      setHideHeaderOnMobileIntro(false);
      setActiveIntroMode('none');
      removeOverlay();
      return;
    }

    const failsafeId = window.setTimeout(() => {
      const overlay = document.getElementById('intro-overlay');
      if (overlay && overlay.style.display !== 'none') {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        window.setTimeout(() => {
          overlay.style.display = 'none';
        }, 400);
      }
      document.body.classList.remove('hero-loading');
      document.body.style.overflow = '';
      document.body.classList.add('intro-done');
      document.documentElement.dataset.orbitaIntroMode = 'none';
    }, 6000);

    setActiveIntroMode(introMode);
    setHideHeaderOnMobileIntro(introMode === 'mobile');
    setShowIntro(true);
    document.body.classList.add('hero-loading');

    return () => window.clearTimeout(failsafeId);
  }, [pathname, removeOverlay]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobile = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobileViewport(event.matches);
    };
    updateMobile(mediaQuery);
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = '';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = '';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    document.body.style.position = '';
    document.documentElement.classList.add('scroll-unlocked');
    document.body.classList.add('scroll-unlocked');
    if (!showIntro) {
      document.body.classList.remove('hero-loading');
      document.body.classList.add('intro-done');
    }
  }, [showIntro]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('orbita_cookie_consent');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { analytics?: boolean };
      if (!parsed.analytics) return;
      trackPageView(window.location.pathname, document.title);
    } catch {
      // Ignore malformed consent values.
    }
  }, [pathname]);

  useEffect(() => {
    const isHomePage = isIntroPage(pathname);
    if (!isHomePage) {
      setHideHeaderOnMobileIntro(false);
      return;
    }

    const isMobileViewport = window.innerWidth < 1024;
    if (!isMobileViewport) {
      setHideHeaderOnMobileIntro(false);
      return;
    }

    if (hasSeenMobileIntro(localStorage) && activeIntroMode !== 'mobile') {
      setHideHeaderOnMobileIntro(false);
      return;
    }

    setHideHeaderOnMobileIntro(true);

    // Use storage event listener instead of polling for better performance
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MOBILE_INTRO_STORAGE_KEY && e.newValue) {
        setHideHeaderOnMobileIntro(false);
      }
    };

    // Also listen for custom event from same window (storage events only fire cross-window)
    const handleIntroComplete = () => {
      setHideHeaderOnMobileIntro(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(MOBILE_INTRO_COMPLETE_EVENT, handleIntroComplete);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(MOBILE_INTRO_COMPLETE_EVENT, handleIntroComplete);
    };
  }, [pathname]);

  // Handler per quan acaba la intro
  const handleIntroFinish = useCallback(() => {
    setShowIntro(false);
    setHideHeaderOnMobileIntro(false);
    if (activeIntroMode === 'mobile') {
      markMobileIntroSeen(localStorage, window);
    } else if (activeIntroMode === 'desktop') {
      sessionStorage.setItem('orbita-intro-seen', 'true');
    }
    setActiveIntroMode('none');
    document.documentElement.dataset.orbitaIntroMode = 'none';
    removeOverlay();
  }, [activeIntroMode, removeOverlay]);

  // Comprovar si és pàgina immersiva
  const isImmersive = APP_IMMERSIVE_PAGES.some(page => pathname?.includes(page));
  const isIntroActive = showIntro || hideHeaderOnMobileIntro;
  const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const hideMobileChrome = isMobileViewport && (
    pathWithoutLocale.startsWith('/configurador') ||
    pathWithoutLocale.startsWith('/contacto') ||
    pathWithoutLocale.startsWith('/reservar')
  );
  const needsMobileBottomOffset = !isIntroActive && !hideMobileChrome && isMobileViewport;

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
      {/* Intro animada (home) */}
      {showIntro && (
        <HeroPortalLogo
          onFinish={handleIntroFinish}
          totalMs={activeIntroMode === 'mobile' ? 2200 : 4000}
          fadeMs={activeIntroMode === 'mobile' ? 550 : 2200}
          speedMultiplier={activeIntroMode === 'mobile' ? 1.05 : 1.2}
          holdMs={activeIntroMode === 'mobile' ? 250 : 1000}
        />
      )}

      {/* Header unificat (desktop + mòbil) - dynamic amb ssr:false */}
      {!isIntroActive && <Header />}

      {/* Contingut principal */}
      <main
        id="main-content"
        tabIndex={-1}
        className={`min-h-screen outline-none ${needsMobileBottomOffset ? 'pb-28' : ''}`}
      >
        {children}
      </main>

      {/* Footer */}
      {!isIntroActive && !hideMobileChrome && <Footer />}

      {/* Bottom Navigation */}
      {!isIntroActive && !hideMobileChrome && isMobileViewport && <MobileBottomNav />}

      {/* FloatingCTAs - WhatsApp desktop + Bottom bar mòbil (FIX SOLAPAMENT) */}
      {!isIntroActive && (!isMobileViewport || !hideMobileChrome) && <FloatingCTAs />}

      {/* Consentiment cookies */}
      {!isIntroActive && <CookieConsent />}

    </>
  );
}













