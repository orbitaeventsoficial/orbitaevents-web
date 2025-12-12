import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { locales, localeConfig, type Locale } from "@/i18n";
import { inter, outfit, space } from "@/app/fonts";
import "@/app/globals.css";

// Components
import LayoutWrapper from "@/app/components/layout/LayoutWrapper";
import StructuredData from "@/app/components/seo/StructuredData";

// JSON-LD estàtic per SEO (no necessita traduccions - Google entén qualsevol idioma)
const JSON_LD_DATA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://orbitaevents.com/#organization',
  name: 'Òrbita Events',
  alternateName: 'Orbita Events',
  description: 'DJ professional per a casaments, festes i events corporatius a Barcelona i Girona. Discomòbil amb so 4000W, llums LED i efectes especials.',
  url: 'https://orbitaevents.com',
  logo: 'https://orbitaevents.com/img/logoplanetatextdreta.svg',
  image: 'https://orbitaevents.com/img/og-image.jpg',
  telephone: '+34699121023',
  email: 'info@orbitaevents.com',
  address: {
    '@type': 'PostalAddress',
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
    { '@type': 'AdministrativeArea', name: 'Maresme' },
    { '@type': 'AdministrativeArea', name: 'Costa Brava' },
    { '@type': 'State', name: 'Catalunya' },
  ],
  priceRange: '400€ - 1500€',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '09:00',
    closes: '21:00',
  },
  sameAs: [
    'https://www.instagram.com/orbitaevents',
    'https://www.facebook.com/orbitaevents',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Serveis DJ i Events Barcelona',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'DJ Casaments Barcelona',
          description: 'DJ professional per a casaments amb so 4000W, il·luminació i efectes especials.',
          offers: { '@type': 'Offer', price: '650', priceCurrency: 'EUR', priceValidUntil: '2025-12-31' },
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Discomòbil Barcelona',
          description: 'Discomòbil professional amb DJ, so, llums LED i efectes.',
          offers: { '@type': 'Offer', price: '400', priceCurrency: 'EUR', priceValidUntil: '2025-12-31' },
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Festes Privades',
          description: 'DJ per a festes privades: aniversaris, comiats. So, llums i animació.',
          offers: { '@type': 'Offer', price: '400', priceCurrency: 'EUR', priceValidUntil: '2025-12-31' },
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Events Corporatius',
          description: 'DJ i producció tècnica per a events d\'empresa.',
          offers: { '@type': 'Offer', price: '500', priceCurrency: 'EUR', priceValidUntil: '2025-12-31' },
        },
      },
    ],
  },
};

// METADATA MILLORADA
export const metadata: Metadata = {
  title: {
    default: "Òrbita Events | Creem l'Experiència Completa Que Imagines | Barcelona",
    template: '%s | Òrbita Events'
  },
  description: "DJ professional, tematització completa (Món Màgic, Halloween, Disco 80s) i efectes especials. 2+ anys creant experiències úniques a Barcelona i Girona.",
  keywords: [
    'DJ casament Barcelona',
    'DJ boda Girona',
    'discomòbil Catalunya',
    'events temàtics Barcelona',
    'magic theme party',
    'so i llums events',
    'tematització festes',
    'animació casaments'
  ],
  authors: [{ name: 'Òrbita Events' }],
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
      'ca': '/',
      'es': '/es',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ca_ES',
    url: 'https://orbitaevents.com',
    siteName: 'Òrbita Events',
    title: "Òrbita Events | Creem l'Experiència Completa Que Imagines",
    description: "DJ, so, il·luminació i tematització per a casaments, festes i events corporatius a Barcelona i Girona. Experiències úniques que es recorden per sempre.",
    images: [
      {
        url: '/img/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Òrbita Events - Experiències que es recorden',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Òrbita Events | Creem l'Experiència Completa Que Imagines",
    description: "DJ, so, il·luminació i tematització per a casaments, festes i events corporatius a Barcelona i Girona.",
    images: ['/img/og-image.jpg'],
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validar locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Obtenir configuració de l'idioma
  const config = localeConfig[locale as Locale];
  const dir = config?.dir || 'ltr';
  const isRTL = dir === 'rtl';

  // Carregar missatges i traduccions
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'common.nav' });

  return (
    <html
      lang={locale}
      dir={dir}
      className={isRTL ? 'rtl' : 'ltr'}
    >
      <head>
        {/* Schema.org JSON-LD per SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_DATA) }}
        />
        {/* StructuredData desactivat temporalment per evitar errors d'hidratació */}
        {/* <StructuredData locale={locale} /> */}
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} ${space.variable} font-sans antialiased bg-neutral-950 text-white`}
        suppressHydrationWarning
      >
        {/* Skip link per accessibilitat */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                     focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-black
                     focus:rounded-lg focus:font-bold focus:outline-none"
        >
          {t('skip')}
        </a>

        <NextIntlClientProvider messages={messages} locale={locale}>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
