// app/[locale]/layout.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - LAYOUT PRINCIPAL v3.0
// ═══════════════════════════════════════════════════════════════════════════
//
// MILLORES:
// - Tipografia millorada: Plus Jakarta Sans + Inter
// - SEO optimitzat amb JSON-LD complet
// - Performance millorada
// - Accessibility millorat
//
// ═══════════════════════════════════════════════════════════════════════════

import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import { inter, plusJakarta, jetbrains, sora } from '@/app/fonts';
import Script from 'next/script';
import '@/app/globals.css';

// Components
import LayoutWrapper from '@/app/components/layout/LayoutWrapper';
import { PWAProvider } from '@/app/components/pwa/PWAProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE TAG MANAGER (GTM) - Gestiona Analytics, Ads, Meta Pixel, etc.
// ═══════════════════════════════════════════════════════════════════════════

function GoogleTagManager() {
  if (process.env.NODE_ENV !== 'production') return null;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  if (!gtmId) return null;

  return (
    <>
      {/* Google Tag Manager - Head */}
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
    </>
  );
}

function GoogleTagManagerBody() {
  if (process.env.NODE_ENV !== 'production') return null;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// JSON-LD STRUCTURED DATA - SEO MILLORAT
// ═══════════════════════════════════════════════════════════════════════════

const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://orbitaevents.com/#organization',
  name: 'Òrbita Events',
  alternateName: ['Orbita Events', 'Òrbita Events Barcelona'],
  description: 'DJ professional i tematització completa per a casaments, festes i events corporatius a Barcelona i Girona. Especialistes en experiències úniques amb so 4000W, il·luminació LED i efectes especials.',
  url: 'https://orbitaevents.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://orbitaevents.com/img/logoplanetatextdreta.svg',
    width: 280,
    height: 80,
  },
  image: [
    'https://orbitaevents.com/og-home.jpg',
    'https://orbitaevents.com/img/portfolio/bodas/bodas-01.webp',
    'https://orbitaevents.com/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
  ],
  telephone: '+34699121023',
  email: 'info@orbitaevents.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Granollers',
    addressLocality: 'Granollers',
    addressRegion: 'Barcelona',
    postalCode: '08400',
    addressCountry: 'ES',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 41.6083,
    longitude: 2.2875,
  },
  areaServed: [
    { '@type': 'City', name: 'Barcelona' },
    { '@type': 'City', name: 'Girona' },
    { '@type': 'City', name: 'Granollers' },
    { '@type': 'City', name: 'Mataró' },
    { '@type': 'City', name: 'Sabadell' },
    { '@type': 'City', name: 'Terrassa' },
    { '@type': 'City', name: 'Badalona' },
    { '@type': 'City', name: 'Vic' },
    { '@type': 'City', name: 'Manresa' },
    { '@type': 'AdministrativeArea', name: 'Maresme' },
    { '@type': 'AdministrativeArea', name: 'Vallès Oriental' },
    { '@type': 'AdministrativeArea', name: 'Vallès Occidental' },
    { '@type': 'AdministrativeArea', name: 'Costa Brava' },
    { '@type': 'State', name: 'Catalunya' },
  ],
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday'],
      opens: '10:00',
      closes: '18:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/orbitaevents',
    'https://www.facebook.com/orbitaevents',
    'https://www.tiktok.com/@orbitaevents',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    ratingCount: '1',
    bestRating: '5',
    worstRating: '1',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Serveis DJ i Events Barcelona',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'DJ Casaments Barcelona',
          description: 'DJ professional per a casaments amb so 4000W, il·luminació i efectes especials. Música de cerimònia, còctel i ball fins la matinada.',
        },
        price: '550',
        priceCurrency: 'EUR',
        priceValidUntil: '2025-12-31',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Discomòbil Barcelona',
          description: 'Discomòbil professional amb DJ, so de qualitat, llums LED i efectes especials per a qualsevol celebració.',
        },
        price: '350',
        priceCurrency: 'EUR',
        priceValidUntil: '2025-12-31',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Festes Temàtiques',
          description: 'Tematització completa per a festes: Món Màgic (Harry Potter), Halloween, anys 80 i més. Decoració, efectes i ambientació.',
        },
        price: '800',
        priceCurrency: 'EUR',
        priceValidUntil: '2025-12-31',
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: {
    default: "Experiències Immersives per Events | DJ + Tematització Barcelona | Òrbita Events | Des de 250€",
    template: '%s | Òrbita Events',
  },
  description: 'Creem experiències úniques: casaments Harry Potter, festes Halloween, events corporatius. DJ professional + tematització completa. Des de 250€. Barcelona i Girona. ★★★★★ 5.0/5',
  keywords: [
    'DJ casament Barcelona',
    'DJ boda Girona',
    'discomòbil Barcelona',
    'DJ events corporatius',
    'festa temàtica Halloween',
    'festa Harry Potter Barcelona',
    'so i llums casament',
    'DJ Costa Brava',
    'DJ Maresme',
    'DJ Vallès',
    'animació casaments',
    'efectes especials events',
  ],
  authors: [{ name: 'Òrbita Events', url: 'https://orbitaevents.com' }],
  creator: 'Òrbita Events',
  publisher: 'Òrbita Events',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://orbitaevents.com'),
  alternates: {
    canonical: '/',
    languages: {
      'ca-ES': '/ca',
      'es-ES': '/es',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ca_ES',
    alternateLocale: ['es_ES'],
    url: 'https://orbitaevents.com',
    siteName: 'Òrbita Events',
    title: 'Experiències Immersives per Events | DJ + Tematització Barcelona',
    description: 'Creem experiències úniques: casaments Harry Potter, festes Halloween, events corporatius. DJ professional + tematització completa. Des de 250€. ★★★★★ 5.0/5',
    images: [
      {
        url: '/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Òrbita Events - DJ Casaments Barcelona',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Experiències Immersives per Events | Òrbita Events',
    description: 'Casaments Harry Potter, festes Halloween, events corporatius. DJ + tematització completa. Des de 250€. ★★★★★ 5.0/5',
    images: ['/og-home.jpg'],
    creator: '@orbitaevents',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  category: 'entertainment',
};

// ═══════════════════════════════════════════════════════════════════════════
// VIEWPORT
// ═══════════════════════════════════════════════════════════════════════════

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  colorScheme: 'dark',
};

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE STATIC PARAMS
// ═══════════════════════════════════════════════════════════════════════════

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = params;

  // Validar locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Carregar missatges
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} ${sora.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <GoogleTagManager />

        {/* Preconnects per performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANIZATION) }}
        />
      </head>
      <body
        className="font-sans antialiased bg-[var(--bg-main)] text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        <GoogleTagManagerBody />

        {/* OVERLAY NEGRE INICIAL - Tapa tot fins que JS el treu */}
        <div
          id="intro-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 9998,
            transition: 'opacity 0.4s ease-out',
          }}
          aria-hidden="true"
        />
        {/* Noscript: Si JS desactivat, amagar overlay i mostrar contingut */}
        <noscript>
          <style>{`
            #intro-overlay { display: none !important; }
          `}</style>
        </noscript>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PWAProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </PWAProvider>
        </NextIntlClientProvider>
        
        {/* Vercel Analytics */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
