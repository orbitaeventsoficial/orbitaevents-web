// lib/constants/index.ts
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ÒRBITA EVENTS - CONSTANTES CENTRALIZADAS
//
import type { ExtraDefinition, ServiceSlug } from '@/app/config/packs-config';
import { PORTFOLIO_IMAGES } from '@/app/config/portfolio-images';
import { SITE_CONFIG } from '@/app/config/site-config';
import { HERO_MEDIA_DEFAULT_ITEMS } from '@/lib/constants/hero-media';
import { getAppBaseUrl } from '@/lib/site';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

type StatusTone = {
  bg: string;
  text: string;
  border: string;
  label: string;
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONTACTO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const WHATSAPP_NUMBER = '34699121023';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const WHATSAPP_URL_WITH_MESSAGE = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LEAD STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const LEAD_STATUS_CONFIG: Record<string, StatusTone> = {
  NEW: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Nova entrada' },
  CONTACTED: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Contactat' },
  QUOTE_SENT: { bg: 'admin-tone-bg-violet', text: 'admin-tone-text-violet', border: 'admin-tone-border-violet', label: 'Pressupost enviat' },
  NEGOTIATING: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Negociació' },
  WON: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Guanyat!' },
  LOST: { bg: 'admin-tone-bg-slate', text: 'admin-tone-text-slate', border: 'admin-tone-border-slate', label: 'Perdut' },
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BOOKING STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const BOOKING_STATUS_CONFIG: Record<string, StatusTone> = {
  PENDING: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Pendent' },
  CONFIRMED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Confirmada' },
  PREPARING: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Preparant' },
  COMPLETED: { bg: 'admin-tone-bg-teal', text: 'admin-tone-text-teal', border: 'admin-tone-border-teal', label: 'Completada' },
  CANCELLED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Cancel·lada' },
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROPOSAL STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const BOOKING_STATUS_BADGE_DISPLAY: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendent', className: 'admin-tone-soft-warning admin-tone-text-warning' },
  CONFIRMED: { label: 'Confirmat', className: 'admin-tone-soft-success admin-tone-text-success' },
  PREPARING: { label: 'Preparant', className: 'admin-tone-soft-info admin-tone-text-info' },
  COMPLETED: { label: 'Completat', className: 'admin-tone-idle' },
  CANCELLED: { label: 'Cancel·lat', className: 'admin-tone-soft-danger admin-tone-text-danger' },
};

export const PROPOSAL_STATUS_CONFIG: Record<string, StatusTone> = {
  DRAFT: { bg: 'admin-tone-bg-neutral', text: 'admin-tone-text-neutral', border: 'admin-tone-border-neutral', label: 'Esborrany' },
  SENT: { bg: 'admin-tone-bg-cyan', text: 'admin-tone-text-cyan', border: 'admin-tone-border-cyan', label: 'Enviat' },
  VIEWED: { bg: 'admin-tone-bg-violet', text: 'admin-tone-text-violet', border: 'admin-tone-border-violet', label: 'Vist' },
  ACCEPTED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Acceptat' },
  REJECTED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Rebutjat' },
  EXPIRED: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Caducat' },
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CONTRACT STATUS (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const CONTRACT_STATUS_CONFIG: Record<string, StatusTone> = {
  DRAFT: { bg: 'admin-tone-bg-neutral', text: 'admin-tone-text-neutral', border: 'admin-tone-border-neutral', label: 'Esborrany' },
  SENT: { bg: 'admin-tone-bg-cyan', text: 'admin-tone-text-cyan', border: 'admin-tone-border-cyan', label: 'Enviat' },
  SIGNED: { bg: 'admin-tone-bg-success', text: 'admin-tone-text-success', border: 'admin-tone-border-success', label: 'Signat' },
  CANCELLED: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Cancel·lat' },
};

export const INVOICE_STATUS_DISPLAY: Record<string, { label: string; className: string; icon: string }> = {
  DRAFT: { label: 'Esborrany', className: 'ap-badge', icon: '📝' },
  PENDING_SYNC: { label: 'Sincronitzant...', className: 'ap-badge ap-badge--info', icon: '🔄' },
  SYNCED: { label: 'Sincronitzada', className: 'ap-badge ap-badge--info', icon: '☁️' },
  SYNC_ERROR: { label: 'Error sync', className: 'ap-badge ap-badge--danger', icon: '⚠️' },
  PAID: { label: 'Pagada', className: 'ap-badge ap-badge--success', icon: '✓' },
  CANCELLED: { label: 'Cancel·lada', className: 'ap-badge', icon: '✕' },
};

export const INVOICE_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(INVOICE_STATUS_DISPLAY).map(([status, display]) => [status, display.label])
) as Record<string, string>;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EVENT TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** Emoji + label (default display) */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'ðŸ’ Casament',
  BIRTHDAY: '🎂 Aniversari',
  CORPORATE: '🎯 Corporatiu',
  COMMUNION: '⛪ Comunió',
  BAPTISM: '👶 Bateig',
  GRADUATION: '🎓 Graduació',
  ANNIVERSARY: '🎉 Celebració',
  PRIVATE_PARTY: '🎵 Festa privada',
  OTHER: '📋 Altre',
};

/** Emoji only (for compact views like pipeline cards) */
export const EVENT_TYPE_ICONS: Record<string, string> = {
  WEDDING: 'ðŸ’',
  BIRTHDAY: '🎂',
  CORPORATE: '🎯',
  COMMUNION: '⛪',
  BAPTISM: '👶',
  GRADUATION: '🎓',
  ANNIVERSARY: '🎉',
  PRIVATE_PARTY: '🎵',
  OTHER: '📋',
};

/** Plain text labels without emoji (for selects and forms) */
export const EVENT_TYPE_PLAIN: Record<string, string> = {
  WEDDING: 'Casament',
  BIRTHDAY: 'Aniversari',
  CORPORATE: 'Corporatiu',
  COMMUNION: 'Comunió',
  BAPTISM: 'Bateig',
  GRADUATION: 'Graduació',
  ANNIVERSARY: 'Celebració',
  PRIVATE_PARTY: 'Festa privada',
  OTHER: 'Altre',
};

export const EVENT_TYPE_CHART_COLORS: Record<string, string> = {
  WEDDING: '#f472b6',
  BIRTHDAY: '#fbbf24',
  CORPORATE: '#60a5fa',
  COMMUNION: '#22c55e',
  BAPTISM: '#38bdf8',
  GRADUATION: '#fb7185',
  ANNIVERSARY: '#f59e0b',
  PRIVATE_PARTY: '#a78bfa',
  OTHER: '#34d399',
};
export function getEventTypeDisplay(eventType: string) {
  return {
    label: EVENT_TYPE_PLAIN[eventType] || eventType,
    icon: EVENT_TYPE_ICONS[eventType] || '📅',
  };
};

export const EVENT_TYPE_DOCUMENT_LABELS: Record<string, string> = {
  WEDDING: 'Boda',
  BIRTHDAY: 'Aniversari / Cumpleaños',
  CORPORATE: 'Esdeveniment Corporatiu',
  COMMUNION: 'Comunió',
  BAPTISM: 'Bateig',
  GRADUATION: 'Graduació',
  ANNIVERSARY: 'Aniversari',
  PRIVATE_PARTY: 'Festa Privada',
  OTHER: 'Esdeveniment',
};

export function getDocumentCompanyInfo() {
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');

  return {
    name: 'Òrbita Events',
    legalName: process.env.COMPANY_LEGAL_NAME || 'Carles Ros Oliveras',
    nif: process.env.COMPANY_NIF || 'Pendent de configurar',
    address: 'Granollers, Barcelona',
    phone: SITE_CONFIG.business.phone,
    phoneDisplay: SITE_CONFIG.business.phoneDisplay,
    email: SITE_CONFIG.business.email,
    web: `www.${SITE_CONFIG.web.domain}`,
    logoUrl: `${baseUrl}/img/logoplanetatextdreta.svg`,
    iban: process.env.COMPANY_IBAN || 'Pendent de configurar',
  };
}

type PublicOrganizationJsonLdInput = {
  minServicePrice: number;
  maxServicePrice: number;
  bodasPrice: number;
  discoPrice: number;
  fiestasPrice: number;
};

export function getPublicOrganizationJsonLd({
  minServicePrice,
  maxServicePrice,
  bodasPrice,
  discoPrice,
  fiestasPrice,
}: PublicOrganizationJsonLdInput) {
  const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
  const toAbsoluteUrl = (path: string) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const priceRange = `${minServicePrice} EUR - ${maxServicePrice} EUR`;
  const priceValidUntil = `${new Date().getFullYear()}-12-31`;
  const organizationId = toAbsoluteUrl('/#organization');

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': organizationId,
    name: 'Orbita Events',
    alternateName: ['Orbita Events', 'Orbita Events Barcelona', 'DJ Bodas Barcelona', 'Discomóvil Barcelona'],
    slogan: 'Creamos la experiencia completa que imaginas',
    description:
      'DJ profesional y tematización completa para bodas, fiestas y eventos de empresa en Barcelona y Girona. Experiencias inmersivas con sonido 4000W, iluminación LED y efectos especiales.',
    url: baseUrl,
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
      url: toAbsoluteUrl('/img/logoplanetatextdreta.svg'),
      width: 280,
      height: 80,
    },
    image: [
      toAbsoluteUrl('/og-default.jpg'),
      toAbsoluteUrl('/img/portfolio/bodas/bodas-01.avif'),
      toAbsoluteUrl('/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif'),
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
    priceRange,
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
              '@id': organizationId,
            },
          },
          price: String(bodasPrice),
          priceCurrency: 'EUR',
          priceValidUntil,
          availability: 'https://schema.org/InStock',
          url: toAbsoluteUrl('/servicios/bodas'),
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Discomovil Barcelona',
            description:
              'Discomóvil profesional con DJ, sonido de calidad, luces LED y efectos especiales para cualquier celebración.',
            provider: {
              '@id': organizationId,
            },
          },
          price: String(discoPrice),
          priceCurrency: 'EUR',
          priceValidUntil,
          availability: 'https://schema.org/InStock',
          url: toAbsoluteUrl('/servicios/discomovil'),
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Fiestas tematicas y privadas',
            description:
              'Tematización completa para fiestas: Halloween, años 80, mundo mágico y más. Decoración, efectos y ambientación.',
            provider: {
              '@id': organizationId,
            },
          },
          price: String(fiestasPrice),
          priceCurrency: 'EUR',
          priceValidUntil,
          availability: 'https://schema.org/InStock',
          url: toAbsoluteUrl('/servicios/fiestas'),
        },
      ],
    },
    potentialAction: [
      {
        '@type': 'ReserveAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: toAbsoluteUrl('/contacto'),
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
}

export const RECENT_FEED_EVENT_TYPE_SERVICE_LABELS: Record<string, string> = {
  WEDDING: 'DJ + Producció Boda',
  BIRTHDAY: 'Festa Aniversari',
  CORPORATE: 'Event Corporatiu',
  COMMUNION: 'Comunió',
  BAPTISM: 'Bateig',
  GRADUATION: 'Graduació',
  ANNIVERSARY: 'Aniversari',
  PRIVATE_PARTY: 'Festa Privada',
  OTHER: 'Event Especial',
};

export const RECENT_FEED_EVENT_TYPE_ICONS: Record<string, 'check' | 'sparkles' | 'heart' | 'building'> = {
  WEDDING: 'heart',
  BIRTHDAY: 'sparkles',
  CORPORATE: 'building',
  COMMUNION: 'sparkles',
  BAPTISM: 'heart',
  GRADUATION: 'sparkles',
  ANNIVERSARY: 'heart',
  PRIVATE_PARTY: 'sparkles',
  OTHER: 'check',
};

export const RECENT_FEED_BOOKING_STATUSES = ['CONFIRMED', 'PREPARING', 'COMPLETED'] as const;
export const RECENT_FEED_ANONYMOUS_NAMES: Record<string, readonly string[]> = {
  WEDDING: ['Marc & Laura', 'Pau & Maria', 'Joan & Anna', 'Albert & Carla'],
  BIRTHDAY: ['Sara', 'Marc', 'Laura', 'Pol', 'Maria'],
  CORPORATE: ['Empresa Tech', 'Start-up BCN', 'Consulting SL'],
  PRIVATE_PARTY: ['Marc', 'Laura', 'Joan', 'Anna'],
  COMMUNION: ['Família García', 'Família López'],
  BAPTISM: ['Família Martí', 'Família Puig'],
  OTHER: ['Client VIP', 'Reserva especial'],
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRIORITY (dark theme)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const PRIORITY_CONFIG: Record<string, StatusTone> = {
  LOW: { bg: 'admin-tone-bg-slate', text: 'admin-tone-text-slate', border: 'admin-tone-border-slate', label: 'Baixa' },
  MEDIUM: { bg: 'admin-tone-bg-info', text: 'admin-tone-text-info', border: 'admin-tone-border-info', label: 'Mitjana' },
  HIGH: { bg: 'admin-tone-bg-warning', text: 'admin-tone-text-warning', border: 'admin-tone-border-warning', label: 'Alta' },
  URGENT: { bg: 'admin-tone-bg-danger', text: 'admin-tone-text-danger', border: 'admin-tone-border-danger', label: 'Urgent' },
};

/** Plain text priority labels (for selects and forms) */
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Mitjana',
  HIGH: 'Alta',
  URGENT: 'Urgent',
};

/** Plain text lead status labels (for selects and forms) */
export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Nou lead',
  CONTACTED: 'Contactat',
  QUOTE_SENT: 'Pressupost enviat',
  NEGOTIATING: 'En negociació',
  WON: 'Guanyat',
  LOST: 'Perdut',
};

