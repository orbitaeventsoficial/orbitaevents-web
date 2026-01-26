'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE APP SHELL - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Contenedor principal que envuelve toda la experiencia móvil.
 * Features:
 * - PWA detection y safe areas
 * - Pull to refresh
 * - Page transitions
 * - Offline detection
 * - Haptic feedback system
 * - Scroll-driven header
 * - Bottom navigation
 * 
 * FIXED:
 * - Añadido locale support para rutas
 * - Mejorado scroll handling
 */

import { useState, useEffect, useRef, createContext, useContext, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence, useTransform, useMotionValue } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { log } from '@/lib/logger';
import { WHATSAPP_URL } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT - Estado global del móvil
// ═══════════════════════════════════════════════════════════════════════════

interface MobileContextType {
  isPWA: boolean;
  isOnline: boolean;
  haptic: (type: 'light' | 'medium' | 'heavy') => void;
  scrollY: number;
  isHeaderVisible: boolean;
  locale: string;
  scrollToSection: (sectionId: string) => void;
}

const MobileContext = createContext<MobileContextType>({
  isPWA: false,
  isOnline: true,
  haptic: () => {},
  scrollY: 0,
  isHeaderVisible: true,
  locale: 'ca',
  scrollToSection: () => {},
});

export const useMobile = () => useContext(MobileContext);

// ═══════════════════════════════════════════════════════════════════════════
// HAPTIC FEEDBACK
// ═══════════════════════════════════════════════════════════════════════════

const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
  if (typeof window === 'undefined') return;
  
  // iOS Haptic
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 25,
      heavy: 50,
    };
    navigator.vibrate(patterns[type]);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING HEADER - Aparece al hacer scroll up
// ═══════════════════════════════════════════════════════════════════════════

function FloatingHeader({ 
  isVisible, 
  scrollProgress,
  locale,
}: { 
  isVisible: boolean; 
  scrollProgress: number;
  locale: string;
}) {
  const t = useTranslations('common');
  
  return (
    <AnimatePresence>
      {isVisible && scrollProgress > 0.1 && (
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 safe-top"
        >
          <div className="mx-3 mt-2 px-4 py-3 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <a href={`/${locale}`} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-black font-black text-sm">Ò</span>
                </div>
                <span className="text-white font-semibold text-sm">Òrbita</span>
              </a>
              
              {/* Quick CTA */}
              <motion.a
                href={WHATSAPP_URL}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              >
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-black font-bold text-sm">{t('buttons.whatsapp')}</span>
              </motion.a>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PULL TO REFRESH
// ═══════════════════════════════════════════════════════════════════════════

function PullToRefresh({ 
  children, 
  onRefresh 
}: { 
  children: ReactNode; 
  onRefresh: () => Promise<void>;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const pullProgress = useTransform(pullY, [0, 100], [0, 1]);
  
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      triggerHaptic('medium');
      await onRefresh();
    } catch (error) {
      log.error('Refresh error', error);
    } finally {
      setIsRefreshing(false);
      pullY.set(0);
    }
  };

  return (
    <div className="relative">
      {/* Pull indicator */}
      <motion.div
        style={{ y: pullY, opacity: pullProgress }}
        className="absolute top-0 left-0 right-0 flex justify-center py-4 pointer-events-none z-40"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
          className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.div>
      </motion.div>
      
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OFFLINE BANNER
// ═══════════════════════════════════════════════════════════════════════════

function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  const t = useTranslations('common');
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] safe-top"
        >
          <div className="bg-red-500 text-white text-center py-2 text-sm font-medium">
            📡 {t('offline') || 'Sense connexió · Algunes funcions no disponibles'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center"
    >
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="relative"
      >
        {/* Glow */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 w-24 h-24 rounded-full bg-amber-500 blur-2xl"
        />
        
        {/* Logo */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-black font-black text-4xl"
          >
            Ò
          </motion.span>
        </div>
      </motion.div>
      
      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <h1 className="text-2xl font-bold text-white">Òrbita Events</h1>
        <p className="text-white/50 text-sm mt-1">Events temàtics únics</p>
      </motion.div>
      
      {/* Loading bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '60%' }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        className="absolute bottom-20 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface MobileAppShellProps {
  children: ReactNode;
  showSplash?: boolean;
}

export default function MobileAppShell({ 
  children, 
  showSplash = true 
}: MobileAppShellProps) {
  const locale = useLocale();
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSplashScreen, setShowSplashScreen] = useState(showSplash);
  const [scrollY, setScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number | null>(null);

  useEffect(() => {
    document.body.classList.add('mobile-experience-active');
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyHeight = document.body.style.height;
    const previousHtmlHeight = document.documentElement.style.height;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100dvh';
    document.documentElement.style.height = '100dvh';

    return () => {
      document.body.classList.remove('mobile-experience-active');
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.height = previousBodyHeight;
      document.documentElement.style.height = previousHtmlHeight;
    };
  }, []);
  
  // Scroll to section helper
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && containerRef.current) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offsetTop = containerRef.current.scrollTop + (elementTop - containerTop);
      containerRef.current.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }, []);

  // Detectar PWA
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsPWA(isStandalone || isIOSStandalone);
  }, []);

  // Detectar conexión
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Scroll handling para header
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRaf.current !== null) return;
      scrollRaf.current = window.requestAnimationFrame(() => {
        const currentScrollY = containerRef.current?.scrollTop || 0;
        setScrollY(currentScrollY);

        // Mostrar header al hacer scroll up, ocultar al scroll down
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsHeaderVisible(false);
        } else {
          setIsHeaderVisible(true);
        }

        lastScrollY.current = currentScrollY;
        scrollRaf.current = null;
      });
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container?.removeEventListener('scroll', handleScroll);
      if (scrollRaf.current !== null) {
        window.cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
    };
  }, []);

  // Configurar viewport per a safe areas (sense bloquejar zoom per accessibilitat)
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      // Mantenim viewport-fit=cover per safe areas però permetem zoom per accessibilitat
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
    }
  }, []);

  // Context value
  const contextValue: MobileContextType = {
    isPWA,
    isOnline,
    haptic: triggerHaptic,
    scrollY,
    isHeaderVisible,
    locale,
    scrollToSection,
  };

  const handleRefresh = async () => {
    try {
      // Simular refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.reload();
    } catch (error) {
      log.error('Page refresh error', error);
    }
  };

  return (
    <MobileContext.Provider value={contextValue}>
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplashScreen && (
          <SplashScreen onComplete={() => setShowSplashScreen(false)} />
        )}
      </AnimatePresence>

      {/* Offline Banner */}
      <OfflineBanner isOnline={isOnline} />

      {/* Floating Header */}
      <FloatingHeader
        isVisible={isHeaderVisible}
        scrollProgress={scrollY / 100}
        locale={locale}
      />

      {/* Main Content */}
      <div
        ref={containerRef}
        className={`
          h-[100dvh] w-full overflow-x-hidden overflow-y-auto
          bg-zinc-950 text-white
          safe-top safe-bottom
        `}
        style={{
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <PullToRefresh onRefresh={handleRefresh}>
          {children}
        </PullToRefresh>
      </div>

      {/* Note: Global styles moved to globals.css for better caching and deduplication */}
    </MobileContext.Provider>
  );
}
