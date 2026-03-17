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
import { SITE_CONFIG } from '@/app/config/site-config';
import { getAllPacks, getMinPriceByService } from '@/config/packs-config';

// Components
import LayoutWrapper from '@/app/components/layout/LayoutWrapper';
import { PWAProvider } from '@/app/components/pwa/PWAProvider';
import ConsentScripts from '@/app/components/legal/ConsentScripts.client';
import WebVitalsReporter from '@/app/components/analytics/WebVitalsReporter';
import ExitIntentModal from '@/app/components/ui/ExitIntentModal';
import { absoluteUrl, getSiteUrl } from '@/lib/site';
import { buildIntroBootstrapScript } from '@/lib/intro';


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

const INTRO_BOOTSTRAP_SCRIPT = buildIntroBootstrapScript();

const JSON_LD_ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': absoluteUrl('/#organization'),
  name: 'Orbita Events',
  alternateName: ['Orbita Events', 'Orbita Events Barcelona', 'DJ Bodas Barcelona', 'Discomóvil Barcelona'],
  slogan: 'Creamos la experiencia completa que imaginas',
  description:
    'DJ profesional y tematización completa para bodas, fiestas y eventos de empresa en Barcelona y Girona. Experiencias inmersivas con sonido 4000W, iluminación LED y efectos especiales.',
  url: getSiteUrl(),
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
    url: absoluteUrl('/img/logoplanetatextdreta.svg'),
    width: 280,
    height: 80,
  },
  image: [
    absoluteUrl('/og-default.jpg'),
    absoluteUrl('/img/portfolio/bodas/bodas-01.avif'),
    absoluteUrl('/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif'),
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
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '20:00',
    },
  ],
  sameAs: Object.values(SITE_CONFIG.social.urls),
  // NOTE: aggregateRating removed to fix Google Rich Results error
  // "La ressenya té diverses puntuacions agregades" (multiple aggregate ratings)
  // Google detects LocalBusiness schema multiple times due to RSC hydration
  // Only add aggregateRating on a dedicated reviews page with linked reviews
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
            '@id': absoluteUrl('/#organization'),
          },
        },
        price: String(BODAS_PRICE),
        priceCurrency: 'EUR',
        priceValidUntil: `${new Date().getFullYear()}-12-31`,
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/servicios/bodas'),
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Discomovil Barcelona',
          description:
            'Discomóvil profesional con DJ, sonido de calidad, luces LED y efectos especiales para cualquier celebración.',
          provider: {
            '@id': absoluteUrl('/#organization'),
          },
        },
        price: String(DISCO_PRICE),
        priceCurrency: 'EUR',
        priceValidUntil: `${new Date().getFullYear()}-12-31`,
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/servicios/discomovil'),
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Fiestas tematicas y privadas',
          description:
            'Tematización completa para fiestas: Halloween, años 80, mundo mágico y más. Decoración, efectos y ambientación.',
          provider: {
            '@id': absoluteUrl('/#organization'),
          },
        },
        price: String(FIESTAS_PRICE),
        priceCurrency: 'EUR',
        priceValidUntil: `${new Date().getFullYear()}-12-31`,
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/servicios/fiestas'),
      },
    ],
  },
  potentialAction: [
    {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl('/contacto'),
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
  authors: [{ name: 'Orbita Events', url: getSiteUrl() }],
  creator: 'Orbita Events',
  publisher: 'Orbita Events',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    type: 'website',
    url: getSiteUrl(),
    siteName: 'Orbita Events',
    title: 'Experiencias inmersivas para eventos | DJ + tematización Barcelona',
    description:
      'Creamos experiencias únicas: bodas, fiestas temáticas y eventos corporativos. DJ profesional + tematización completa. Desde 250 EUR. Valoración 5.0/5.',
    images: [
      {
        url: '/og-default.jpg',
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
    images: ['/og-default.jpg'],
    creator: '@orbitaeventsoficial',
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
  alternates: {
    canonical: getSiteUrl(),
    languages: {
      'es': getSiteUrl(),
      'ca': absoluteUrl('/ca'),
      'en': absoluteUrl('/en'),
      'x-default': getSiteUrl(),
    },
  },
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
  colorScheme: 'light dark',
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
    <>
        {/* JSON-LD Structured Data - In body to prevent Next.js head duplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANIZATION) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Orbita Events',
            url: getSiteUrl(),
          }) }}
        />

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
            display: 'block',
            pointerEvents: 'auto',
            opacity: 1,
          }}
          aria-hidden="true"
        />
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOTSTRAP_SCRIPT }} />
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
        <ConsentScripts />
        <WebVitalsReporter />
        <ExitIntentModal />
    </>
  );
}