export const LEAD_STATUS_ANALYTICS_LABELS: Record<string, string> = {
  NEW: 'Nous',
  CONTACTED: 'Contactats',
  QUOTE_SENT: 'Pressupost',
  NEGOTIATING: 'Negociant',
  WON: 'Guanyats',
  LOST: 'Perduts',
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LOCALE MAPPING
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const LOCALE_MAP: Record<string, string> = {
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
};

/** Convert a short locale ('ca', 'es', 'en') to its Intl equivalent ('ca-ES', etc.).
 *  If already a full locale (e.g. 'ca-ES'), returns as-is. */
export function toIntlLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? locale;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORMATTING HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const DEFAULT_LOCALE = 'ca-ES';

export function formatDate(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString(toIntlLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Short date without year: "24 feb" */
export function formatDateShort(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(toIntlLocale(locale), { day: '2-digit', month: 'short' });
}

/** Full date with weekday: "dl. 24 feb 2026" */
export function formatDateFull(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(toIntlLocale(locale), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Locale-default date (no specific options): "24/2/2026" */
export function formatDateSimple(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(toIntlLocale(locale));
}

/** Full datetime with seconds: "24/2/2026, 14:30:00" */
export function formatDateTimeFull(date: Date | string | null | undefined, locale = 'ca-ES'): string {
  if (!date) return '-';
  return new Date(date).toLocaleString(toIntlLocale(locale));
}

/** Number with locale formatting */
export function formatNumber(value: number | null | undefined, opts?: Intl.NumberFormatOptions, locale = 'ca-ES'): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString(toIntlLocale(locale), opts);
}

export function formatCurrency(amount: number | null | undefined, locale = 'ca-ES'): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Case-insensitive event type label lookup (DB uses UPPER, forms may use lower) */
export function getEventLabel(eventType: string, fallback?: string): string {
  return EVENT_TYPE_PLAIN[eventType] || EVENT_TYPE_PLAIN[eventType.toUpperCase()] || fallback || eventType;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BUSINESS DEFAULTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/** Default expected life hours for inventory items */
export const DEFAULT_EXPECTED_LIFE_HOURS = 2000;

/** Sentinel email domain for leads without a real email */
export const PLACEHOLDER_EMAIL_DOMAIN = '@leads.orbitaevents.local';

/** Minimum total spent (EUR) to consider a customer VIP */
export const VIP_SPEND_THRESHOLD = 2000;










export const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'] as const;
export const BOOKING_STATUS_VALUES = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;
export const ACTIVE_INVENTORY_BOOKING_STATUSES = ['CONFIRMED', 'PREPARING'] as const;


export const BOOKING_STATUS_OPTIONS = Object.entries(BOOKING_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export function getLeadStatusDisplay(status: string) {
  return LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.NEW;
}

export function getBookingStatusDisplay(status: string) {
  return BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG.PENDING;
}

export function getBookingStatusBadgeDisplay(status: string) {
  return BOOKING_STATUS_BADGE_DISPLAY[status] || BOOKING_STATUS_BADGE_DISPLAY.PENDING;
}

export function getBookingDocumentFlowStepStyle(done: boolean, active: boolean) {
  if (done) return BOOKING_DOCUMENT_FLOW_STEP_STYLES.done;
  if (active) return BOOKING_DOCUMENT_FLOW_STEP_STYLES.active;
  return BOOKING_DOCUMENT_FLOW_STEP_STYLES.pending;
}

export function getLeadPriorityDisplay(priority: string) {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
}

export function getProposalStatusDisplay(status: string) {
  return PROPOSAL_STATUS_CONFIG[status] || PROPOSAL_STATUS_CONFIG.DRAFT;
}

export function getContractStatusDisplay(status: string) {
  return CONTRACT_STATUS_CONFIG[status] || CONTRACT_STATUS_CONFIG.DRAFT;
}

export function getContractStatusLabel(status: string | null, fallback = 'Pendent') {
  if (!status) return fallback;
  return getContractStatusDisplay(status).label;
}

export function getInvoiceStatusDisplay(status: string) {
  return INVOICE_STATUS_DISPLAY[status] || { label: status, className: 'ap-badge', icon: '🧾' };
}

export function getInvoiceStatusLabel(status: string) {
  return getInvoiceStatusDisplay(status).label;
}

export function getBookingStatusLabel(status: string) {
  return getBookingStatusDisplay(status).label;
}

export function getTaskStatusLabel(status: string) {
  return TASK_STATUS_LABELS[status] || status;
}

export function getLeadStatusAnalyticsDisplay(status: string) {
  return {
    label: LEAD_STATUS_ANALYTICS_LABELS[status] || status,
    tone: LEAD_STATUS_CONFIG[status]?.bg || 'admin-tone-bg-neutral',
  };
}

export const PROPOSAL_FILTERABLE_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_PLAIN).map(([value, label]) => ({
  value,
  label,
}));

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Boca-orella',
  GOOGLE: 'Google',
  OTHER: 'Altre',
};

export const SOURCE_ICONS: Record<string, string> = {
  WEBSITE: 'ðŸŒ',
  CONFIGURATOR: '⚙ï¸',
  PHONE: '📞',
  WHATSAPP: '💬',
  INSTAGRAM: '📸',
  WALLAPOP: '🟣',
  REFERRAL: '👥',
  GOOGLE: 'ðŸ”',
  OTHER: '📩',
};

export function getSourceDisplay(source: string) {
  return {
    label: SOURCE_LABELS[source] || 'Altre',
    icon: SOURCE_ICONS[source] || '📩',
  };
};

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const LEAD_STATUS_ACTION_OPTIONS = [
  { value: 'NEW', label: 'Nova entrada', tone: 'admin-tone-bg-info', icon: '🆕' },
  { value: 'CONTACTED', label: 'Contactat', tone: 'admin-tone-bg-warning', icon: '📞' },
  { value: 'QUOTE_SENT', label: 'Pressupost enviat', tone: 'admin-tone-bg-neutral', icon: '📄' },
  { value: 'NEGOTIATING', label: 'En negociació', tone: 'admin-tone-bg-warning', icon: 'ðŸ¤' },
  { value: 'WON', label: 'Guanyat!', tone: 'admin-tone-bg-success', icon: '✅' },
  { value: 'LOST', label: 'Perdut', tone: 'admin-tone-bg-danger', icon: 'âŒ' },
] as const;

export const LEAD_PIPELINE_COLUMNS = [
  { status: 'NEW', label: 'Noves', toneClass: 'admin-leads-tone admin-leads-tone--new', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--new' },
  { status: 'CONTACTED', label: 'Contactat', toneClass: 'admin-leads-tone admin-leads-tone--contacted', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--contacted' },
  { status: 'QUOTE_SENT', label: 'Pressupost enviat', toneClass: 'admin-leads-tone admin-leads-tone--quote', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--quote' },
  { status: 'NEGOTIATING', label: 'Negociant', toneClass: 'admin-leads-tone admin-leads-tone--negotiating', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--negotiating' },
  { status: 'WON', label: 'Guanyat', toneClass: 'admin-leads-tone admin-leads-tone--won', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--won' },
  { status: 'LOST', label: 'Perdut', toneClass: 'admin-leads-tone admin-leads-tone--lost', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--lost' },
] as const;

export const PRIORITY_DOT_CLASS: Record<string, string> = {
  LOW: 'admin-tone-bg-neutral',
  MEDIUM: 'admin-tone-bg-info',
  HIGH: 'admin-tone-bg-warning',
  URGENT: 'admin-tone-bg-danger',
};

export const LEAD_SCORE_BAND_LABELS: Record<string, string> = {
  LOW: 'BAIX',
  MEDIUM: 'MITJÀ',
  HIGH: 'ALT',
};

export const BOOKING_STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;
export const BOOKING_PIPELINE_COLUMNS = [
  { status: 'PENDING', label: 'Pendents', toneClass: '', cardTone: 'ap-card--warning' },
  { status: 'CONFIRMED', label: 'Confirmades', toneClass: '', cardTone: 'ap-card--success' },
  { status: 'PREPARING', label: 'Preparant', toneClass: '', cardTone: 'ap-card--info' },
  { status: 'COMPLETED', label: 'Completades', toneClass: '', cardTone: 'admin-tone-bg-teal admin-tone-border-teal' },
] as const;
export const BOOKING_OVERVIEW_STATUS_CARDS = [
  { status: 'PENDING', label: 'Pendents', className: 'admin-bookings-stat admin-bookings-stat--pending' },
  { status: 'CONFIRMED', label: 'Confirmades', className: 'admin-bookings-stat admin-bookings-stat--confirmed' },
  { status: 'COMPLETED', label: 'Completades', className: 'admin-bookings-stat admin-bookings-stat--completed' },
  { status: 'CANCELLED', label: 'Cancel·lades', className: 'admin-bookings-stat admin-bookings-stat--cancelled' },
] as const;
export const BOOKING_DOCUMENT_FLOW_STEP_STYLES = {
  done: { card: 'ap-card ap-card--success', dot: 'admin-tone-bg-success', label: 'admin-tone-text-success', badge: 'ap-badge ap-badge--success' },
  active: { card: 'ap-card ap-card--info', dot: 'admin-tone-bg-info', label: 'admin-tone-text-info', badge: 'ap-badge ap-badge--info' },
  pending: { card: 'ap-card', dot: 'admin-tone-bg-neutral', label: 'admin-tone-text-neutral', badge: 'ap-badge' },
} as const;
export const DELETABLE_BOOKING_STATUSES = ['PENDING', 'CANCELLED'] as const;
export const BOOKING_CALENDAR_SYNC_FIELDS = ['status', 'eventDate', 'eventLocation', 'eventVenue', 'startTime', 'endTime', 'notes'] as const;

export const BOOKING_DETAIL_SECTIONS = [
  { id: 'sec-client', label: 'Client' },
  { id: 'sec-event', label: 'Event' },
  { id: 'sec-serveis', label: 'Serveis' },
  { id: 'sec-equipament', label: 'Equipament' },
  { id: 'sec-portal', label: 'Portal' },
  { id: 'sec-finances', label: 'Finances' },
  { id: 'sec-marge', label: 'Marge' },
  { id: 'sec-documents', label: 'Documents' },
  { id: 'sec-comunicacions', label: 'Comunicacions' },
  { id: 'sec-historial', label: 'Historial' },
  { id: 'sec-galeria', label: 'Galeria' },
] as const;

export const BOOKING_GALLERY_PORTFOLIO_CATEGORIES = [
  { slug: 'bodas', name: 'Bodas' },
  { slug: 'discomovil', name: 'Discomovil' },
  { slug: 'eventos-empresa', name: 'Eventos empresa' },
  { slug: 'fiestas-infantiles', name: 'Fiestas infantiles' },
  { slug: 'fiestas-privadas', name: 'Fiestas privadas' },
  { slug: 'produccion-tecnica', name: 'Producción técnica' },
  { slug: 'alquiler-equipo', name: 'Alquiler equipo' },
  { slug: 'fiestas-tematicas-halloween', name: 'Fiestas temáticas Halloween' },
  { slug: 'fiestas-tematicas-mon-magic', name: 'Fiestas temáticas Món Màgic' },
] as const;

export const INVENTORY_CATEGORY_LABELS: Record<string, string> = {
  SOUND: '🔊 So',
  LIGHTING: '💡 Il·lum.',
  EFFECTS: '✨ Efectes',
  STRUCTURE: 'ðŸ—ï¸ Estruct.',
  CABLING: '🔌 Cable',
  TECH: '💻 Tech',
  DECORATION_HP: '🎃 Deco HP',
  DECORATION_HW: '🎄 Deco HW',
  DECORATION_GEN: '🎨 Deco Gen',
  CONSUMABLE: '📦 Consum.',
};

export const INVENTORY_CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Nou' },
  { value: 'EXCELLENT', label: 'Excel·lent' },
  { value: 'GOOD', label: 'Bo' },
  { value: 'FAIR', label: 'Acceptable' },
  { value: 'POOR', label: 'Dolent' },
] as const;

export const SETTINGS_SENSITIVE_KEY_FRAGMENTS = ['refreshToken', 'accessToken', 'secret', 'password', 'apiKey'] as const;

export const SETTINGS_TYPE_LABELS = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
} as const;

export const SETTINGS_CATEGORY_CONFIG: Record<string, { label: string; icon: string; description: string }> = {
  stats: {
    label: 'Estadístiques Públiques',
    icon: '📊',
    description: 'Números que apareixen a la web (esdeveniments, persones, etc.)',
  },
  company: {
    label: 'Empresa',
    icon: 'ðŸ¢',
    description: 'Dades legals i nom comercial (edita a Configuració empresa)',
  },
  holded: {
    label: 'Holded',
    icon: '🧾',
    description: 'Integració amb Holded per facturació',
  },
  contact: {
    label: 'Contacte',
    icon: '📞',
    description: 'Telèfon, email, horaris...',
  },
  pricing: {
    label: 'Preus',
    icon: '💰',
    description: 'Preus base, hora extra, descomptes...',
  },
  config: {
    label: 'Configuració General',
    icon: '⚙ï¸',
    description: 'Altres configuracions del sistema',
  },
  social: {
    label: 'Xarxes Socials',
    icon: '📱',
    description: 'Perfils socials i enllaços',
  },
};

export const CUSTOMER_SOURCE_LABELS: Record<string, string> = {
  website: 'Web',
  configurator: 'Configurador',
  phone: 'Telèfon',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  wallapop: 'Wallapop',
  referral: 'Boca-orella',
  google: 'Google',
  other: 'Altre',
  manual: 'Manual',
  testimonial_form: 'Ressenya',
};

export function getCustomerSourceLabel(source?: string | null, fallback = 'Desconeguda') {
  if (!source) return fallback;
  return CUSTOMER_SOURCE_LABELS[source] || CUSTOMER_SOURCE_LABELS[source.toLowerCase()] || source;
}

export const DISCOUNT_SOURCE_LABELS: Record<string, string> = {
  POST_EVENT: 'Post-event',
  TESTIMONIAL: 'Testimoni',
  REFERRAL: 'Recomanació',
  MANUAL: 'Manual',
};

export function getDiscountSourceLabel(sourceType: string) {
  return DISCOUNT_SOURCE_LABELS[sourceType] || sourceType;
}

export const INTAKE_SOURCE_OPTIONS = [
  { value: 'PHONE', label: 'Telèfon', icon: '📞' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
  { value: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
  { value: 'WALLAPOP', label: 'Wallapop', icon: '🟢' },
  { value: 'REFERRAL', label: 'Boca-orella', icon: '🗣ï¸' },
  { value: 'GOOGLE', label: 'Google', icon: 'ðŸ”' },
  { value: 'WEBSITE', label: 'Web', icon: 'ðŸŒ' },
  { value: 'OTHER', label: 'Altre', icon: '📋' },
] as const;

export const INTAKE_SOURCE_SELECTED_STYLES: Record<string, string> = {
  PHONE: 'border-sky-400/70 bg-sky-500/25 text-sky-100',
  WHATSAPP: 'border-emerald-400/70 bg-emerald-500/25 text-emerald-100',
  INSTAGRAM: 'border-pink-400/70 bg-pink-500/25 text-pink-100',
  WALLAPOP: 'border-lime-400/70 bg-lime-500/25 text-lime-100',
  REFERRAL: 'border-orange-400/70 bg-orange-500/25 text-orange-100',
  GOOGLE: 'border-amber-400/70 bg-amber-500/25 text-amber-100',
  WEBSITE: 'border-cyan-400/70 bg-cyan-500/25 text-cyan-100',
  OTHER: 'border-white/20 bg-white/10 text-white/90',
};

export const INTAKE_EVENT_TYPE_OPTIONS = [
  { value: 'WEDDING', label: 'Casament', icon: 'ðŸ’' },
  { value: 'BIRTHDAY', label: 'Aniversari', icon: '🎂' },
  { value: 'CORPORATE', label: 'Corporatiu', icon: '🎯' },
  { value: 'COMMUNION', label: 'Comunió', icon: '⛪' },
  { value: 'BAPTISM', label: 'Bateig', icon: '👶' },
  { value: 'GRADUATION', label: 'Graduació', icon: '🎓' },
  { value: 'ANNIVERSARY', label: 'Celebració', icon: '🎉' },
  { value: 'PRIVATE_PARTY', label: 'Festa privada', icon: '🎵' },
  { value: 'OTHER', label: 'Altre', icon: '📋' },
] as const;

export const INTAKE_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa', selected: 'border-white/15 bg-white/5 text-white/80' },
  { value: 'MEDIUM', label: 'Mitjana', selected: 'border-sky-400/60 bg-sky-500/20 text-sky-100' },
  { value: 'HIGH', label: 'Alta', selected: 'border-orange-400/60 bg-orange-500/20 text-orange-100' },
  { value: 'URGENT', label: 'Urgent', selected: 'border-rose-400/70 bg-rose-500/25 text-rose-100' },
] as const;

export const INVENTORY_CATEGORY_OPTIONS = [
  { value: 'SOUND', label: 'So', icon: '🔊' },
  { value: 'LIGHTING', label: 'Il·luminació', icon: '💡' },
  { value: 'EFFECTS', label: 'Efectes', icon: '✨' },
  { value: 'STRUCTURE', label: 'Estructura', icon: 'ðŸ—ï¸' },
  { value: 'CABLING', label: 'Cablejat', icon: '🔌' },
  { value: 'TECH', label: 'Tecnologia', icon: '💻' },
  { value: 'DECORATION_HP', label: 'Deco HP', icon: '🎃' },
  { value: 'DECORATION_HW', label: 'Deco HW', icon: '🎄' },
  { value: 'DECORATION_GEN', label: 'Deco General', icon: '🎨' },
  { value: 'CONSUMABLE', label: 'Consumibles', icon: '📦' },
] as const;

export const INVENTORY_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'IN_USE', label: 'En ús' },
  { value: 'MAINTENANCE', label: 'Manteniment' },
  { value: 'BROKEN', label: 'Avariat' },
  { value: 'RETIRED', label: 'Retirat' },
] as const;
export const BLOG_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'bodas', label: 'Bodes' },
  { value: 'eventos', label: 'Esdeveniments' },
  { value: 'consejos', label: 'Consells' },
  { value: 'tendencias', label: 'Tendències' },
  { value: 'tecnologia', label: 'Tecnologia' },
] as const;

export const FAQ_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'sound', label: 'So' },
  { value: 'lighting', label: 'Il·luminació' },
  { value: 'pricing', label: 'Preus' },
  { value: 'booking', label: 'Reserves' },
] as const;

export const FAQ_CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  general: { label: 'General', icon: '📋' },
  sound: { label: 'So', icon: '🔊' },
  lighting: { label: 'Il·luminació', icon: '💡' },
  pricing: { label: 'Preus', icon: '💰' },
  booking: { label: 'Reserves', icon: '📅' },
};
export function getFaqCategoryDisplay(category: string) {
  return FAQ_CATEGORY_CONFIG[category] || { label: category, icon: '❓' };
}
export const ACTIVITY_CATEGORY_OPTIONS = [
  { id: 'all', label: 'Tot', icon: '📊' },
  { id: 'comms', label: 'Comunicacions', icon: '✉ï¸' },
  { id: 'automation', label: 'Automatitzacions', icon: '⚡' },
  { id: 'system', label: 'Sistema', icon: '🔄' },
  { id: 'crud', label: 'Operacions', icon: 'ðŸ“' },
] as const;

export const ACTIVITY_DAYS_OPTIONS = [
  { value: 1, label: 'Avui' },
  { value: 7, label: '7 dies' },
  { value: 30, label: '30 dies' },
  { value: 90, label: '90 dies' },
] as const;

export const CATALOG_TAB_META = {
  packs: {
    label: 'Packs',
    title: 'Packs de servei',
    description: 'Gestiona packs base, contingut i preus inicials.',
  },
  extras: {
    label: 'Extres',
    title: 'Catàleg d\'extres',
    description: 'Defineix extres comercials i compatibilitats per servei.',
  },
  inventory: {
    label: 'Inventari',
    title: 'Inventari operatiu',
    description: 'Controla estat, ús i disponibilitat del material.',
  },
  pricing: {
    label: 'Regles de preu',
    title: 'Preus i rendiment',
    description: 'Edita preus, revisa rendiment i ajusta marges.',
  },
} as const;

export const EMAIL_ACTIVITY_DISPLAY: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  POST_EVENT_EMAIL_SENT: {
    label: 'Email post-event enviat',
    icon: '📧',
    bg: 'admin-tone-bg-info',
    text: 'admin-tone-text-info',
  },
  TESTIMONIAL_SUBMITTED: {
    label: 'Valoració rebuda',
    icon: 'â­',
    bg: 'admin-tone-bg-warning',
    text: 'admin-tone-text-warning',
  },
  DISCOUNT_CODE_GENERATED: {
    label: 'Codi descompte generat',
    icon: 'ðŸŽ',
    bg: 'admin-tone-bg-success',
    text: 'admin-tone-text-success',
  },
  LEAD_EMAIL_SENT: {
    label: 'Confirmació lead enviada',
    icon: '✉ï¸',
    bg: 'admin-tone-bg-violet',
    text: 'admin-tone-text-violet',
  },
};

export const PACK_SERVICE_OPTIONS = [
  { value: 'bodas', label: 'Bodes' },
  { value: 'fiestas', label: 'Festes' },
  { value: 'discomovil', label: 'Discomòbil' },
  { value: 'empresas', label: 'Empreses' },
] as const;

export const SUPPORTED_LOCALES = ['ca', 'es', 'en'] as const;
export const SUPPORTED_LOCALE_LABELS: Record<string, string> = { ca: 'Català', es: 'Castellà', en: 'Anglès' };
export const OPEN_LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] as const;
export const LEAD_STATUS_VALUES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'] as const;
export const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const EVENT_TYPE_VALUES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'] as const;
export const LEAD_SOURCE_VALUES = ['WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'WALLAPOP', 'REFERRAL', 'GOOGLE', 'OTHER'] as const;
export const OPEN_TASK_STATUSES = ['OPEN', 'IN_PROGRESS'] as const;
export const TASK_STATUS_VALUES = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Oberta',
  IN_PROGRESS: 'En curs',
  DONE: 'Feta',
  CANCELLED: 'Cancel·lada',
};

