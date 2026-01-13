/**
 * CONFIGURACION CENTRALIZADA DE ORBITA EVENTS
 *
 * REGLA DE ORO: Todos los datos fijos del negocio viven aqui.
 * Si cambias el telefono, el email o cualquier dato de contacto,
 * solo lo cambias aqui. El resto se actualiza automaticamente.
 */

export const SITE_CONFIG = {
  // ============================================
  // INFORMACION DEL NEGOCIO
  // ============================================
  business: {
    name: 'Orbita Events',
    legalName: 'Orbita Events',
    cif: '',

    // Contacto principal (unificado)
    phone: '+34699121023',
    phoneDisplay: '+34 699 12 10 23',
    email: 'info@orbitaevents.com',

    // Direccion fisica (solo ciudad para privacidad)
    address: {
      street: '',
      city: 'Granollers',
      region: 'Barcelona, Catalunya',
      postalCode: '',
      country: 'Espana',
      countryCode: 'ES',
    },

    // Coordenadas GPS (para Google Maps)
    coordinates: {
      lat: 41.6077,
      lng: 2.2874,
    },

    // Horario de atencion
    schedule: {
      weekdays: 'Lunes a Viernes: 08:00 - 20:00',
      saturday: 'Sabado: 08:00 - 20:00',
      sunday: 'Domingo: 08:00 - 20:00',
      note: 'Eventos 24/7 previa reserva',
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

    // Texto alternativo cuando no hay resenas o API falla
    fallbackText: 'Nuevos en Google - se el primero en dejarnos una resena!',
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
  },

  // ============================================
  // WHATSAPP BUSINESS
  // ============================================
  whatsapp: {
    number: '+34699121023',
    numberDisplay: '+34 699 12 10 23',

    // Mensajes predefinidos por contexto
    messages: {
      general: 'Hola! Me interesa saber mas sobre vuestros servicios de eventos.',
      bodas: 'Hola! Me gustaria informacion sobre vuestros servicios para bodas.',
      discomovil: 'Hola! Estoy interesado en contratar una discomovil.',
      empresas: 'Hola! Necesito un presupuesto para un evento corporativo.',
      produccion: 'Hola! Me interesa una produccion tecnica completa.',
      fiestas: 'Hola! Quiero animar mi fiesta con vuestros servicios.',
      alquiler: 'Hola! Necesito alquilar equipamiento para un evento.',
      configurador: (packName: string, precio: number) =>
        `Hola! He configurado un pack "${packName}" (${precio} EUR). Podemos hablar sobre disponibilidad?`,
    },

    // Horario de respuesta automatica
    autoReplySchedule: {
      enabled: false,
      message: 'Gracias por contactarnos! Te responderemos en menos de 2 horas.',
      officeHours: 'Todos los dias de 08:00-20:00',
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
    logoWhite: '/logo-orbita-white.png',
    favicon: '/favicon.ico',
    ogImage: '/og-image.jpg',

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
      return Math.max(2, Math.floor(diffYears));
    })(),
    yearsLabel: 'Desde 2023',
    eventsCompleted: 50,
    happyClients: 50,
    citiesCovered: 2,
    recommendRate: 100,
    peoplesDancing: 5000,
    avgRating: 5.0,
    reviewCount: 50,
    responseTime: '2h',

    // Fecha de ultima actualizacion
    lastUpdated: '2025-12-08',
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
      id: process.env.NEXT_PUBLIC_GA_ID || '',
      enabled: !!process.env.NEXT_PUBLIC_GA_ID,
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
    blogEnabled: false,
  },
} as const;

// ============================================
// HELPERS Y UTILIDADES
// ============================================

/**
 * Genera URL de WhatsApp con mensaje predefinido
 */
export function getWhatsAppUrl(messageType: keyof typeof SITE_CONFIG.whatsapp.messages = 'general', customData?: any): string {
  const { number, messages } = SITE_CONFIG.whatsapp;

  let message: string;
  if (typeof messages[messageType] === 'function') {
    message = (messages[messageType] as Function)(customData?.packName, customData?.precio);
  } else {
    message = messages[messageType] as string;
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
export type SocialPlatform = keyof typeof SITE_CONFIG.social;
export type WhatsAppMessageType = keyof typeof SITE_CONFIG.whatsapp.messages;
