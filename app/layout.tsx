import type { Metadata, Viewport } from 'next';
import './globals.css';
import caMessages from '@/messages/ca.json';
import { getSiteUrl } from '@/lib/site';
import { inter, plusJakarta, jetbrains, cormorant } from '@/app/fonts';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';

type HomeMeta = { title?: string; description?: string; keywords?: string[]; ogTitle?: string; ogDescription?: string; ogImageAlt?: string };

const homeMeta: HomeMeta = (caMessages as { homePage?: { meta?: HomeMeta } })?.homePage?.meta || {};
const homeKeywords = Array.isArray(homeMeta.keywords) ? homeMeta.keywords : [];

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

export async function generateMetadata(): Promise<Metadata> {
  const managedOg = await getManagedImageOverride('seo.og.default');
  const managedFavicon = await getManagedImageOverride('layout.favicon.main');
  const managedAppleTouchIcon = await getManagedImageOverride('layout.appleTouchIcon');

  const ogImage = managedOg?.src || '/og-default.jpg';
  const ogAlt = managedOg?.alt || homeMeta.ogImageAlt || 'Òrbita Events';
  const faviconUrl = managedFavicon?.src || '/favicon.svg';
  const appleTouchIconUrl = managedAppleTouchIcon?.src || '/apple-touch-icon.png';

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: homeMeta.title || 'Òrbita Events',
      template: '%s | Òrbita Events',
    },
    description: homeMeta.description || 'Experiències immersives per esdeveniments',
    keywords: homeKeywords,
    authors: [{ name: 'Òrbita Events', url: getSiteUrl() }],
    creator: 'Òrbita Events',
    publisher: 'Òrbita Events',
    openGraph: {
      type: 'website',
      locale: 'ca_ES',
      url: '/',
      siteName: 'Òrbita Events',
      title: homeMeta.ogTitle || homeMeta.title || 'Òrbita Events',
      description: homeMeta.ogDescription || homeMeta.description || 'Experiències immersives per esdeveniments',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@orbitaevents',
      creator: '@orbitaevents',
      title: homeMeta.ogTitle || homeMeta.title || 'Òrbita Events',
      description: homeMeta.ogDescription || homeMeta.description || 'Experiències immersives per esdeveniments',
      images: [ogImage],
    },
    alternates: {
      canonical: '/',
      languages: {
        'es-ES': '/',
        'ca-ES': '/ca',
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
    manifest: '/manifest.webmanifest',
    classification: 'Events & Entertainment',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
        { url: faviconUrl, type: managedFavicon?.mimeType || 'image/svg+xml' },
      ],
      apple: [
        { url: appleTouchIconUrl, sizes: '180x180', type: managedAppleTouchIcon?.mimeType || 'image/png' },
      ],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ca"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} ${cormorant.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://region1.analytics.google.com" />
      </head>
      <body
        className="font-sans antialiased bg-[var(--bg-main)] text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