export const TASK_KANBAN_COLUMNS = [
  { status: 'OPEN', label: 'Obertes', toneClass: '', cardTone: 'border-sky-500/20 bg-sky-500/10' },
  { status: 'IN_PROGRESS', label: 'En curs', toneClass: '', cardTone: 'border-amber-500/20 bg-amber-500/10' },
  { status: 'DONE', label: 'Fetes', toneClass: '', cardTone: 'border-emerald-500/20 bg-emerald-500/10' },
] as const;

export const CANVAS_COLOR_OPTIONS = ['#ffffff', '#06b6d4', '#f97316', '#eab308', '#22c55e', '#ec4899', '#a855f7', '#ef4444', '#000000', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)'] as const;

export const DASHBOARD_WIDGET_COLOR_MAP = {
  emerald: { stroke: '#34d399', glow: 'rgba(52, 211, 153, 0.2)' },
  amber: { stroke: '#fbbf24', glow: 'rgba(251, 191, 36, 0.2)' },
  rose: { stroke: '#f472b6', glow: 'rgba(244, 114, 182, 0.2)' },
  cyan: { stroke: '#22d3ee', glow: 'rgba(34, 211, 238, 0.2)' },
} as const;

export const PORTFOLIO_MEDIA_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] as const;
export const PORTFOLIO_MEDIA_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg'] as const;
export const PUBLIC_STATS_COMPANY_START_YEAR = 2023;
export const PUBLIC_STATS_LOCALE_TEXT = {
  es: { since: 'Desde 2023', yearsSuffix: 'años', coverage: 'Barcelona + Girona' },
  ca: { since: 'Des de 2023', yearsSuffix: 'anys', coverage: 'Barcelona + Girona' },
  en: { since: 'Since 2023', yearsSuffix: 'years', coverage: 'Barcelona + Girona' },
} as const;
export const PUBLIC_STATS_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
} as const;

