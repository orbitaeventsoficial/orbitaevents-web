"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

const COOKIE_CONSENT_KEY = 'orbita_cookie_consent';

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
      const timer = setTimeout(() => setShowBanner(true), 2000);
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
      const timer = setTimeout(() => setShowBanner(true), 2000);
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

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-3xl border-2 border-oe-gold/30 bg-bg-surface/95 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            <button
              onClick={acceptNecessary}
              className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-oe-gold/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-oe-gold" />
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {t('title')}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
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
                  className="mb-6 p-4 rounded-xl bg-bg-main border border-border"
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
                          preferences.analytics ? 'bg-oe-gold' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
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
                          preferences.marketing ? 'bg-oe-gold' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            preferences.marketing ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptAll}
                className="btn-primary flex-1 text-center justify-center"
              >
                {t('acceptAll')}
              </button>

              <button
                onClick={acceptNecessary}
                className="btn-secondary flex-1 text-center justify-center"
              >
                {t('onlyNecessary')}
              </button>

              {!showSettings ? (
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-secondary flex-1 text-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {t('customize')}
                </button>
              ) : (
                <button
                  onClick={savePreferences}
                  className="btn-secondary flex-1 text-center justify-center"
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
