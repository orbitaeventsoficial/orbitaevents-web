/**
 * CONFIGURACIÓN CENTRALIZADA DE ÒRBITA EVENTS
 * 
 * REGLA DE ORO: Todos los datos fijos del negocio viven AQUÍ.
 * Si cambias el teléfono, el email, o cualquier dato de contacto,
 * SOLO lo cambias aquí. El resto se actualiza automáticamente.
 * 
 * @author Manolo - Arquitecto Digital
 */

export const SITE_CONFIG = {
  // ============================================
  // INFORMACIÓN DEL NEGOCIO
  // ============================================
  business: {
    name: "Òrbita Events",
    legalName: "Òrbita Events", // Para facturas y legal
    cif: "", // Disponible bajo petición

    // Contacto principal (UNIFICADO)
    phone: "+34699121023", // Número principal de venta
    phoneDisplay: "+34 699 12 10 23", // Para mostrar bonito
    email: "info@orbitaevents.com",

    // Dirección física (solo ciudad para privacidad)
    address: {
      street: "", // Disponible bajo petición
      city: "Granollers",
      region: "Barcelona, Catalunya",
      postalCode: "", // Disponible bajo petición
      country: "España",
      countryCode: "ES",
    },
    
    // Coordenadas GPS (para Google Maps)
    coordinates: {
      lat: 41.6077, // Granollers - Base de operaciones
      lng: 2.2874,
    },
    
    // Horario de atención
    schedule: {
      weekdays: "Lunes a Viernes: 08:00 - 20:00",
      saturday: "Sábado: 08:00 - 20:00",
      sunday: "Domingo: 08:00 - 20:00",
      note: "Eventos 24/7 previa reserva",
    },
  },

  // ============================================
  // RESEÑAS Y CREDIBILIDAD - DATOS DINÁMICOS DE GOOGLE
  // NO hardcodear - Se obtienen via API de Google Places
  // ============================================
  reviews: {
    // Google Place ID - CONFIGURA TU NEGOCIO AQUÍ
    googlePlaceId: process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "", // Ej: "ChIJN1t_tDeuEmsRUsoyG83frY4"

    // URL de Google Business para enlace directo a reseñas
    googleBusinessUrl: process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL || null,

    // URL directa para dejar reseña en Google (acortada de Google Maps)
    googleReviewUrl: 'https://g.page/r/CXcgbvANsXSzEBI/review',

    // URLs de reseñas por plataforma
    platforms: {
      google: process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL || null,
      facebook: null,
      bodas: null,
    },

    // Rating mínimo para mostrar testimonios (1-5)
    minRatingToShow: 5, // Solo mostrar reviews de 5 estrellas

    // Texto alternativo cuando no hay reseñas o API falla
    fallbackText: "Nuevos en Google - ¡Sé el primero en dejarnos una reseña!",
  },

  // ============================================
  // REDES SOCIALES
  // ============================================
  social: {
    instagram: {
      url: "https://www.instagram.com/orbitaeventsoficial/",
      handle: "@orbitaeventsoficial",
      enabled: true,
    },
    facebook: {
      url: "https://www.facebook.com/profile.php?id=61581625138500",
      handle: "Òrbita Events",
      enabled: true,
    },
    tiktok: {
      url: "https://www.tiktok.com/@orbitaeventsoficial",
      handle: "@orbitaeventsoficial",
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
    number: "+34699121023", // Sin espacios para enlaces
    numberDisplay: "+34 699 12 10 23",
    
    // Mensajes predefinidos por contexto
    messages: {
      // Mensaje genérico desde home
      general: "Hola! Me interesa saber más sobre vuestros servicios de eventos 🎉",
      
      // Mensajes específicos por servicio
      bodas: "Hola! Me gustaría información sobre vuestros servicios para bodas 💍",
      discomovil: "Hola! Estoy interesado en contratar una disco móvil 🎵",
      empresas: "Hola! Necesito un presupuesto para un evento corporativo 🎯",
      produccion: "Hola! Me interesa una producción técnica completa 🎬",
      fiestas: "Hola! Quiero animar mi fiesta con vuestros servicios 🎊",
      alquiler: "Hola! Necesito alquilar equipamiento para un evento 🎤",
      
      // Mensaje después de configurador
      configurador: (packName: string, precio: number) => 
        `Hola! He configurado un pack "${packName}" (${precio}€). ¿Podemos hablar sobre disponibilidad? 📅`,
    },
    
    // Horario de respuesta automática
    autoReplySchedule: {
      enabled: false, // Auto-respuestas deshabilitadas (respuesta manual preferida)
      message: "Gracias por contactarnos! Te responderemos en menos de 2 horas ⚡",
      officeHours: "Todos los dias de 08:00-20:00",
    },
  },

  // ============================================
  // CONFIGURACIÓN WEB
  // ============================================
  web: {
    domain: "orbitaevents.com",
    url: "https://orbitaevents.com",
    
    // URLs de assets
    logo: "/img/logoplanetatextdreta.svg",
    logoWhite: "/logo-orbita-white.png",
    favicon: "/favicon.ico",
    ogImage: "/og-image.jpg", // Imagen para compartir en RRSS
    
    // Colores de marca (para CSS variables)
    colors: {
      gold: "#DAA520",
      goldDark: "#B8860B",
      goldLight: "#FFD700",
    },
  },

  // ============================================
  // ESTADÍSTICAS DE NEGOCIO (Para marketing)
  // ⚠️ EMPRESA FUNDADA AGOST 2023 - 2+ anys d'experiència
  // ============================================
  stats: {
    // Calculado dinámicamente desde Agosto 2023
    yearsExperience: (() => {
      const fundingDate = new Date('2023-08-01');
      const now = new Date();
      const diffYears = (now.getTime() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return Math.max(2, Math.floor(diffYears)); // Des de 2023 = 2+ anys
    })(),
    yearsLabel: 'Des de 2023', // Per mostrar "Des de 2023" a la home
    eventsCompleted: 50, // ⚠️ CONSERVADOR - Si no tens número exacte, millor ser modest
    happyClients: 50,    // ⚠️ CONSERVADOR - Clients satisfets verificables
    citiesCovered: 2,     // Barcelona província, Girona província (Costa Brava)
    recommendRate: 100,   // 100% recomanació (verificable amb Lorena i Carles)
    peoplesDancing: 5000, // Estimació conservadora
    avgRating: 5.0,       // Lorena i Carles van donar 5 estrelles
    reviewCount: 1,       // De moment 1 review verificable (Lorena i Carles)
    responseTime: '2h',   // Temps de resposta promig

    // Fecha de última actualización (para control)
    lastUpdated: "2025-12-08",
  },

  // ============================================
  // LEGAL Y COMPLIANCE
  // ============================================
  legal: {
    privacyPolicyUrl: "/legal/privacidad",
    termsUrl: "/legal/terminos",
    cookiesPolicyUrl: "/legal/cookies",
    
    // Para RGPD
    dataController: "Òrbita Events S.L.",
    dataProtectionEmail: "info@orbitaevents.com",
  },

  // ============================================
  // ANALYTICS Y TRACKING
  // Configurado via variables de entorno en Vercel
  // ============================================
  tracking: {
    googleAnalytics: {
      // Se lee de NEXT_PUBLIC_GA_ID en el layout
      id: process.env.NEXT_PUBLIC_GA_ID || "",
      enabled: !!process.env.NEXT_PUBLIC_GA_ID,
    },
    facebookPixel: {
      id: process.env.NEXT_PUBLIC_FB_PIXEL_ID || "",
      enabled: !!process.env.NEXT_PUBLIC_FB_PIXEL_ID,
    },
    googleAds: {
      id: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "",
      enabled: !!process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
    },
  },

  // ============================================
  // FEATURES Y FUNCIONALIDADES
  // ============================================
  features: {
    // Sistema de reseñas (activar cuando tengas Google Places API configurado)
    reviewsEnabled: true,

    // Calendario de disponibilidad (conectado a /api/calendario)
    calendarEnabled: true,

    // Ofertas y promociones
    offersEnabled: true,

    // Chat en vivo
    liveChatEnabled: false,

    // Blog
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
 * Formatea número de teléfono para enlaces
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
 * Valida si una feature está activa
 */
export function isFeatureEnabled(feature: keyof typeof SITE_CONFIG.features): boolean {
  return SITE_CONFIG.features[feature];
}

// ============================================
// TIPOS EXPORTADOS
// ============================================
export type SocialPlatform = keyof typeof SITE_CONFIG.social;
export type WhatsAppMessageType = keyof typeof SITE_CONFIG.whatsapp.messages;
