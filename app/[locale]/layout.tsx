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
import { SITE_CONFIG } from '@/config/site-config';
import { getAllPacks, getMinPriceByService } from '@/config/packs-config';
import '@/app/globals.css';

// Components
import LayoutWrapper from '@/app/components/layout/LayoutWrapper';
import { PWAProvider } from '@/app/components/pwa/PWAProvider';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { TawkToChat } from '@/components/chat/TawkToChat';

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

const MIN_SERVICE_PRICE = Math.min(
  getMinPriceByService('bodas'),
  getMinPriceByService('fiestas'),
  getMinPriceByService('empresas'),
  getMinPriceByService('discomovil'),
);

const ALL_PACKS = getAllPacks();
const MAX_SERVICE_PRICE = ALL_PACKS.length
  ? Math.max(...ALL_PACKS.map((p) => p.priceValue))
  : MIN_SERVICE_PRICE;

const PRICE_RANGE = `${MIN_SERVICE_PRICE} EUR - ${MAX_SERVICE_PRICE} EUR`;

const BODAS_PRICE = getMinPriceByService('bodas');
const DISCO_PRICE = getMinPriceByService('discomovil');
const FIESTAS_PRICE = getMinPriceByService('fiestas');

const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://orbitaevents.com/#organization',
  name: 'Orbita Events',
  alternateName: ['Orbita Events', 'Orbita Events Barcelona', 'DJ Bodas Barcelona', 'Discomóvil Barcelona'],
  slogan: 'Creamos la experiencia completa que imaginas',
  description:
    'DJ profesional y tematización completa para bodas, fiestas y eventos de empresa en Barcelona y Girona. Experiencias inmersivas con sonido 4000W, iluminación LED y efectos especiales.',
  url: 'https://orbitaevents.com',
  foundingDate: '2023',
  knowsAbout: [
    'DJ para bodas',
    'Discomóvil profesional',
    'Eventos corporativos',
    'Fiestas temáticas',
    'Producción técnica',
    'Iluminación LED',
    'Efectos especiales',
    'Sonido profesional',
    'Tematización de eventos',
    'Animación de fiestas',
  ],
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
  telephone: SITE_CONFIG.business.phone,
  email: SITE_CONFIG.business.email,
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
    { '@type': 'City', name: 'Mataro' },
    { '@type': 'City', name: 'Sabadell' },
    { '@type': 'City', name: 'Terrassa' },
    { '@type': 'City', name: 'Badalona' },
    { '@type': 'City', name: 'Vic' },
    { '@type': 'City', name: 'Manresa' },
    { '@type': 'AdministrativeArea', name: 'Maresme' },
    { '@type': 'AdministrativeArea', name: 'Valles Oriental' },
    { '@type': 'AdministrativeArea', name: 'Valles Occidental' },
    { '@type': 'AdministrativeArea', name: 'Costa Brava' },
    { '@type': 'State', name: 'Catalunya' },
  ],
  priceRange: PRICE_RANGE,
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
    'https://www.tiktok.com/@orbitaevents',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: String(SITE_CONFIG.stats.avgRating ?? 5),
    ratingCount: String(SITE_CONFIG.stats.reviewCount ?? 1),
    bestRating: '5',
    worstRating: '1',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servicios DJ y Eventos Barcelona',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'DJ bodas Barcelona',
          description:
            'DJ profesional para bodas con sonido 4000W, iluminación y efectos especiales. Ceremonia, cóctel y baile final.',
          provider: {
            '@id': 'https://orbitaevents.com/#organization',
          },
        },
        price: String(BODAS_PRICE),
        priceCurrency: 'EUR',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: 'https://orbitaevents.com/servicios/bodas',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Discomovil Barcelona',
          description:
            'Discomóvil profesional con DJ, sonido de calidad, luces LED y efectos especiales para cualquier celebración.',
          provider: {
            '@id': 'https://orbitaevents.com/#organization',
          },
        },
        price: String(DISCO_PRICE),
        priceCurrency: 'EUR',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: 'https://orbitaevents.com/servicios/discomovil',
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Fiestas tematicas y privadas',
          description:
            'Tematización completa para fiestas: Halloween, años 80, mundo mágico y más. Decoración, efectos y ambientación.',
          provider: {
            '@id': 'https://orbitaevents.com/#organization',
          },
        },
        price: String(FIESTAS_PRICE),
        priceCurrency: 'EUR',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
        url: 'https://orbitaevents.com/servicios/fiestas',
      },
    ],
  },
  potentialAction: [
    {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://orbitaevents.com/contacto',
        inLanguage: ['es', 'ca'],
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: 'Reserva de DJ para eventos',
      },
    },
    {
      '@type': 'CommunicateAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://wa.me/${SITE_CONFIG.business.phone.replace(/\D/g, '')}`,
        inLanguage: ['es', 'ca'],
        actionPlatform: ['http://schema.org/MobileWebPlatform'],
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const metadata: Metadata = {
  title: {
    default:
      'Experiencias inmersivas para eventos | DJ + tematización Barcelona | Orbita Events | Desde 250 EUR',
    template: '%s | Orbita Events',
  },
  description:
    'Creamos experiencias únicas: bodas, fiestas temáticas y eventos corporativos. DJ profesional + tematización completa. Desde 250 EUR. Barcelona y Girona. Valoración 5.0/5.',
  keywords: [
    'DJ bodas Barcelona',
    'DJ bodas Girona',
    'discomovil Barcelona',
    'DJ eventos empresa',
    'fiesta tematica Halloween',
    'fiesta Harry Potter Barcelona',
    'sonido e iluminacion bodas',
    'DJ Costa Brava',
    'DJ Maresme',
    'DJ Valles',
    'animacion bodas',
    'efectos especiales eventos',
  ],
  authors: [{ name: 'Orbita Events', url: 'https://orbitaevents.com' }],
  creator: 'Orbita Events',
  publisher: 'Orbita Events',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://orbitaevents.com'),
  openGraph: {
    type: 'website',
    url: 'https://orbitaevents.com',
    siteName: 'Orbita Events',
    title: 'Experiencias inmersivas para eventos | DJ + tematización Barcelona',
    description:
      'Creamos experiencias únicas: bodas, fiestas temáticas y eventos corporativos. DJ profesional + tematización completa. Desde 250 EUR. Valoración 5.0/5.',
    images: [
      {
        url: '/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Orbita Events - DJ bodas Barcelona',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Experiencias inmersivas para eventos | Orbita Events',
    description:
      'Bodas, fiestas temáticas y eventos corporativos. DJ + tematización completa. Desde 250 EUR. Valoración 5.0/5.',
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

        {/* Preload critical resources for LCP */}
        <link rel="preload" href="/img/hero-poster.webp" as="image" type="image/webp" fetchPriority="high" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* JSON-LD Structured Data - Organization & LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANIZATION) }}
        />

        {/* JSON-LD FAQPage Schema - Google Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '¿Qué hace diferente a Òrbita de otros DJ/proveedores de eventos?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Creamos experiencias completas personalizadas. No solo música: tematización + animación + música adaptada en tiempo real + juegos + efectos. Nuestro DJ lee el ambiente y ajusta sobre la marcha.'
                }
              },
              {
                '@type': 'Question',
                name: '¿Cuánto cuesta contratar Òrbita para mi boda/fiesta/evento?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Trabajamos con packs claros desde 250€. Los precios se calculan automáticamente según horas, equipo y tipo de evento en nuestro configurador.'
                }
              },
              {
                '@type': 'Question',
                name: '¿Trabajáis fuera de Barcelona? ¿Cubrís Girona y Costa Brava?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sí, cubrimos Barcelona provincia y Girona provincia (incluyendo Costa Brava). Transporte GRATIS hasta 25km desde Granollers. Más allá, se añade según distancia.'
                }
              },
              {
                '@type': 'Question',
                name: '¿Qué equipo de sonido e iluminación utilizáis?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Utilizamos equipos profesionales Pioneer DJ, sistemas de sonido JBL/EV con potencia adaptada al espacio, y cabezas móviles LED con control DMX para efectos sincronizados.'
                }
              },
              {
                '@type': 'Question',
                name: '¿Con cuánta antelación debo reservar?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Recomendamos reservar con 2-3 meses de antelación para bodas y eventos grandes. Para fiestas privadas, 2-4 semanas suele ser suficiente. Las fechas populares (sábados de verano) se agotan rápido.'
                }
              },
              {
                '@type': 'Question',
                name: '¿Puedo elegir la música de mi evento?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sí, te enviamos un formulario previo para conocer tus gustos y peticiones especiales. Durante el evento, nuestro DJ adapta la música en tiempo real según la respuesta del público.'
                }
              }
            ]
          }) }}
        />

        {/* JSON-LD WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Orbita Events',
            url: 'https://orbitaevents.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://orbitaevents.com/search?q={search_term_string}'
              },
              'query-input': 'required name=search_term_string'
            }
          }) }}
        />
      </head>
      <body
        className="font-sans antialiased bg-[var(--bg-main)] text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        <GoogleTagManagerBody />

        {/* Skip Navigation - Accessibility (WCAG 2.1 AA - 2.4.1) */}
        <nav aria-label="Skip links" className="skip-links">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-black focus:font-semibold focus:rounded-lg focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            Saltar al contingut principal
          </a>
          <a
            href="#main-nav"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-56 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-black focus:font-semibold focus:rounded-lg focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            Saltar a la navegació
          </a>
          <a
            href="#contact-form"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-[26rem] focus:z-[9999] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-black focus:font-semibold focus:rounded-lg focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            Saltar al formulari
          </a>
        </nav>

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
        {/* Failsafe: Si JS falla, amagar overlay després de 5s */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(function() {
                var o = document.getElementById('intro-overlay');
                if (o && o.style.display !== 'none') {
                  o.style.opacity = '0';
                  setTimeout(function() { o.style.display = 'none'; }, 400);
                }
              }, 5000);
            `,
          }}
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

        {/* Tawk.to Live Chat */}
        <TawkToChat
          propertyId={process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || ''}
          widgetId={process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || 'default'}
          enabled={process.env.NEXT_PUBLIC_TAWK_ENABLED === 'true'}
          loadDelay={3000}
        />
      </body>
    </html>
  );
}





