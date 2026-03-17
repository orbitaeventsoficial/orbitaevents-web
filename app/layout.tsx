// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import caMessages from '@/messages/ca.json';
import { getSiteUrl } from '@/lib/site';
import { inter, plusJakarta, jetbrains } from '@/app/fonts';

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

export const metadata: Metadata = {
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
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: homeMeta.ogImageAlt || 'Òrbita Events',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@orbitaevents',
    creator: '@orbitaevents',
    title: homeMeta.ogTitle || homeMeta.title || 'Òrbita Events',
    description: homeMeta.ogDescription || homeMeta.description || 'Experiències immersives per esdeveniments',
    images: ['/og-default.jpg'],
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
  classification: 'Events & Entertainment',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ca"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased bg-[var(--bg-main)] text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}