export type PublicCalendarLocale = 'es' | 'ca' | 'en';

export const PUBLIC_CALENDAR_MONTH_NAMES: Record<PublicCalendarLocale, string[]> = {
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  ca: [
    'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
    'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
};

export const PUBLIC_VERIFIED_CUSTOMER_LABELS: Record<PublicCalendarLocale, string> = {
  ca: 'Client verificat',
  es: 'Cliente verificado',
  en: 'Verified customer',
};

export const PUBLIC_CALENDAR_MONTH_SHORT: Record<PublicCalendarLocale, string[]> = {
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
  ca: ['GEN', 'FEB', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DES'],
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
};

export const PUBLIC_CALENDAR_DAY_SHORT: Record<PublicCalendarLocale, string[]> = {
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  ca: ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

export type PaymentReminderLocale = 'ca' | 'es' | 'en';

export const PAYMENT_REMINDER_DAYS_BEFORE_EVENT = 14;
export const PAYMENT_REMINDER_MIN_DAYS_BETWEEN = 7;

export const PAYMENT_REMINDER_COPY: Record<PaymentReminderLocale, {
  subject: (ref: string) => string;
  title: string;
  greeting: (name: string) => string;
  body: (ref: string, date: string, days: number) => string;
  pending: string;
  alreadyPaid: string;
  thanks: string;
  deposit: string;
  remaining: string;
}> = {
  ca: {
    subject: (ref) => `Recordatori de pagament — ${ref}`,
    title: 'Recordatori de pagament',
    greeting: (name) => `Hola ${name},`,
    body: (ref, date, days) => `Et recordem que tens un pagament pendent per a la teva reserva <strong>${ref}</strong>, programada per al <strong>${date}</strong> (d'aquí ${days} dies).`,
    pending: 'Import pendent',
    alreadyPaid: 'Si ja has realitzat el pagament, ignora aquest missatge.',
    thanks: 'Gràcies per confiar en Òrbita Events.',
    deposit: 'Dipòsit',
    remaining: 'Resta',
  },
  es: {
    subject: (ref) => `Recordatorio de pago — ${ref}`,
    title: 'Recordatorio de pago',
    greeting: (name) => `Hola ${name},`,
    body: (ref, date, days) => `Te recordamos que tienes un pago pendiente para tu reserva <strong>${ref}</strong>, programada para el <strong>${date}</strong> (dentro de ${days} días).`,
    pending: 'Importe pendiente',
    alreadyPaid: 'Si ya has realizado el pago, ignora este mensaje.',
    thanks: 'Gracias por confiar en Òrbita Events.',
    deposit: 'Depósito',
    remaining: 'Resto',
  },
  en: {
    subject: (ref) => `Payment reminder — ${ref}`,
    title: 'Payment reminder',
    greeting: (name) => `Hi ${name},`,
    body: (ref, date, days) => `This is a reminder that you have a pending payment for your booking <strong>${ref}</strong>, scheduled for <strong>${date}</strong> (in ${days} days).`,
    pending: 'Pending amount',
    alreadyPaid: 'If you have already made the payment, please disregard this message.',
    thanks: 'Thank you for trusting Òrbita Events.',
    deposit: 'Deposit',
    remaining: 'Remaining',
  },
};

export type BookingCommunicationLocale = 'ca' | 'es' | 'en';
export type BookingCommunicationFlow = 'PAYMENT' | 'POST_EVENT' | 'GENERAL';

export const BOOKING_COMMUNICATION_COPY: Record<BookingCommunicationLocale, Record<BookingCommunicationFlow, {
  subject: (ref: string) => string;
  title: string;
  body: (name: string, ref: string) => string;
  extra?: (dep: string, rem: string, date: string) => string;
  cta?: string;
}>> = {
  ca: {
    PAYMENT: { subject: (r) => `Recordatori de pagament · ${r}`, title: 'Recordatori de pagament', body: (n, r) => `Hola ${n}, t'escrivim per revisar els pagaments del teu esdeveniment (${r}).`, extra: (d, rem, dt) => `<li>Paga i senyal: <strong>${d}</strong></li><li>Resta: <strong>${rem}</strong></li><li>Esdeveniment: <strong>${dt}</strong></li>`, cta: 'Si ja està fet, respon aquest correu i ho marquem.' },
    POST_EVENT: { subject: (r) => `Seguiment post-esdeveniment · ${r}`, title: 'Gràcies pel teu esdeveniment', body: (n) => `Hola ${n}, esperem que l'esdeveniment hagi anat genial. Si no vas poder completar la valoració, te la reenviem en un moment.` },
    GENERAL: { subject: (r) => `Seguiment d'esdeveniment · ${r}`, title: 'Seguiment', body: (n, r) => `Hola ${n}, seguim en contacte per a qualsevol ajust de l'esdeveniment ${r}.` },
  },
  es: {
    PAYMENT: { subject: (r) => `Recordatorio de pago · ${r}`, title: 'Recordatorio de pago', body: (n, r) => `Hola ${n}, te escribimos para revisar los pagos de tu evento (${r}).`, extra: (d, rem, dt) => `<li>Señal: <strong>${d}</strong></li><li>Resto: <strong>${rem}</strong></li><li>Evento: <strong>${dt}</strong></li>`, cta: 'Si ya está hecho, responde a este correo y lo marcamos.' },
    POST_EVENT: { subject: (r) => `Seguimiento post-evento · ${r}`, title: 'Gracias por tu evento', body: (n) => `Hola ${n}, esperamos que el evento haya ido genial. Si no pudiste completar la valoración, te la reenviamos en un momento.` },
    GENERAL: { subject: (r) => `Seguimiento de evento · ${r}`, title: 'Seguimiento', body: (n, r) => `Hola ${n}, seguimos en contacto para cualquier ajuste del evento ${r}.` },
  },
  en: {
    PAYMENT: { subject: (r) => `Payment reminder · ${r}`, title: 'Payment reminder', body: (n, r) => `Hi ${n}, we're writing to review the payments for your event (${r}).`, extra: (d, rem, dt) => `<li>Deposit: <strong>${d}</strong></li><li>Remaining: <strong>${rem}</strong></li><li>Event: <strong>${dt}</strong></li>`, cta: "If already paid, please reply and we'll update it." },
    POST_EVENT: { subject: (r) => `Post-event follow-up · ${r}`, title: 'Thank you for your event', body: (n) => `Hi ${n}, we hope your event went great. If you haven't completed your review, we'll resend it shortly.` },
    GENERAL: { subject: (r) => `Event follow-up · ${r}`, title: 'Follow-up', body: (n, r) => `Hi ${n}, we remain in touch for any adjustments to your event ${r}.` },
  },
};

export type CommercialSequenceLocale = 'ca' | 'es' | 'en';

export const COMMERCIAL_SEQUENCE_STEP_COPY: Record<CommercialSequenceLocale, Record<string, {
  subject: (eventType: string) => string;
  text: (firstName: string) => string;
  activity: string;
}>> = {
  ca: {
    'follow-up-1': {
      subject: (et) => `Seguiment de la teva sol·licitud · ${et}`,
      text: (name) => `Hola ${name}, t'escrivim per avançar amb el teu esdeveniment. Si vols, avui mateix et proposem una opció concreta.`,
      activity: 'Follow-up automàtic (pas 1)',
    },
    'follow-up-2': {
      subject: (et) => `Seguiment pressupost · ${et}`,
      text: (name) => `Hola ${name}, has pogut revisar la nostra proposta? Si vols, ajustem els detalls i tanquem data.`,
      activity: 'Follow-up automàtic (pas 2)',
    },
    'follow-up-3': {
      subject: (et) => `Encara tens temps de reservar · ${et}`,
      text: (name) => `Hola ${name}, les dates disponibles es van omplint. Si t'interessa, podem guardar-te la data provisionalment sense compromís.`,
      activity: 'Follow-up automàtic (pas 3)',
    },
    'follow-up-4': {
      subject: (et) => `Última disponibilitat · ${et}`,
      text: (name) => `Hola ${name}, volem assegurar-nos que no et quedis sense la data que necessites. Tens algun dubte que puguem resoldre?`,
      activity: 'Follow-up automàtic (pas 4)',
    },
    'follow-up-last': {
      subject: (et) => `Tanquem sol·licitud · ${et}`,
      text: (name) => `Hola ${name}, com que no hem rebut resposta, tanquem la teva sol·licitud. Si en el futur necessites alguna cosa, escriu-nos sense compromís!`,
      activity: 'Follow-up automàtic (últim pas)',
    },
  },
  es: {
    'follow-up-1': {
      subject: (et) => `Seguimiento de tu solicitud · ${et}`,
      text: (name) => `Hola ${name}, te escribimos para avanzar con tu evento. Si quieres, hoy mismo te proponemos una opción concreta.`,
      activity: 'Follow-up automático (paso 1)',
    },
    'follow-up-2': {
      subject: (et) => `Seguimiento presupuesto · ${et}`,
      text: (name) => `Hola ${name}, ¿pudiste revisar nuestra propuesta? Si quieres, ajustamos los detalles y cerramos fecha.`,
      activity: 'Follow-up automático (paso 2)',
    },
    'follow-up-3': {
      subject: (et) => `Aún tienes tiempo de reservar · ${et}`,
      text: (name) => `Hola ${name}, las fechas disponibles se van llenando. Si te interesa, podemos guardarte la fecha provisionalmente sin compromiso.`,
      activity: 'Follow-up automático (paso 3)',
    },
    'follow-up-4': {
      subject: (et) => `Última disponibilidad · ${et}`,
      text: (name) => `Hola ${name}, queremos asegurarnos de que no te quedes sin la fecha que necesitas. ¿Tienes alguna duda que podamos resolver?`,
      activity: 'Follow-up automático (paso 4)',
    },
    'follow-up-last': {
      subject: (et) => `Cerramos solicitud · ${et}`,
      text: (name) => `Hola ${name}, como no hemos recibido respuesta, cerramos tu solicitud. Si en el futuro necesitas algo, escríbenos sin compromiso.`,
      activity: 'Follow-up automático (último paso)',
    },
  },
  en: {
    'follow-up-1': {
      subject: (et) => `Follow-up on your request · ${et}`,
      text: (name) => `Hi ${name}, we're writing to move forward with your event. If you'd like, we can propose a specific option today.`,
      activity: 'Automatic follow-up (step 1)',
    },
    'follow-up-2': {
      subject: (et) => `Quote follow-up · ${et}`,
      text: (name) => `Hi ${name}, have you been able to review our proposal? We're happy to adjust the details and lock in a date.`,
      activity: 'Automatic follow-up (step 2)',
    },
    'follow-up-3': {
      subject: (et) => `Still time to book · ${et}`,
      text: (name) => `Hi ${name}, available dates are filling up. If you're interested, we can hold your date provisionally with no commitment.`,
      activity: 'Automatic follow-up (step 3)',
    },
    'follow-up-4': {
      subject: (et) => `Last availability · ${et}`,
      text: (name) => `Hi ${name}, we want to make sure you don't miss out on the date you need. Do you have any questions we can help with?`,
      activity: 'Automatic follow-up (step 4)',
    },
    'follow-up-last': {
      subject: (et) => `Closing your request · ${et}`,
      text: (name) => `Hi ${name}, since we haven't heard back, we're closing your request. If you need anything in the future, feel free to reach out!`,
      activity: 'Automatic follow-up (final step)',
    },
  },
};

export type PublicExtraSupportedLocale = 'ca' | 'es' | 'en';

export type PublicExtraMeta = Pick<ExtraDefinition, 'icon' | 'category' | 'compatibleWith' | 'popular' | 'premium'> & {
  aliases?: string[];
  translations: Record<PublicExtraSupportedLocale, { name: string; description: string }>;
};

export const PUBLIC_EXTRA_DEFAULT_COMPATIBILITY: ServiceSlug[] = ['bodas', 'discomovil', 'fiestas', 'empresas'];

export const PUBLIC_EXTRA_REGISTRY: Record<string, PublicExtraMeta> = {
  'extra-hour': {
    aliases: ['hora-extra'],
    icon: '⏰',
    category: 'time',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    popular: true,
    translations: {
      ca: { name: 'Hora extra DJ', description: 'Allarga la festa una hora més' },
      es: { name: 'Hora extra DJ', description: 'Extiende la fiesta una hora más' },
      en: { name: 'Extra DJ hour', description: 'Extend the party one more hour' },
    },
  },
  'low-fog': {
    aliases: ['humo-bajo'],
    icon: '☁️',
    category: 'effects',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Fum baix', description: 'Efecte de boira arran de terra' },
      es: { name: 'Fum baix', description: 'Efecto de niebla a ras de suelo' },
      en: { name: 'Low fog', description: 'Ground-level fog effect' },
    },
  },
  'co2-cannon': {
    aliases: ['co2-gun'],
    icon: '💨',
    category: 'effects',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Canó CO2', description: 'Explosions de fum fred espectaculars' },
      es: { name: 'Cañón CO2', description: 'Explosiones de humo frío espectaculares' },
      en: { name: 'CO2 Cannon', description: 'Spectacular cold smoke explosions' },
    },
  },
  confetti: {
    aliases: ['confetti'],
    icon: '🎉',
    category: 'effects',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Canó de confeti', description: 'Explosió de color per a moments clau' },
      es: { name: 'Cañón de confeti', description: 'Explosión de color para momentos clave' },
      en: { name: 'Confetti cannon', description: 'Explosion of color for key moments' },
    },
  },
  sparklers: {
    aliases: ['fuego-frio'],
    icon: '✨',
    category: 'effects',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    premium: true,
    translations: {
      ca: { name: 'Bengales fredes', description: 'Espurnes fredes per entrades i moments WOW' },
      es: { name: 'Bengalas frías', description: 'Chispas frías para entradas y momentos WOW' },
      en: { name: 'Cold sparklers', description: 'Cold sparks for entrances and WOW moments' },
    },
  },
  'extra-lights': {
    aliases: ['caps-mobils-extra'],
    icon: '💡',
    category: 'lighting',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    popular: true,
    translations: {
      ca: { name: 'Llums extra', description: 'Més caps mòbils per més impacte' },
      es: { name: 'Luces extra', description: 'Más cabezas móviles para más impacto' },
      en: { name: 'Extra lights', description: 'More moving heads for more impact' },
    },
  },
  karaoke: {
    icon: '🎤',
    category: 'sound',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Karaoke', description: 'Sistema de karaoke amb milers de cançons' },
      es: { name: 'Karaoke', description: 'Sistema de karaoke con miles de canciones' },
      en: { name: 'Karaoke', description: 'Karaoke system with thousands of songs' },
    },
  },
  'theme-hp': {
    icon: '🪄',
    category: 'visual',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    premium: true,
    translations: {
      ca: { name: 'Tematització Món Màgic', description: "Decoració màgica completa d'escola de bruixeria" },
      es: { name: 'Tematización Mundo Mágico', description: 'Decoración mágica completa de escuela de brujos' },
      en: { name: 'Magic World theme', description: 'Complete magical wizard school decoration' },
    },
  },
  'theme-halloween': {
    icon: '🎃',
    category: 'visual',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    premium: true,
    translations: {
      ca: { name: 'Tematització Halloween', description: 'Terror i diversió per la teva festa' },
      es: { name: 'Tematización Halloween', description: 'Terror y diversión para tu fiesta' },
      en: { name: 'Halloween theme', description: 'Terror and fun for your party' },
    },
  },
  'gopro-recording': {
    icon: '📹',
    category: 'visual',
    compatibleWith: PUBLIC_EXTRA_DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Gravació GoPro', description: 'Capturem els millors moments' },
      es: { name: 'Grabación GoPro', description: 'Capturamos los mejores momentos' },
      en: { name: 'GoPro recording', description: 'We capture the best moments' },
    },
  },
};

