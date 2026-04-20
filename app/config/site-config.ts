import googleReviewsData from '../../public/data/google-reviews.json';
import { getSiteLocalizedText, getSitePublicCopy } from '@/lib/site-public-copy';

/**
 * CONFIGURACIÓ CENTRALITZADA D'ÒRBITA EVENTS
 *
 * REGLA D'OR: Totes les dades fixes del negoci viuen aquí.
 * Si canvies el telèfon, l'email o qualsevol dada de contacte,
 * només ho canvies aquí. La resta s'actualitza automàticament.
 */

const sitePublicCopy = getSitePublicCopy('ca');
const siteWhatsappMessages = sitePublicCopy.whatsappMessages || {};
const siteGoogleReviewsFallback = sitePublicCopy.googleReviews?.fallback?.description || '';
const siteContactAutoReplyMessage = sitePublicCopy.contact?.success?.message || sitePublicCopy.contact?.responseTime || '';
const siteScheduleCopy = sitePublicCopy.siteConfig?.schedule || {};
const siteStatsCopy = sitePublicCopy.siteConfig?.stats || {};
const siteStatsResponseTime = siteStatsCopy.responseTime || '';
export const SITE_CONFIG = {
  // ============================================
  // INFORMACION DEL NEGOCIO
  // ============================================
  business: {
    name: 'Òrbita Events',
    legalName: 'Òrbita Events',
    cif: '',

    // Contacto principal (unificado)
    phone: '+34699121023',
    phoneDisplay: '+34 699 12 10 23',
    email: 'info@orbitaevents.com',

    // Direccion fisica (solo ciudad para privacidad)
    address: {
      street: 'Granollers',
      city: 'Granollers',
      region: 'Barcelona',
      postalCode: '08400',
      country: 'ES',
      countryCode: 'ES',
    },

    // Coordenadas GPS (para Google Maps)
    coordinates: {
      lat: 41.6077,
      lng: 2.2874,
    },

    // Horari d'atenció (display strings)
    schedule: {
      weekdays: siteScheduleCopy.weekdays || '',
      saturday: siteScheduleCopy.saturday || '',
      sunday: siteScheduleCopy.sunday || '',
      note: siteScheduleCopy.note || '',
    },

    // Horari en format ISO (per Schema.org openingHoursSpecification)
    hours: {
      weekdays: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '20:00' },
    },
  },

  // ============================================
  // RESENAS Y CREDIBILIDAD
  // ============================================
  reviews: {
    // Google Place ID
    googlePlaceId: process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || '',

    // URL de Google Business
    googleBusinessUrl: process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL || null,

    // URL directa para dejar resena en Google
    googleReviewUrl: 'https://g.page/r/CXcgbvANsXSzEAE/review',

    platforms: {
      google: process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL || null,
      bodas: null,
    },

    // Rating minimo para mostrar testimonios (1-5)
    minRatingToShow: 5,

    // Text alternatiu quan no hi ha ressenyes o falla l'API
    fallbackText: siteGoogleReviewsFallback,
  },

  // ============================================
  // REDES SOCIALES
  // ============================================
  social: {
    instagram: {
      url: 'https://www.instagram.com/orbitaeventsoficial/',
      handle: '@orbitaeventsoficial',
      enabled: true,
    },
    tiktok: {
      url: 'https://www.tiktok.com/@orbitaeventsoficial',
      handle: '@orbitaeventsoficial',
      enabled: true,
    },
    youtube: {
      url: null,
      enabled: false,
    },
    linkedin: {
      url: null,
      enabled: false,
    },

    // URLs canòniques per JSON-LD sameAs
    urls: {
      instagram: 'https://www.instagram.com/orbitaeventsoficial/',
      tiktok: 'https://www.tiktok.com/@orbitaeventsoficial',
      google: 'https://g.page/orbitaevents',
    },
  },

  // ============================================
  // WHATSAPP BUSINESS
  // ============================================
  whatsapp: {
    number: '+34699121023',
    numberDisplay: '+34 699 12 10 23',

    // Missatges predefinits per context
    messages: {
      general: siteWhatsappMessages.general || '',
      bodas: siteWhatsappMessages.bodas || '',
      discomovil: siteWhatsappMessages.discomovil || '',
      empresas: siteWhatsappMessages.empresas || '',
      produccion: siteWhatsappMessages.produccion || '',
      fiestas: siteWhatsappMessages.fiestas || '',
      alquiler: siteWhatsappMessages.alquiler || '',
      configurador: (packName: string, precio: number) => {
        const base = siteWhatsappMessages.configurador || '';
        const details = packName ? ` (${packName}${typeof precio === 'number' ? ` · ${precio} EUR` : ''})` : '';
        return `${base}${details}`.trim();
      },
    },

    // Horari de resposta automàtica
    autoReplySchedule: {
      enabled: false,
      message: siteContactAutoReplyMessage,
      officeHours: siteScheduleCopy.officeHours || '',
    },
  },

  // ============================================
  // CONFIGURACION WEB
  // ============================================
  web: {
    domain: 'orbitaevents.com',
    url: 'https://orbitaevents.com',

    // URLs de assets
    logo: '/img/logoplanetatextdreta.svg',
    favicon: '/favicon.svg',
    appleTouchIcon: '/apple-touch-icon.png',
    ogImage: '/og-default.jpg',

    // Colores de marca
    colors: {
      gold: '#DAA520',
      goldDark: '#B8860B',
      goldLight: '#FFD700',
    },
  },

  // ============================================
  // ESTADISTICAS DE NEGOCIO
  // ============================================
  stats: {
    yearsExperience: (() => {
      const fundingDate = new Date('2023-08-01');
      const now = new Date();
      const diffYears = (now.getTime() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return Math.max(3, Math.floor(diffYears));
    })(),
    yearsLabel: siteStatsCopy.yearsLabel || '',
    eventsCompleted: 50,
    happyClients: 50,
    citiesCovered: 2,
    recommendRate: 100,
    peoplesDancing: 5000,
    avgRating: googleReviewsData.rating || 5.0,
    reviewCount: googleReviewsData.total || 0,
    responseTime: siteStatsResponseTime,

    // S'actualitza automàticament des de public/data/google-reviews.json
    lastUpdated: googleReviewsData.lastUpdated?.split('T')[0] || new Date().toISOString().split('T')[0],
  },

  // ============================================
  // LEGAL Y COMPLIANCE
  // ============================================
  legal: {
    privacyPolicyUrl: '/legal/privacidad',
    termsUrl: '/legal/terminos',
    cookiesPolicyUrl: '/legal/cookies',

    dataController: 'Orbita Events S.L.',
    dataProtectionEmail: 'info@orbitaevents.com',
  },

  // ============================================
  // ANALYTICS Y TRACKING
  // ============================================
  tracking: {
    googleAnalytics: {
      id: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || '',
      enabled: !!(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID),
    },
    googleAds: {
      id: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '',
      enabled: !!process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
    },
  },

  // ============================================
  // FEATURES
  // ============================================
  features: {
    reviewsEnabled: true,
    calendarEnabled: true,
    offersEnabled: true,
    liveChatEnabled: false,
    blogEnabled: true,
  },
} as const;

