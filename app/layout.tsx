// app/layout.tsx
// Root layout - Passthrough for i18n routing
// IMPORTANT: HTML structure is in [locale]/layout.tsx to support i18n
import type { Metadata, Viewport } from 'next';
import './globals.css';

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

// Root layout is a passthrough - actual HTML structure is in [locale]/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