export const PUBLIC_EXTRA_REGISTRY_BY_SLUG: Record<string, { canonicalId: string; meta: PublicExtraMeta }> = Object.fromEntries(
  Object.entries(PUBLIC_EXTRA_REGISTRY).flatMap(([canonicalId, meta]) => {
    const slugs = [canonicalId, ...(meta.aliases ?? [])];
    return slugs.map((slug) => [slug, { canonicalId, meta }] as const);
  })
);

export const LEAD_DOCUMENT_UPLOAD_MAX_SIZE_BYTES = 8 * 1024 * 1024;
export const LEAD_DOCUMENT_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
] as const;
export const LEAD_DOCUMENT_TYPE_VALUES = [
  'QUOTE',
  'CONTRACT',
  'INVOICE',
  'IMAGE',
  'FILE',
  'OTHER',
] as const;











export const PUBLIC_MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

export const PUBLIC_BOTTOM_NAV_ITEMS = [
  { href: '/', icon: 'Home', labelKey: 'home', exactMatch: true },
  { href: '/servicios/bodas', icon: 'Briefcase', labelKey: 'services', exactMatch: false },
  { href: '/configurador', icon: 'Calculator', labelKey: 'configure', exactMatch: true, highlight: true },
  { href: '/portfolio', icon: 'Image', labelKey: 'portfolio', exactMatch: true },
  { href: '/contacto', icon: 'MessageCircle', labelKey: 'contact', exactMatch: true },
] as const;

export const PUBLIC_FOOTER_DEFAULT_COVERAGE = ['Barcelona', 'Girona', 'Costa Brava', 'Maresme', 'Vallès'] as const;

export const PUBLIC_FOOTER_SERVICES_LINKS = [
  { nameKey: 'djWeddings', href: '/servicios/bodas', icon: '💍' },
  { nameKey: 'privateParties', href: '/servicios/fiestas', icon: '🎉' },
  { nameKey: 'corporateEvents', href: '/servicios/empresas', icon: '💼' },
  { nameKey: 'discomovil', href: '/servicios/discomovil', icon: '🎵' },
] as const;

export const PUBLIC_FOOTER_EXPERIENCES_LINKS = [
  { nameKey: 'monMagic', href: '/tematica-mon-magic', icon: '🪄' },
  { nameKey: 'halloween', href: '/tematica-halloween', icon: '🎃' },
  { nameKey: 'bodaHalloween', href: '/boda-halloween', icon: '💀' },
  { nameKey: 'allExperiences', href: '/experiencias', icon: '✨' },
] as const;

export const PUBLIC_FOOTER_RESOURCES_LINKS = [
  { nameKey: 'portfolio', href: '/portfolio' },
  { nameKey: 'about', href: '/about' },
  { nameKey: 'reviews', href: '/opiniones' },
  { nameKey: 'faq', href: '/faq' },
  { nameKey: 'blog', href: '/blog' },
] as const;

export const PUBLIC_FOOTER_LEGAL_LINKS = [
  { nameKey: 'privacy', href: '/legal/privacidad' },
  { nameKey: 'privacyPortal', href: '/privacitat' },
  { nameKey: 'terms', href: '/legal/terminos' },
  { nameKey: 'cookies', href: '/legal/cookies' },
  { nameKey: 'legalNotice', href: '/legal/aviso-legal' },
] as const;

export const PUBLIC_PROCESS_STEP_STYLES = [
  { gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.25)', emoji: '💬', accent: 'text-amber-400' },
  { gradient: 'from-purple-500 to-pink-500', glow: 'rgba(168,85,247,0.2)', emoji: '✨', accent: 'text-purple-400' },
  { gradient: 'from-emerald-500 to-teal-400', glow: 'rgba(16,185,129,0.2)', emoji: '🎊', accent: 'text-emerald-400' },
] as const;

export const PUBLIC_FAQ_KEYS = ['1', '2', '3', '4', '5', '6', '7'] as const;


export const PUBLIC_PORTFOLIO_SHOWCASE_ITEMS = [
  {
    id: 'discomovil',
    slug: 'discomovil',
    translationKey: 'discomovil',
    emoji: '🎧',
    mobileAccent: 'from-amber-500 to-orange-500',
    mobileBorder: 'border-amber-500/50',
    mobileText: 'text-amber-400',
    mobileBg: 'bg-amber-500/10',
    desktopAccent: 'from-amber-500/30 to-orange-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 10,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'halloween',
    slug: 'fiestas-tematicas-halloween',
    translationKey: 'halloween',
    emoji: '🎃',
    mobileAccent: 'from-orange-600 to-red-700',
    mobileBorder: 'border-orange-500/50',
    mobileText: 'text-orange-400',
    mobileBg: 'bg-orange-500/10',
    desktopAccent: 'from-purple-500/30 to-red-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 10,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'monMagic',
    slug: 'fiestas-tematicas-mon-magic',
    translationKey: 'monMagic',
    emoji: '🪄',
    mobileAccent: 'from-purple-600 to-pink-600',
    mobileBorder: 'border-purple-500/50',
    mobileText: 'text-purple-400',
    mobileBg: 'bg-purple-500/10',
    desktopAccent: 'from-blue-500/30 to-cyan-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 9,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'bodas',
    slug: 'bodas',
    translationKey: 'bodas',
    emoji: '💍',
    mobileAccent: 'from-pink-500 to-rose-500',
    mobileBorder: 'border-pink-500/50',
    mobileText: 'text-pink-400',
    mobileBg: 'bg-pink-500/10',
    desktopAccent: 'from-rose-500/30 to-pink-500/10',
    mobilePhotoCount: 4,
    desktopPhotoCount: 4,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'empreses',
    slug: 'eventos-empresa',
    translationKey: 'empreses',
    emoji: '🏢',
    mobileAccent: 'from-blue-500 to-cyan-500',
    mobileBorder: 'border-blue-500/50',
    mobileText: 'text-blue-400',
    mobileBg: 'bg-blue-500/10',
    desktopAccent: 'from-emerald-500/30 to-teal-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 9,
    showInMobile: true,
    showInDesktop: true,
  },
  {
    id: 'privades',
    slug: 'fiestas-privadas',
    translationKey: 'privades',
    emoji: '🎉',
    mobileAccent: 'from-emerald-500 to-teal-500',
    mobileBorder: 'border-emerald-500/50',
    mobileText: 'text-emerald-400',
    mobileBg: 'bg-emerald-500/10',
    desktopAccent: 'from-emerald-500/30 to-teal-500/10',
    mobilePhotoCount: 6,
    desktopPhotoCount: 6,
    showInMobile: true,
    showInDesktop: false,
  },
] as const;

