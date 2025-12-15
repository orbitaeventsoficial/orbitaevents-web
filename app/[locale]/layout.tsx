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
import '@/app/globals.css';

// Components
import LayoutWrapper from '@/app/components/layout/LayoutWrapper';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE ANALYTICS SCRIPT
// ═══════════════════════════════════════════════════════════════════════════

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
    'https://orbitaevents.com/img/og-image.jpg',
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
    ratingValue: '4.9',
    ratingCount: '48',
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
    default: "DJ Casaments Barcelona i Girona | Òrbita Events | Des de 400€",
    template: '%s | Òrbita Events',
  },
  description: 'DJ professional per a casaments, festes i events corporatius a Barcelona i Girona. So 4000W, llums LED, efectes especials i tematització completa. Pressupost en 2h. ★★★★★ 4.9/5',
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
    title: 'DJ Casaments Barcelona i Girona | Òrbita Events',
    description: 'DJ professional, so, il·luminació i tematització per a casaments i events. Experiències úniques que es recorden per sempre. ★★★★★ 4.9/5',
    images: [
      {
        url: '/img/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Òrbita Events - DJ Casaments Barcelona',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ Casaments Barcelona i Girona | Òrbita Events',
    description: 'DJ professional per a casaments i events. So, llums i tematització. ★★★★★ 4.9/5',
    images: ['/img/og-image.jpg'],
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
        <AnalyticsScripts />

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
        <NextIntlClientProvider messages={messages} locale={locale}>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </NextIntlClientProvider>
        
        {/* Vercel Analytics */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
