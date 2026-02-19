'use client';

/**
 * PWAProvider.tsx
 *
 * Gestiona:
 * - Registro del Service Worker
 * - Prompt de instalación PWA
 * - Detección de modo standalone
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { log } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  installApp: () => Promise<void>;
  dismissInstallPrompt: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  isStandalone: false,
  canInstall: false,
  installApp: async () => {},
  dismissInstallPrompt: () => {},
});

export const usePWA = () => useContext(PWAContext);

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Registrar Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Solo registrar en producción
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          log.debug('PWA Service Worker registered', { scope: registration.scope });

          // Escuchar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  log.info('PWA new version available');
                }
              });
            }
          });
        })
        .catch((error) => {
          log.error('PWA Service Worker registration failed', error);
        });
    }
  }, []);

  // Detectar modo standalone
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);
    setIsInstalled(isStandaloneMode);
  }, []);

  // Capturar evento de instalación
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);

      // Mostrar banner después de 30 segundos
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowInstallBanner(true);
        }, 30000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      log.info('PWA app installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Instalar app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        log.debug('PWA install accepted');
      } else {
        log.debug('PWA install dismissed');
      }

      setDeferredPrompt(null);
    } catch (error) {
      log.error('PWA install prompt error', error);
    }
    setCanInstall(false);
    setShowInstallBanner(false);
  }, [deferredPrompt]);

  // Descartar banner
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isStandalone,
        canInstall,
        installApp,
        dismissInstallPrompt,
      }}
    >
      {children}

      {/* Install Banner */}
      <PWAInstallBanner
        showInstallBanner={showInstallBanner}
        canInstall={canInstall}
        installApp={installApp}
        dismissInstallPrompt={dismissInstallPrompt}
      />
    </PWAContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL BANNER (i18n)
// ═══════════════════════════════════════════════════════════════════════════

function PWAInstallBanner({
  showInstallBanner,
  canInstall,
  installApp,
  dismissInstallPrompt,
}: {
  showInstallBanner: boolean;
  canInstall: boolean;
  installApp: () => Promise<void>;
  dismissInstallPrompt: () => void;
}) {
  const t = useTranslations('pwa');

  return (
    <AnimatePresence>
      {showInstallBanner && canInstall && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-24 left-4 right-4 z-50 lg:left-auto lg:right-6 lg:bottom-6 lg:max-w-sm"
        >
          <div className="bg-zinc-900 rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl flex-shrink-0">
                📱
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1">{t('installTitle')}</h3>
                <p className="text-white/60 text-sm mb-3">
                  {t('installDescription')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={installApp}
                    className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-xl text-sm active:scale-95 transition-transform"
                  >
                    {t('install')}
                  </button>
                  <button
                    onClick={dismissInstallPrompt}
                    className="px-4 py-2 bg-white/10 text-white/70 rounded-xl text-sm active:scale-95 transition-transform"
                  >
                    {t('notNow')}
                  </button>
                </div>
              </div>
              <button
                onClick={dismissInstallPrompt}
                aria-label={t('notNow')}
                className="text-white/60 hover:text-white/60"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PWAInstallButton({ className = '' }: { className?: string }) {
  const { canInstall, installApp, isInstalled } = usePWA();
  const t = useTranslations('pwa');

  if (isInstalled || !canInstall) return null;

  return (
    <button
      onClick={installApp}
      className={`flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-semibold rounded-xl active:scale-95 transition-transform ${className}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {t('installApp')}
    </button>
  );
}