export type PublicPortfolioShowcaseBaseItem = (typeof PUBLIC_PORTFOLIO_SHOWCASE_ITEMS)[number];
export type PublicPortfolioShowcaseStory = PublicPortfolioShowcaseBaseItem & {
  photos: string[];
};

export function getPublicPortfolioShowcasePhotos(
  slug: keyof typeof PORTFOLIO_IMAGES,
  limit: number
) {
  return (PORTFOLIO_IMAGES[slug] ?? []).slice(0, limit).map((image) => image.src);
}

export const PUBLIC_HALLOWEEN_DECORATION_ITEMS = [
  { icon: '👻', key: 0 },
  { icon: '🕷️', key: 1 },
  { icon: '🧹', key: 2 },
  { icon: '🫕', key: 3 },
  { icon: '🕯️', key: 4 },
  { icon: '🪞', key: 5 },
  { icon: '🕸️', key: 6 },
  { icon: '💀', key: 7 },
] as const;

export const PUBLIC_HALLOWEEN_PREVIEW_ICONS = ['👻', '🕷️', '🫕', '🕯️', '💀', '🕸️'] as const;

export const PUBLIC_HALLOWEEN_PACKS = [
  { key: 'basic', emoji: '🕯️', hours: 4, price: 600, popular: false },
  { key: 'night', emoji: '👻', hours: 5, price: 900, popular: true },
  { key: 'zombie', emoji: '💀', hours: 6, price: 1500, popular: false },
] as const;

export const PUBLIC_HALLOWEEN_INCLUDES_KEYS = ['dj', 'decoration', 'effects'] as const;

export const PUBLIC_HALLOWEEN_FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

export const PUBLIC_HALLOWEEN_HERO_TAGS = ['tag1', 'tag2', 'tag3'] as const;

export const PUBLIC_HALLOWEEN_HERO_IMAGE =
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-15.avif' as const;

export const PUBLIC_HALLOWEEN_GALLERY_SELECTION = [
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-10.avif',
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-16.avif',
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-20.avif',
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-23.avif',
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-24.avif',
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-29.avif',
] as const;


export const PUBLIC_MOBILE_STATS_CONFIGS = [
  {
    key: 'events',
    value: 50,
    prefix: '',
    suffix: '+',
    emoji: '🎉',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.18)',
  },
  {
    key: 'rating',
    value: 5,
    prefix: '',
    suffix: '.0★',
    emoji: '🌟',
    gradient: 'from-yellow-300 to-amber-400',
    glow: 'rgba(253,224,71,0.15)',
  },
  {
    key: 'response',
    value: 2,
    prefix: '<',
    suffix: 'h',
    emoji: '⚡',
    gradient: 'from-cyan-400 to-blue-500',
    glow: 'rgba(34,211,238,0.15)',
  },
  {
    key: 'experience',
    value: 3,
    prefix: '',
    suffix: '+',
    emoji: '🏆',
    gradient: 'from-purple-400 to-pink-500',
    glow: 'rgba(167,139,250,0.15)',
  },
] as const;


export const PUBLIC_CALENDAR_SOCIAL_PROOF_INITIALS = ['G', 'I', 'X'] as const;

export const PUBLIC_HERO_KEN_BURNS_PRESETS = [
  { x: [0, -1], y: [0, -0.5], scale: [0.93, 1.02] },
  { x: [0, 1], y: [0, -0.5], scale: [0.94, 1.02] },
  { x: [0, -0.5], y: [0, 0.5], scale: [0.92, 1.01] },
  { x: [0, 0.5], y: [0, -1], scale: [0.93, 1.02] },
  { x: [0, -0.5], y: [0, 0.5], scale: [0.94, 1.02] },
] as const;


export const PUBLIC_FOOTER_SOCIAL_LINK_META = [
  { name: 'Instagram', configKey: 'instagram', color: 'hover:text-[#E4405F] hover:bg-[#E4405F]/10' },
  { name: 'TikTok', configKey: 'tiktok', color: 'hover:text-[#00F2EA] hover:bg-[#00F2EA]/10' },
  { name: 'LinkedIn', configKey: 'linkedin', color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10' },
  { name: 'YouTube', configKey: 'youtube', color: 'hover:text-[#FF0000] hover:bg-[#FF0000]/10' },
] as const;

export const PUBLIC_FOOTER_TRUST_SIGNAL_META = [
  { key: 'experience', icon: '⭐', color: 'from-amber-500/30 to-orange-500/30', accent: 'text-amber-400' },
  { key: 'events', icon: '🎉', color: 'from-purple-500/30 to-pink-500/30', accent: 'text-purple-400' },
  { key: 'response', icon: '⚡', color: 'from-green-500/30 to-emerald-500/30', accent: 'text-emerald-400' },
  { key: 'coverage', icon: '📍', color: 'from-blue-500/30 to-cyan-500/30', accent: 'text-cyan-400' },
] as const;


export const PUBLIC_HERO_MEDIA_FALLBACK = HERO_MEDIA_DEFAULT_ITEMS.map(({ id, url, type, label }) => ({
  id,
  url,
  type,
  label: label === 'Vídeo original' ? 'Vídeo' : label,
})) as ReadonlyArray<{ id: string; url: string; type: 'video' | 'image'; label: string }>;


export const PUBLIC_LANGUAGE_CODES = ['ca', 'es', 'en'] as const;
export const PUBLIC_LANGUAGE_SHORT_NAMES: Record<(typeof PUBLIC_LANGUAGE_CODES)[number], string> = { ca: 'CA', es: 'ES', en: 'EN' };

export const PUBLIC_MOBILE_HOME_GUARANTEES = [
  { icon: '🛡️', titleKey: 'satisfaction.title', descKey: 'satisfaction.desc', gradient: 'from-green-500 to-emerald-500' },
  { icon: '🔧', titleKey: 'backup.title', descKey: 'backup.desc', gradient: 'from-blue-500 to-cyan-500' },
  { icon: '⚡', titleKey: 'response.title', descKey: 'response.desc', gradient: 'from-amber-500 to-orange-500' },
] as const;

export const PUBLIC_SERVICES_GRID_PILLARS = [
  { key: 'dj', iconKey: 'dj', accent: 'from-amber-500 to-orange-500', accentLight: 'text-amber-400', glowColor: 'rgba(251, 191, 36, 0.08)', href: '/servicios/fiestas' },
  { key: 'theming', iconKey: 'theme', accent: 'from-purple-500 to-pink-500', accentLight: 'text-purple-400', glowColor: 'rgba(168, 85, 247, 0.08)', href: '/portfolio' },
  { key: 'production', iconKey: 'production', accent: 'from-cyan-500 to-blue-500', accentLight: 'text-cyan-400', glowColor: 'rgba(6, 182, 212, 0.08)', href: '/servicios/empresas' },
] as const;

export const PUBLIC_GARANTIA_CONFIG = [
  { key: 'response', iconKey: 'Clock', highlight: '<2h', color: 'from-amber-500 to-orange-500' },
  { key: 'noSurprises', iconKey: 'Receipt', highlight: '0€', color: 'from-purple-500 to-violet-500' },
  { key: 'support', iconKey: 'Headset', highlight: '24/7', color: 'from-rose-500 to-pink-500' },
  { key: 'passion', iconKey: 'Heart', highlight: '∞', color: 'from-red-500 to-orange-500' },
] as const;

export const PUBLIC_MOBILE_CTA_TRUST_BADGES = [
  { icon: '⭐', value: '5.0', labelKey: 'badges.rating' },
  { icon: '🎉', value: '50+', labelKey: 'badges.events' },
  { icon: '⚡', value: '2h', labelKey: 'badges.response' },
] as const;

export const APP_IMMERSIVE_PAGES = ['/sensorial', '/respira'] as const;

export const API_CANVAS_TESTIMONIAL_PRESETS = {
  instagramStory: {
    width: 1080,
    height: 1920,
    backgroundColor: '#0a0a0a',
    accentColor: '#f97316',
    textColor: '#ffffff',
  },
  instagramPost: {
    width: 1080,
    height: 1080,
    backgroundColor: '#0a0a0a',
    accentColor: '#f97316',
    textColor: '#ffffff',
  },
} as const;

export const API_UPLOAD_DIRECT_LIMIT = 4 * 1024 * 1024;

export const API_UPLOAD_VALID_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
] as const;

export type ApiUploadLocale = 'ca' | 'es' | 'en';

export const API_UPLOAD_MESSAGES: Record<ApiUploadLocale, Record<string, string>> = {
  ca: {
    unauthorized: 'No autoritzat',
    missingFileNameOrType: 'Falten paràmetres fileName i fileType',
    invalidFolder: 'Carpeta no vàlida',
    invalidFileType: 'Tipus de fitxer no permès. Fes servir JPG, PNG, WebP, GIF o MP4.',
    missingFile: "No s'ha proporcionat cap fitxer",
    fileTooLarge: 'Fitxer massa gran per pujada directa.',
    processingError: "Error processant el fitxer",
  },
  es: {
    unauthorized: 'No autorizado',
    missingFileNameOrType: 'Faltan parametros fileName y fileType',
    invalidFolder: 'Carpeta invalida',
    invalidFileType: 'Tipo de fichero no permitido. Usa JPG, PNG, WebP, GIF o MP4.',
    missingFile: 'No se ha proporcionado ningun fichero',
    fileTooLarge: 'Fichero demasiado grande para upload directo.',
    processingError: 'Error procesando el fichero',
  },
  en: {
    unauthorized: 'Unauthorized',
    missingFileNameOrType: 'Missing fileName and fileType parameters',
    invalidFolder: 'Invalid folder',
    invalidFileType: 'File type not allowed. Use JPG, PNG, WebP, GIF or MP4.',
    missingFile: 'No file was provided',
    fileTooLarge: 'File too large for direct upload.',
    processingError: 'Error processing file',
  },
};

export const PUBLIC_EXPERIENCES_PAGE_ITEMS = [
  {
    id: 'mon-magic',
    href: '/tematica-mon-magic',
    icon: '🪄',
    titleKey: 'monMagic.title',
    subtitleKey: 'monMagic.subtitle',
    descriptionKey: 'monMagic.description',
    image: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif',
    gradient: 'from-purple-600 to-blue-600',
    bgGradient: 'from-purple-900/40 to-blue-900/40',
    badgeKey: 'badges.popular',
    badgeColor: 'bg-purple-500',
    featuresKey: 'monMagic.features',
  },
  {
    id: 'halloween',
    href: '/tematica-halloween',
    icon: '🎃',
    titleKey: 'halloween.title',
    subtitleKey: 'halloween.subtitle',
    descriptionKey: 'halloween.description',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
    gradient: 'from-orange-600 to-red-700',
    bgGradient: 'from-orange-900/40 to-red-900/40',
    badgeKey: 'badges.terrific',
    badgeColor: 'bg-orange-500',
    featuresKey: 'halloween.features',
  },
  {
    id: 'boda-halloween',
    href: '/boda-halloween',
    icon: '💀',
    titleKey: 'bodaHalloween.title',
    subtitleKey: 'bodaHalloween.subtitle',
    descriptionKey: 'bodaHalloween.description',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-02.avif',
    gradient: 'from-gray-700 to-purple-800',
    bgGradient: 'from-gray-900/40 to-purple-900/40',
    badgeKey: 'badges.exclusive',
    badgeColor: 'bg-gray-600',
    featuresKey: 'bodaHalloween.features',
  },
  {
    id: 'disco-80s',
    href: '/contacto?tema=disco80s',
    icon: '🕺',
    titleKey: 'disco80s.title',
    subtitleKey: 'disco80s.subtitle',
    descriptionKey: 'disco80s.description',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
    gradient: 'from-pink-600 to-purple-600',
    bgGradient: 'from-pink-900/40 to-purple-900/40',
    badgeKey: 'badges.retro',
    badgeColor: 'bg-pink-500',
    featuresKey: 'disco80s.features',
    comingSoon: true,
  },
  {
    id: 'tropical',
    href: '/contacto?tema=tropical',
    icon: '🌴',
    titleKey: 'tropical.title',
    subtitleKey: 'tropical.subtitle',
    descriptionKey: 'tropical.description',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-02.avif',
    gradient: 'from-green-500 to-teal-600',
    bgGradient: 'from-green-900/40 to-teal-900/40',
    badgeKey: 'badges.summer',
    badgeColor: 'bg-green-500',
    featuresKey: 'tropical.features',
    comingSoon: true,
  },
  {
    id: 'elegant',
    href: '/contacto?tema=elegant',
    icon: '✨',
    titleKey: 'elegant.title',
    subtitleKey: 'elegant.subtitle',
    descriptionKey: 'elegant.description',
    image: '/img/portfolio/bodas/bodas-01.avif',
    gradient: 'from-amber-500 to-yellow-600',
    bgGradient: 'from-amber-900/40 to-yellow-900/40',
    badgeKey: 'badges.premium',
    badgeColor: 'bg-amber-500',
    featuresKey: 'elegant.features',
    comingSoon: true,
  },
] as const;

