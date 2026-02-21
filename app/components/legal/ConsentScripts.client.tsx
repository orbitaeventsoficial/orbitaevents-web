/* eslint-disable @next/next/no-before-interactive-script-outside-document */
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { TawkToChat } from '@/components/chat/TawkToChat';

const COOKIE_CONSENT_KEY = 'orbita_cookie_consent';

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
};

const readConsent = (): ConsentState => {
  if (typeof window === 'undefined') return { analytics: false, marketing: false };
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return { analytics: false, marketing: false };
    const parsed = JSON.parse(stored) as { analytics?: boolean; marketing?: boolean };
    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return { analytics: false, marketing: false };
  }
};

export default function ConsentScripts() {
  const [consent, setConsent] = useState<ConsentState>(() => readConsent());

  useEffect(() => {
    const update = () => setConsent(readConsent());
    window.addEventListener('storage', update);
    window.addEventListener('orbita-consent-update', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('orbita-consent-update', update);
    };
  }, []);

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const tawkEnabled = process.env.NEXT_PUBLIC_TAWK_ENABLED === 'true';

  const allowGtm = Boolean(gtmId) && (consent.analytics || consent.marketing);
  const allowGoogleAds = Boolean(googleAdsId) && consent.marketing;
  const allowTawk = tawkEnabled && consent.marketing;

  return (
    <>
      {allowGtm && (
        <>
          <Script
            id="gtm-head"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {allowGoogleAds && (
        <Script
          id="google-ads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              if (typeof window.gtag !== 'function') {
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
              }
              window.gtag('config', '${googleAdsId}');
            `,
          }}
        />
      )}

      <TawkToChat
        propertyId={process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || ''}
        widgetId={process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || 'default'}
        enabled={allowTawk}
        loadDelay={3000}
      />
    </>
  );
}
