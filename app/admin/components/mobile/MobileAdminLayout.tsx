'use client';

/**
 * MobileAdminLayout.tsx
 *
 * Layout wrapper para el admin móvil de Òrbita Events
 * - Detección de dispositivo móvil
 * - Safe area handling
 * - Tema oscuro optimizado
 * - Animaciones de transición entre páginas
 * - Status bar handling
 */

import { useEffect, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import BottomNavPro from './BottomNavPro';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface MobileAdminLayoutProps {
  children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS (with SSR-safe defaults)
// ═══════════════════════════════════════════════════════════════════════════

function useIsMobile() {
  // Start with null to indicate "not yet determined" (SSR safe)
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

function useStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  return isStandalone;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

// Status bar para PWA
function PWAStatusBar() {
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] bg-stone-100"
      style={{ height: 'env(safe-area-inset-top, 0px)' }}
    />
  );
}

// Splash screen
function SplashScreen({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[200] bg-stone-100 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo */}
          <motion.div
            className="text-6xl mb-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            🎧
          </motion.div>

          {/* Brand */}
          <motion.h1
            className="text-2xl font-bold text-slate-800 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Òrbita Events
          </motion.h1>

          <motion.p
            className="text-slate-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Admin Panel
          </motion.p>

          {/* Loading spinner */}
          <motion.div
            className="mt-8 w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Offline indicator (only renders after mount)
function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState<boolean | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Only check after mount
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything until mounted
  if (isOffline === null) return null;

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          className="fixed top-safe left-4 right-4 z-[60] bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-center text-sm font-medium"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          style={{ top: 'max(16px, env(safe-area-inset-top))' }}
        >
          Sense connexió a Internet
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Page transition wrapper
function PageTransition({ children, pathname }: { children: ReactNode; pathname: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ESTILOS GLOBALES (se pueden añadir al globals.css)
// ═══════════════════════════════════════════════════════════════════════════

const globalMobileStyles = `
  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Safe area utilities */
  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
  .top-safe {
    top: env(safe-area-inset-top);
  }
  .bottom-safe {
    bottom: env(safe-area-inset-bottom);
  }

  /* Active scale for touch */
  .active\\:scale-98:active {
    transform: scale(0.98);
  }
  .active\\:scale-95:active {
    transform: scale(0.95);
  }

  /* Disable text selection on touch */
  .select-none-touch {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  /* Smooth scroll */
  .scroll-smooth {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  /* Prevent pull-to-refresh on Chrome mobile */
  body.mobile-admin {
    overscroll-behavior-y: contain;
  }

  /* Input styles for mobile */
  input, textarea, select {
    font-size: 16px !important; /* Prevent zoom on iOS */
  }

  /* Tap highlight removal */
  * {
    -webkit-tap-highlight-color: transparent;
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileAdminLayout({ children }: MobileAdminLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isStandalone = useStandalone();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initial load
  useEffect(() => {
    if (!isMounted) return;

    // Add mobile class to body
    document.body.classList.add('mobile-admin');

    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      document.body.classList.remove('mobile-admin');
      clearTimeout(timer);
    };
  }, [isMounted]);

  // Inject global styles
  useEffect(() => {
    if (!isMounted) return;

    const styleId = 'mobile-admin-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = globalMobileStyles;
      document.head.appendChild(style);
    }
  }, [isMounted]);

  // During SSR and initial hydration, render children directly
  // This ensures consistent rendering between server and client
  // All mobile-specific features are added after hydration is complete
  if (!isMounted) {
    return <>{children}</>;
  }

  // On desktop (after mount), just render children
  if (isMobile === false) {
    return <>{children}</>;
  }

  // On mobile (after mount and detection), render the full mobile layout
  // This only happens AFTER hydration is complete, so it won't cause mismatches
  if (isMobile === true) {
    return (
      <>
        {/* Splash screen */}
        <SplashScreen isLoading={isLoading} />

        {/* PWA status bar */}
        {isStandalone && <PWAStatusBar />}

        {/* Offline indicator */}
        <OfflineIndicator />

        {/* Main content */}
        <main
          className="min-h-screen bg-stone-100"
          style={{
            paddingTop: isStandalone ? 'env(safe-area-inset-top)' : '0',
          }}
        >
          <PageTransition pathname={pathname}>
            {children}
          </PageTransition>
        </main>

        {/* Bottom navigation */}
        <BottomNavPro />
      </>
    );
  }

  // While isMobile is being determined (null), just render children
  return <>{children}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTACIONES ADICIONALES
// ═══════════════════════════════════════════════════════════════════════════

export { useIsMobile, useStandalone };