export const PUBLIC_HALLOWEEN_WEDDING_FEATURE_KEYS = ['theming', 'effects', 'dj', 'experience'] as const;
export const PUBLIC_HALLOWEEN_WEDDING_FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;

export const PUBLIC_CHILDREN_ANIMATION_SERVICES = [
  { id: 'jocs', iconKey: 'Gamepad2', color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
  { id: 'pintacares', iconKey: 'Palette', color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { id: 'magia', iconKey: 'Wand2', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: 'globoflexia', iconKey: 'Heart', color: 'from-red-500 to-orange-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  { id: 'tallers', iconKey: 'Scissors', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { id: 'musica', iconKey: 'Music', color: 'from-amber-500 to-yellow-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
] as const;

export const PUBLIC_CHILDREN_ANIMATION_PACKS = [
  { id: 'basic', hours: 1.5, price: 180, recommended: false },
  { id: 'complet', hours: 2.5, price: 300, recommended: true },
  { id: 'premium', hours: 3.5, price: 420, recommended: false },
] as const;

export const PUBLIC_CHILDREN_ANIMATION_INFO_ITEMS = [
  { id: 'experience', iconKey: 'Star' },
  { id: 'ages', iconKey: 'Users' },
  { id: 'punctuality', iconKey: 'Clock' },
  { id: 'coverage', iconKey: 'MapPin' },
] as const;

export const PUBLIC_MON_MAGIC_IMAGES = {
  hero: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-18.avif',
  featured: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-16.avif',
  cartell: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-02.avif',
  mussolDecoratiu: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-06.avif',
  taulaCompleta: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-10.avif',
  gabiaPerga: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-13.avif',
  llegintCarta: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-14.avif',
} as const;

export const PUBLIC_MON_MAGIC_HOUSES = [
  { id: 'escola', color: '#1A1A1A', colorLacre: '#D4AF37', gradient: 'from-amber-600 to-amber-800', animal: '🏰' },
  { id: 'lleons', color: '#740001', colorLacre: '#9B1B30', gradient: 'from-red-700 to-red-900', animal: '🦁' },
  { id: 'serps', color: '#1A472A', colorLacre: '#2D8C4E', gradient: 'from-green-700 to-green-900', animal: '🐍' },
  { id: 'teixons', color: '#FFD700', colorLacre: '#D4A017', gradient: 'from-yellow-500 to-amber-600', animal: '🦡' },
  { id: 'aguiles', color: '#0E1A40', colorLacre: '#3A6BC5', gradient: 'from-blue-800 to-blue-950', animal: '🦅' },
] as const;

export const PUBLIC_MON_MAGIC_PRODUCTS = [
  { id: 'sobre-complet', key: 'sobreComplet', emoji: '✉️', preuUnitat: 10, preuPack: 8, packMinim: 50, destacat: true, numCaracteristiques: 6 },
  { id: 'pergami-amor', key: 'pergamiAmor', emoji: '📜', preuUnitat: 4, preuPack: 3, packMinim: 30, destacat: false, numCaracteristiques: 6 },
  { id: 'cartell-decoratiu', key: 'cartellDecoratiu', emoji: '🪧', preuUnitat: 15, preuPack: 12, packMinim: 5, destacat: false, numCaracteristiques: 6 },
] as const;

export const PUBLIC_MON_MAGIC_PACKS = [
  { id: 'pack-basic', key: 'basic', emoji: '📨', preuPack50: 450, preuPack80: 680, preuPack100: 800, estalviPercent: 10, destacat: false, numCaracteristiques: 5 },
  { id: 'pack-premium', key: 'premium', emoji: '🏆', preuPack50: 650, preuPack80: 950, preuPack100: 1100, estalviPercent: 15, destacat: true, numCaracteristiques: 6 },
] as const;

export const PUBLIC_MON_MAGIC_MULTI_STAMP_EXTRA = {
  preuExtra50: 75,
  preuExtra80: 100,
  preuExtra100: 120,
} as const;

export const PUBLIC_MON_MAGIC_QUANTITIES = [50, 80, 100] as const;
export const PUBLIC_MON_MAGIC_DEFAULT_QUANTITY: (typeof PUBLIC_MON_MAGIC_QUANTITIES)[number] = 80;

type MonMagicQuantity = (typeof PUBLIC_MON_MAGIC_QUANTITIES)[number];
type MonMagicPack = (typeof PUBLIC_MON_MAGIC_PACKS)[number];

const QUANTITY_PACK_KEY: Record<MonMagicQuantity, keyof Pick<MonMagicPack, 'preuPack50' | 'preuPack80' | 'preuPack100'>> = {
  50: 'preuPack50', 80: 'preuPack80', 100: 'preuPack100',
};
const QUANTITY_STAMP_KEY: Record<MonMagicQuantity, keyof typeof PUBLIC_MON_MAGIC_MULTI_STAMP_EXTRA> = {
  50: 'preuExtra50', 80: 'preuExtra80', 100: 'preuExtra100',
};

export function getMonMagicPackPrice(pack: MonMagicPack, qty: MonMagicQuantity): number {
  return pack[QUANTITY_PACK_KEY[qty]];
}

export function getMonMagicStampPrice(qty: MonMagicQuantity): number {
  return PUBLIC_MON_MAGIC_MULTI_STAMP_EXTRA[QUANTITY_STAMP_KEY[qty]];
}

export const PUBLIC_MON_MAGIC_FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

export const PUBLIC_MON_MAGIC_CANDLE_DATA = [
  { id: 0, left: '5%', delay: 2.3, duration: 5.1, size: 22 },
  { id: 1, left: '11%', delay: 0.8, duration: 4.3, size: 26 },
  { id: 2, left: '17%', delay: 4.1, duration: 5.8, size: 19 },
  { id: 3, left: '23%', delay: 1.5, duration: 4.7, size: 28 },
  { id: 4, left: '29%', delay: 3.2, duration: 5.4, size: 21 },
  { id: 5, left: '35%', delay: 0.3, duration: 4.1, size: 25 },
  { id: 6, left: '41%', delay: 2.9, duration: 5.6, size: 23 },
  { id: 7, left: '47%', delay: 1.1, duration: 4.5, size: 27 },
  { id: 8, left: '53%', delay: 4.5, duration: 5.2, size: 20 },
  { id: 9, left: '59%', delay: 0.6, duration: 4.9, size: 24 },
  { id: 10, left: '65%', delay: 3.7, duration: 5.0, size: 29 },
  { id: 11, left: '71%', delay: 1.8, duration: 4.2, size: 22 },
  { id: 12, left: '77%', delay: 2.5, duration: 5.5, size: 26 },
  { id: 13, left: '83%', delay: 0.9, duration: 4.8, size: 21 },
  { id: 14, left: '89%', delay: 3.4, duration: 5.3, size: 25 },
] as const;

export const PUBLIC_SENSORIAL_THEMES = [
  { id: 'calm', emoji: '🌙', category: 'natura', items: ['🌙', '⭐', '✨', '💫'], cursor: '🌙', colors: ['#a78bfa', '#818cf8'], bg: 'from-indigo-950 via-violet-950 to-black', sound: [130.81, 196.0, 261.63] },
  { id: 'ocean', emoji: '🌊', category: 'natura', items: ['🐚', '🐠', '🦀', '🐙', '🦑', '🐡', '🦐', '💎', '🫧'], cursor: '🐚', colors: ['#0ea5e9', '#06b6d4'], bg: 'from-cyan-950 via-blue-950 to-black', sound: [110, 164.81, 220] },
  { id: 'forest', emoji: '🌲', category: 'natura', items: ['🍃', '🌿', '🦋', '🐦', '🌸', '🍀', '🌺', '🐿️', '🦔'], cursor: '🍃', colors: ['#22c55e', '#10b981'], bg: 'from-emerald-950 via-green-950 to-black', sound: [146.83, 220, 293.66] },
  { id: 'sky', emoji: '☁️', category: 'natura', items: ['☁️', '🌤️', '🌈', '🦅', '🎈', '🪁', '🦜', '🕊️'], cursor: '☁️', colors: ['#38bdf8', '#7dd3fc'], bg: 'from-sky-950 via-blue-950 to-black', sound: [174.61, 220, 261.63] },
  { id: 'garden', emoji: '🌷', category: 'natura', items: ['🌷', '🌹', '🌻', '🌼', '💐', '🦋', '🐝', '🐞', '🌺'], cursor: '🌸', colors: ['#f472b6', '#fb7185'], bg: 'from-pink-950 via-rose-950 to-black', sound: [196, 246.94, 293.66] },
  { id: 'aurora', emoji: '🌌', category: 'natura', items: ['✨', '💫', '⭐', '🌟', '❄️', '🦌'], cursor: '✨', colors: ['#34d399', '#a78bfa', '#06b6d4'], bg: 'from-emerald-950 via-violet-950 to-black', sound: [130.81, 164.81, 196] },
  { id: 'fireflies', emoji: '✨', category: 'natura', items: ['✨', '💫', '🌙', '🦗', '🌾', '🍃'], cursor: '✨', colors: ['#fbbf24', '#f59e0b'], bg: 'from-amber-950 via-yellow-950 to-black', sound: [220, 277.18, 329.63] },
  { id: 'cosmos', emoji: '🚀', category: 'espai', items: ['🚀', '🛸', '🌍', '🌙', '⭐', '🪐', '☄️', '👽', '🛰️'], cursor: '🚀', colors: ['#8b5cf6', '#6366f1'], bg: 'from-violet-950 via-indigo-950 to-black', sound: [98, 130.81, 164.81] },
  { id: 'planets', emoji: '🪐', category: 'espai', items: ['🪐', '🌍', '🌕', '☀️', '🌑', '🌓', '🌗', '💫'], cursor: '🪐', colors: ['#f59e0b', '#d97706'], bg: 'from-orange-950 via-amber-950 to-black', sound: [65.41, 98, 130.81] },
  { id: 'aquarium', emoji: '🐠', category: 'animals', items: ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦐', '🦞', '🐢', '🦭'], cursor: '🐠', colors: ['#06b6d4', '#0891b2'], bg: 'from-cyan-950 via-teal-950 to-black', sound: [196, 246.94, 293.66] },
  { id: 'safari', emoji: '🦁', category: 'animals', items: ['🦁', '🐘', '🦒', '🦓', '🦛', '🐆', '🦏', '🐊', '🦩'], cursor: '🦁', colors: ['#d97706', '#b45309'], bg: 'from-amber-950 via-orange-950 to-black', sound: [130.81, 164.81, 196] },
  { id: 'pets', emoji: '🐱', category: 'animals', items: ['🐱', '🐶', '🐹', '🐰', '🐦', '🐢', '🐠', '🦜', '🐿️'], cursor: '🐾', colors: ['#fb923c', '#fdba74'], bg: 'from-orange-950 via-amber-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'dinosaurs', emoji: '🦕', category: 'animals', items: ['🦕', '🦖', '🥚', '🌋', '🌿', '🦴', '🪨'], cursor: '🦕', colors: ['#84cc16', '#65a30d'], bg: 'from-lime-950 via-green-950 to-black', sound: [65.41, 82.41, 98] },
  { id: 'unicorn', emoji: '🦄', category: 'fantasia', items: ['🦄', '🌈', '⭐', '💖', '🎀', '👑', '💎', '🌸', '✨'], cursor: '🦄', colors: ['#f472b6', '#c084fc', '#60a5fa'], bg: 'from-pink-950 via-purple-950 to-black', sound: [392, 493.88, 587.33] },
  { id: 'fairy', emoji: '🧚', category: 'fantasia', items: ['🧚', '🦋', '🌸', '✨', '🍄', '🌺', '💫', '🌙'], cursor: '🧚', colors: ['#a855f7', '#d946ef'], bg: 'from-purple-950 via-fuchsia-950 to-black', sound: [523.25, 659.25, 783.99] },
  { id: 'dragon', emoji: '🐉', category: 'fantasia', items: ['🐉', '🔥', '💎', '⚔️', '🏰', '👑', '🛡️', '🗡️'], cursor: '🐉', colors: ['#dc2626', '#f97316'], bg: 'from-red-950 via-orange-950 to-black', sound: [98, 116.54, 146.83] },
  { id: 'mermaid', emoji: '🧜', category: 'fantasia', items: ['🧜', '🐚', '💎', '🦪', '🌊', '✨', '👑', '🔱'], cursor: '🧜', colors: ['#06b6d4', '#8b5cf6'], bg: 'from-cyan-950 via-violet-950 to-black', sound: [293.66, 369.99, 440] },
  { id: 'candy', emoji: '🍭', category: 'menjar', items: ['🍭', '🍬', '🍫', '🧁', '🍩', '🍪', '🎂', '🍰', '🍦'], cursor: '🍭', colors: ['#f472b6', '#fb7185', '#fbbf24'], bg: 'from-pink-950 via-rose-950 to-black', sound: [523.25, 587.33, 659.25] },
  { id: 'fruits', emoji: '🍎', category: 'menjar', items: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍', '🥭'], cursor: '🍎', colors: ['#ef4444', '#f97316', '#eab308'], bg: 'from-red-950 via-orange-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'monmagic', emoji: '⚡', category: 'orbita', items: ['⚡', '🪄', '🦉', '📚', '🏰', '🧹', '🐍', '🦁', '🦅', '🦡', '⭐', '✨'], cursor: '🪄', colors: ['#fbbf24', '#7c3aed'], bg: 'from-amber-950 via-violet-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'halloween', emoji: '🎃', category: 'orbita', items: ['🎃', '👻', '🦇', '💀', '🕷️', '🕸️', '🧙', '🧛', '🌙', '🦴', '⚰️'], cursor: '🎃', colors: ['#f97316', '#7c2d12'], bg: 'from-orange-950 via-black to-black', sound: [146.83, 174.61, 220] },
  { id: 'christmas', emoji: '🎄', category: 'orbita', items: ['🎄', '🎅', '🎁', '⭐', '❄️', '☃️', '🦌', '🔔', '🎀', '🍪'], cursor: '🎄', colors: ['#dc2626', '#16a34a'], bg: 'from-red-950 via-green-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'tropical', emoji: '🌴', category: 'orbita', items: ['🌴', '🌺', '🍹', '🥥', '🦜', '🐠', '🌊', '☀️', '🏝️', '🦀'], cursor: '🌴', colors: ['#06b6d4', '#10b981'], bg: 'from-cyan-950 via-emerald-950 to-black', sound: [196, 246.94, 293.66] },
  { id: 'disco', emoji: '🪩', category: 'orbita', items: ['🪩', '💃', '🕺', '🎵', '🎤', '🎧', '💜', '💖', '✨', '🌟'], cursor: '🪩', colors: ['#ec4899', '#8b5cf6', '#06b6d4'], bg: 'from-fuchsia-950 via-violet-950 to-black', sound: [130.81, 164.81, 196] },
  { id: 'elegant', emoji: '✨', category: 'orbita', items: ['✨', '💎', '👑', '🥂', '🌹', '💫', '⭐', '🎀'], cursor: '💎', colors: ['#fbbf24', '#f59e0b'], bg: 'from-amber-950 via-yellow-950 to-black', sound: [220, 277.18, 329.63] },
  { id: 'carnival', emoji: '🎭', category: 'orbita', items: ['🎭', '🎪', '🎠', '🎡', '🎢', '🎨', '🎈', '🎉', '🤡'], cursor: '🎭', colors: ['#f43f5e', '#8b5cf6', '#fbbf24'], bg: 'from-rose-950 via-violet-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'zen', emoji: '🪷', category: 'zen', items: ['🪷', '🧘', '☯️', '🕯️', '🪨', '💧', '🌸'], cursor: '🪷', colors: ['#a3a3a3', '#737373'], bg: 'from-stone-950 via-neutral-950 to-black', sound: [174.61, 220, 261.63] },
  { id: 'rain', emoji: '🌧️', category: 'zen', items: ['💧', '🌧️', '☔', '🌈', '🍃', '🐸'], cursor: '💧', colors: ['#60a5fa', '#3b82f6'], bg: 'from-blue-950 via-black to-black', sound: [196, 233.08, 261.63] },
  { id: 'snow', emoji: '❄️', category: 'zen', items: ['❄️', '☃️', '🌨️', '⛄', '🏔️', '🎿'], cursor: '❄️', colors: ['#e0f2fe', '#bae6fd'], bg: 'from-sky-950 via-black to-black', sound: [293.66, 349.23, 392] },
] as const;

export const PUBLIC_SENSORIAL_CATEGORIES = [
  { id: 'natura', emoji: '🌿' },
  { id: 'espai', emoji: '🚀' },
  { id: 'animals', emoji: '🐾' },
  { id: 'fantasia', emoji: '✨' },
  { id: 'menjar', emoji: '🍭' },
  { id: 'orbita', emoji: '🎉' },
  { id: 'zen', emoji: '🧘' },
] as const;

export const LOGGER_LEVEL_EMOJI = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  debug: '🔍',
} as const;

export type AdminCoverageApiLocale = 'ca' | 'es' | 'en';

export const ADMIN_COVERAGE_API_MESSAGES: Record<AdminCoverageApiLocale, Record<string, string>> = {
  ca: {
    gettingAreas: 'Error obtenint àrees de cobertura',
    actionCityRequired: 'Action i city són obligatoris',
    provinceRequired: 'Province és obligatori per afegir',
    cityAlreadyExists: 'Aquesta ciutat ja existeix',
    invalidAction: 'Acció no vàlida',
    updated: 'Àrees de cobertura actualitzades correctament',
    updatingAreas: 'Error actualitzant àrees de cobertura',
    label: 'Àrees de cobertura',
    description: 'Ciutats i províncies on opera Òrbita Events',
  },
  es: {
    gettingAreas: 'Error obteniendo áreas de cobertura',
    actionCityRequired: 'Action y city son requeridos',
    provinceRequired: 'Province es requerido para añadir',
    cityAlreadyExists: 'Esta ciudad ya existe',
    invalidAction: 'Acción no válida',
    updated: 'Áreas de cobertura actualizadas correctamente',
    updatingAreas: 'Error actualizando áreas de cobertura',
    label: 'Áreas de Cobertura',
    description: 'Ciudades y provincias donde opera Òrbita Events',
  },
  en: {
    gettingAreas: 'Error fetching coverage areas',
    actionCityRequired: 'Action and city are required',
    provinceRequired: 'Province is required to add a city',
    cityAlreadyExists: 'This city already exists',
    invalidAction: 'Invalid action',
    updated: 'Coverage areas updated successfully',
    updatingAreas: 'Error updating coverage areas',
    label: 'Coverage Areas',
    description: 'Cities and provinces where Òrbita Events operates',
  },
};

export const WEATHER_DESCRIPTIONS_CA: Record<string, string> = {
  Clear: 'Cel serè',
  Clouds: 'Ennuvolat',
  Rain: 'Pluja',
  Drizzle: 'Plugim',
  Thunderstorm: 'Tempesta',
  Snow: 'Neu',
  Mist: 'Boira lleugera',
  Fog: 'Boira',
  Haze: 'Calitja',
  Dust: 'Pols',
  Sand: 'Sorra',
  Ash: 'Cendra volcànica',
  Squall: 'Ratxa de vent',
  Tornado: 'Tornado',
};

export const PUBLIC_BLOG_CATEGORY_COLORS: Record<string, string> = {
  bodas: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  eventos: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  consejos: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  tendencias: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  tecnologia: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  general: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};
export type PublicTestimonialApiLocale = 'ca' | 'es' | 'en';
export const PUBLIC_TESTIMONIAL_API_MESSAGES: Record<PublicTestimonialApiLocale, Record<string, string>> = {
  ca: {
    success: 'Valoraci+� enviada correctament',
    invalid: 'Dades no v+�lides',
    processing: 'Error processant la valoraci+�',
    fetching: 'Error carregant valoracions',
  },
  es: {
    success: 'Valoraci+�n enviada correctamente',
    invalid: 'Datos inv+�lidos',
    processing: 'Error procesando la valoraci+�n',
    fetching: 'Error cargando valoraciones',
  },
  en: {
    success: 'Testimonial submitted successfully',
    invalid: 'Invalid data',
    processing: 'Error processing testimonial',
    fetching: 'Error fetching testimonials',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LEAD SCORING
// ═══════════════════════════════════════════════════════════════════════════

export const LEAD_SCORING_STATUS_BASE: Record<string, number> = {
  NEW: 20,
  CONTACTED: 40,
  QUOTE_SENT: 60,
  NEGOTIATING: 72,
  WON: 95,
  LOST: 5,
};

export const LEAD_SCORING_STATUS_PROBABILITY: Record<string, number> = {
  NEW: 0.12,
  CONTACTED: 0.22,
  QUOTE_SENT: 0.38,
  NEGOTIATING: 0.57,
  WON: 0.95,
  LOST: 0.03,
};

export const EVENT_TYPE_DEFAULT_BUDGET: Record<string, number> = {
  WEDDING: 1800,
  CORPORATE: 1500,
  BIRTHDAY: 850,
  PRIVATE_PARTY: 900,
  COMMUNION: 700,
  BAPTISM: 650,
  GRADUATION: 800,
  ANNIVERSARY: 900,
  OTHER: 1000,
};

// ═══════════════════════════════════════════════════════════════════════════
// LEAD GUIDED FLOW
// ═══════════════════════════════════════════════════════════════════════════

export type LeadGuidedStep = {
  status: 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';
  label: string;
  icon: string;
  color: string;
  activeColor: string;
  doneColor: string;
};

export const LEAD_GUIDED_STEPS: LeadGuidedStep[] = [
  {
    status: 'NEW',
    label: 'Entrada nova',
    icon: '📥',
    color: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
    activeColor: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info border-2',
    doneColor: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
  },
  {
    status: 'CONTACTED',
    label: 'Contactat',
    icon: '📞',
    color: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
    activeColor: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning border-2',
    doneColor: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  },
  {
    status: 'QUOTE_SENT',
    label: 'Pressupost enviat',
    icon: '📄',
    color: 'admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral',
    activeColor: 'admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral border-2',
    doneColor: 'admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral',
  },
  {
    status: 'NEGOTIATING',
    label: 'Negociant',
    icon: '🤝',
    color: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
    activeColor: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning border-2',
    doneColor: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  },
  {
    status: 'WON',
    label: 'Guanyat!',
    icon: '🎉',
    color: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
    activeColor: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success border-2',
    doneColor: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
  },
];

export const LEAD_GUIDED_STATUS_ORDER: Array<'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON'> = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON'];

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER PRIORITY STYLES
// ═══════════════════════════════════════════════════════════════════════════

export const PRIORITY_FILTER_STYLES: Record<string, string> = {
  ALL: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  ALTA: 'border-rose-400/50 bg-rose-500/15 text-rose-200',
  MITJANA: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  BAIXA: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
};








