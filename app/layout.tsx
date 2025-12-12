// app/layout.tsx
// Root layout - NO incluye Header/Footer porque usan next-intl
// Header/Footer están en [locale]/layout.tsx donde hay provider de i18n
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sora } from 'next/font/google';

// StructuredData mogut a [locale]/layout.tsx per suportar i18n
import { SpeedInsights } from '@vercel/speed-insights/next';

// Sora - Font moderna, geomètrica i elegant per tota la web
const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 2,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: 'var(--bg-main)' },
    { media: '(prefers-color-scheme: light)', color: 'var(--bg-main)' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
  title: {
    default: 'Òrbita Events | DJ + Luces + Efectos | Barcelona y Girona',
    template: '%s | Òrbita Events',
  },
  description:
    'Eventos profesionales en Catalunya: bodas memorables, fiestas privadas, eventos corporativos. DJ profesional + luces sincronizadas + efectos especiales. 2+ años de experiencia en Barcelona y Girona.',
  keywords: [
    'eventos catalunya',
    'dj profesional barcelona',
    'bodas barcelona',
    'fiestas girona',
    'eventos costa brava',
    'eventos corporativos',
    'discomovil profesional',
    'produccion eventos',
    'sonido profesional',
    'iluminacion eventos',
  ],
  authors: [{ name: 'Òrbita Events', url: 'https://orbitaevents.com' }],
  creator: 'Òrbita Events',
  publisher: 'Òrbita Events',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    siteName: 'Òrbita Events',
    title: 'Òrbita Events | El Evento Que Tu Gente NO Olvidará',
    description:
      'DJ profesional + luces + efectos para bodas, fiestas y eventos corporativos en Barcelona y Girona. 2+ años de experiencia.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Òrbita Events - Eventos profesionales Catalunya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@orbitaevents',
    creator: '@orbitaevents',
    title: 'Òrbita Events | DJ + Luces + Efectos',
    description: 'Eventos memorables en Barcelona y Girona. 2+ años de experiencia.',
    images: ['/og-default.jpg'],
  },
  alternates: {
    canonical: '/',
    languages: {
      'es-ES': '/',
      'ca-ES': '/ca',
      'en-US': '/en',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
  category: 'events',
  classification: 'Events & Entertainment',
};

// COMPONENTE ANALYTICS 100 % FUNCIONAL
function AnalyticsScripts() {
  if (process.env.NODE_ENV !== 'production') return null;

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return null;

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <script
        id="gtag-init"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });

            gtag('js', new Date());
            gtag('config', '${gaId}', { 
              anonymize_ip: true,
              send_page_view: false
            });

            window.gtagConsentUpdate = function() {
              gtag('consent', 'update', { 'analytics_storage': 'granted' });
              gtag('event', 'page_view', { page_location: window.location.href });
            };
          `,
        }}
      />
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} scroll-smooth`}>
      <head>
        <AnalyticsScripts />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* StructuredData és ara a [locale]/layout.tsx per i18n */}

        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_METRICOOL_HASH && (
          <script
            id="metricool-tracker"
            dangerouslySetInnerHTML={{
              __html: `
                function loadScript(a){
                  var b=document.getElementsByTagName("head")[0],
                  c=document.createElement("script");
                  c.type="text/javascript";
                  c.src="https://tracker.metricool.com/resources/be.js";
                  c.onreadystatechange=a;
                  c.onload=a;
                  b.appendChild(c);
                }
                loadScript(function(){
                  beTracker.t({hash:"${process.env.NEXT_PUBLIC_METRICOOL_HASH}"});
                });
              `,
            }}
          />
        )}
      </head>

      <body className="bg-[var(--bg-main)] text-white antialiased overflow-x-hidden">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