// ============================================
// HELPERS Y UTILIDADES
// ============================================

/**
 * Genera URL de WhatsApp con mensaje predefinido
 */
type WhatsAppMessageData = { packName?: string; precio?: number };

export function getWhatsAppUrl(messageType: keyof typeof SITE_CONFIG.whatsapp.messages = 'general', customData?: WhatsAppMessageData): string {
  return getLocalizedWhatsAppUrl('ca', messageType, customData);
}

export function getLocalizedWhatsAppUrl(
  locale: string,
  messageType: keyof typeof SITE_CONFIG.whatsapp.messages = 'general',
  customData?: WhatsAppMessageData,
): string {
  const { number, messages } = SITE_CONFIG.whatsapp;

  let message: string;
  if (messageType === 'configurador') {
    const base = getSiteLocalizedText('whatsappMessages.configurador', locale);
    const details = customData?.packName
      ? ` (${customData.packName}${typeof customData?.precio === 'number' ? ` · ${customData.precio} EUR` : ''})`
      : '';
    message = `${base}${details}`.trim();
  } else if (typeof messages[messageType] === 'function') {
    message = (messages[messageType] as Function)(customData?.packName, customData?.precio);
  } else {
    message = getSiteLocalizedText(`whatsappMessages.${messageType}`, locale) || (messages[messageType] as string);
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${number.replace(/\+/g, '')}?text=${encodedMessage}`;
}
/**
 * Formatea numero de telefono para enlaces
 */
export function getPhoneLink(): string {
  return `tel:${SITE_CONFIG.business.phone}`;
}

/**
 * Formatea email para enlaces
 */
export function getEmailLink(subject?: string): string {
  const email = SITE_CONFIG.business.email;
  if (subject) {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  }
  return `mailto:${email}`;
}

/**
 * Obtiene URL de Google Maps
 */
export function getGoogleMapsUrl(): string {
  const { lat, lng } = SITE_CONFIG.business.coordinates;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Valida si una feature esta activa
 */
export function isFeatureEnabled(feature: keyof typeof SITE_CONFIG.features): boolean {
  return SITE_CONFIG.features[feature];
}

// ============================================
// TIPOS EXPORTADOS
// ============================================
type SocialPlatform = keyof typeof SITE_CONFIG.social;
type WhatsAppMessageType = keyof typeof SITE_CONFIG.whatsapp.messages;













