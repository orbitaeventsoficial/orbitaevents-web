"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

const COOKIE_CONSENT_KEY = 'orbita_cookie_consent';

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export default function CookieConsent() {
  const t = useTranslations('footer.cookieConsent');
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  const notifyConsentUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('orbita-consent-update'));
    }
  };

  const triggerPageView = () => {
    if (typeof window === 'undefined') return;
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args) => {
        window.dataLayer?.push(args);
      };
    }
    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  };

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setShowBanner(true), 3500);
      return () => clearTimeout(timer);
    }

    try {
      const parsed = JSON.parse(stored) as {
        necessary?: boolean;
        analytics?: boolean;
        marketing?: boolean;
      };

      setPreferences({
        necessary: true,
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      });

      if (typeof window !== 'undefined') {
        if (!window.gtag) {
          window.dataLayer = window.dataLayer || [];
          window.gtag = (...args) => {
            window.dataLayer?.push(args);
          };
        }

        window.gtag('consent', 'update', {
          analytics_storage: parsed.analytics ? 'granted' : 'denied',
          ad_storage: parsed.marketing ? 'granted' : 'denied',
          ad_user_data: parsed.marketing ? 'granted' : 'denied',
          ad_personalization: parsed.marketing ? 'granted' : 'denied',
        });

        if (parsed.analytics) {
          window.gtagConsentUpdate?.();
          triggerPageView();
        }
      }
      notifyConsentUpdate();
    } catch {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      const timer = setTimeout(() => setShowBanner(true), 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setShowBanner(false);

    if (typeof window !== 'undefined') {
      if (!window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args) => {
          window.dataLayer?.push(args);
        };
      }

      window.gtagConsentUpdate?.();
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
      triggerPageView();
    }
    notifyConsentUpdate();
  };

  const acceptNecessary = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setShowBanner(false);

    if (typeof window !== 'undefined') {
      if (!window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args) => {
          window.dataLayer?.push(args);
        };
      }
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
    notifyConsentUpdate();
  };

  const savePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setShowBanner(false);
    setShowSettings(false);

    if (typeof window !== 'undefined') {
      if (!window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args) => {
          window.dataLayer?.push(args);
        };
      }

      // Dispara GA4 cuando aceptas analíticas
      if (preferences.analytics) {
        window.gtagConsentUpdate?.();
        triggerPageView();
      }

      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
        ad_user_data: preferences.marketing ? 'granted' : 'denied',
        ad_personalization: preferences.marketing ? 'granted' : 'denied',
      });
    }
    notifyConsentUpdate();
  };

  const isMobile = useIsMobile();

  if (!showBanner) return null;

  // ── Mòbil: banner compacte que no tapa el contingut ──
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          <div className="bg-neutral-950/95 backdrop-blur-xl border-t border-oe-gold/20 px-4 py-3 safe-area-bottom">
            <AnimatePresence mode="wait">
              {!showSettings ? (
                <motion.div
                  key="compact"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Cookie className="h-4 w-4 text-oe-gold flex-shrink-0" />
                  <p className="text-xs text-white/70 flex-1 line-clamp-1">
                    {t('description')}{' '}
                    <Link href="/legal/cookies" className="text-oe-gold">
                      {t('moreInfo')}
                    </Link>
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={acceptAll}
                      className="px-4 py-1.5 bg-[var(--grad-gold)] rounded-full text-[var(--bg-main)] text-xs font-bold whitespace-normal break-words sm:whitespace-nowrap"
                    >
                      {t('acceptAll')}
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="p-1.5 text-white/50 hover:text-white transition-colors"
                      aria-label={t('customize')}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="space-y-3 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-medium">{t('necessary.title')}</span>
                      <div className="w-10 h-5 rounded-full bg-oe-gold flex items-center px-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-black ml-auto" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-medium">{t('analytics.title')}</span>
                      <button
                        onClick={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                        className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${preferences.analytics ? 'bg-oe-gold' : 'bg-[var(--bg-elevated)]'}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-[var(--text-primary)] transition-transform ${preferences.analytics ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-xs font-medium">{t('marketing.title')}</span>
                      <button
                        onClick={() => setPreferences((p) => ({ ...p, marketing: !p.marketing }))}
                        className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${preferences.marketing ? 'bg-oe-gold' : 'bg-[var(--bg-elevated)]'}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-[var(--text-primary)] transition-transform ${preferences.marketing ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={savePreferences} className="flex-1 px-3 py-1.5 bg-[var(--grad-gold)] rounded-full text-[var(--bg-main)] text-xs font-bold">
                        {t('save')}
                      </button>
                      <button onClick={acceptNecessary} className="flex-1 px-3 py-1.5 border border-white/20 rounded-full text-white text-xs font-medium">
                        {t('onlyNecessary')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Desktop: banner original ──
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-[min(430px,calc(100vw-2rem))]"
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 48, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="mx-auto w-full">
          <div className="relative rounded-2xl border border-oe-gold/35 bg-bg-surface/96 backdrop-blur-xl p-4 md:p-5 shadow-2xl">
            <button
              onClick={acceptNecessary}
              className="absolute top-3 right-3 text-text-muted hover:text-white transition-colors"
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-oe-gold/10">
                <Cookie className="h-5 w-5 text-oe-gold" />
              </div>

              <div className="flex-1">
                <h3 className="mb-1 text-base font-bold text-white">
                  {t('title')}
                </h3>
                <p className="text-xs leading-relaxed text-text-muted">
                  {t('description')}{' '}
                  <Link href="/legal/cookies" className="text-oe-gold hover:underline">
                    {t('moreInfo')}
                  </Link>
                </p>
              </div>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  className="mb-4 rounded-xl border border-border bg-bg-main p-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{t('necessary.title')}</p>
                        <p className="text-xs text-text-muted">
                          {t('necessary.description')}
                        </p>
                      </div>
                      <div className="w-12 h-6 rounded-full bg-oe-gold flex items-center px-1">
                        <div className="w-4 h-4 rounded-full bg-black ml-auto" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{t('analytics.title')}</p>
                        <p className="text-xs text-text-muted">
                          {t('analytics.description')}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences((p) => ({ ...p, analytics: !p.analytics }))
                        }
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          preferences.analytics ? 'bg-oe-gold' : 'bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-[var(--text-primary)] transition-transform ${
                            preferences.analytics ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{t('marketing.title')}</p>
                        <p className="text-xs text-text-muted">
                          {t('marketing.description')}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences((p) => ({ ...p, marketing: !p.marketing }))
                        }
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          preferences.marketing ? 'bg-oe-gold' : 'bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-[var(--text-primary)] transition-transform ${
                            preferences.marketing ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={acceptAll}
                className="btn-primary justify-center text-center"
              >
                {t('acceptAll')}
              </button>

              <button
                onClick={acceptNecessary}
                className="btn-secondary justify-center text-center"
              >
                {t('onlyNecessary')}
              </button>

              {!showSettings ? (
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-secondary col-span-1 justify-center gap-2 text-center sm:col-span-2"
                >
                  <Settings className="w-4 h-4" />
                  {t('customize')}
                </button>
              ) : (
                <button
                  onClick={savePreferences}
                  className="btn-secondary col-span-1 justify-center text-center sm:col-span-2"
                >
                  {t('save')}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
