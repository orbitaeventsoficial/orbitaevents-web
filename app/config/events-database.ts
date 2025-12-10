/**
 * BASE DE DATOS DE EVENTOS REALES - ÒRBITA EVENTS
 *
 * FILOSOFÍA: "Solo eventos que realmente hiciste. Si no hay, no se muestra."
 * - Este archivo es como un portfolio de eventos
 * - Cada evento que hagas, lo añades aquí
 * - Si no tienes eventos documentados aún, array vacío = no se muestra nada
 *
 * CÓMO AÑADIR UN EVENTO NUEVO:
 * 1. Copia el template de evento de abajo
 * 2. Rellena con datos reales del evento
 * 3. Sube fotos a /public/img/events/[id-evento]/
 * 4. ¡Listo! Se mostrará automáticamente en la web
 *
 * @author Manolo - Arquitecto Digital
 */

import type { Equipment as _Equipment } from './equipment-config';

// ============================================
// TIPOS
// ============================================

export interface Event {
  id: string; // Único: ej "evt-boda-maria-jordi-2024-06"
  date: string; // ISO format: "2024-06-15"
  type: 'wedding' | 'corporate' | 'birthday' | 'baptism' | 'private-party' | 'themed-party' | 'other';

  // CLIENTE (solo info que tengas permiso para publicar)
  client?: {
    name?: string; // Nombre completo (solo si tiene permiso)
    initials?: string; // Alternativa: "M&J" para bodas
    company?: string; // Si es corporativo y es público
  };

  // UBICACIÓN
  location: {
    city: string; // "Granollers", "Barcelona", etc
    venue?: string; // Nombre del local (solo si es público/popular)
    province: string; // "Barcelona", "Girona", etc
    postalCode?: string;
  };

  // DETALLES DEL EVENTO
  numberOfGuests: number; // Invitados reales
  durationHours: number; // Duración real del evento

  // PACK Y SERVICIOS USADOS
  packUsed: string; // ID del pack usado (de packs-config.ts)
  extrasUsed: string[]; // IDs de extras (de packs-config.ts)

  // EQUIPAMIENTO USADO (IDs de equipment-config.ts)
  equipment: {
    controllers?: string[];
    speakers?: string[];
    lighting?: string[];
    effects?: string[];
    accessories?: string[];
  };

  // TEMÁTICA (opcional)
  theme?: string; // "Halloween", "Món Màgic", "Años 80", etc

  // MULTIMEDIA
  media: {
    coverImage?: string; // Imagen principal del evento
    setupImages?: string[]; // Fotos del montaje
    eventImages?: string[]; // Fotos durante el evento
    crowdImages?: string[]; // Fotos de ambiente/gente bailando
    videos?: {
      highlights?: string; // URL video highlights (YouTube, Vimeo)
      testimonial?: string; // URL video testimonial del cliente
    };
  };

  // TESTIMONIO DEL CLIENTE (si lo tienes)
  testimonial?: {
    text: string;
    rating: 1 | 2 | 3 | 4 | 5;
    clientName: string;
    date: string;
    verified: boolean;
    showPublicly: boolean; // Permiso del cliente para publicar
  };

  // HIGHLIGHTS Y DETALLES ESPECIALES
  highlights?: string[]; // ["Primera boda temática Món Màgic", "200 invitados", etc]
  description?: string; // Descripción del evento

  // CONFIGURACIÓN
  featured: boolean; // Destacar en homepage
  showInPortfolio: boolean; // Mostrar en portfolio público
  clientConsent: boolean; // Permiso del cliente para publicar fotos/info

  // METADATA
  createdAt: string; // Fecha de creación de este registro
  updatedAt?: string; // Última actualización
}

// ============================================
// EVENTOS REALES
// ⚠️ Solo añadir aquí eventos que realmente hiciste
// ============================================

export const EVENTS: Event[] = [
  // ═══════════════════════════════════════════════════════════
  // TEMPLATE DE EVENTO - COPIA ESTO PARA AÑADIR EVENTOS NUEVOS
  // ═══════════════════════════════════════════════════════════
  // {
  //   id: "evt-boda-ejemplo-2024-11",
  //   date: "2024-11-15",
  //   type: "wedding",
  //
  //   client: {
  //     initials: "M&J",
  //     name: "María y Jordi" // Solo si tienen permiso
  //   },
  //
  //   location: {
  //     city: "Granollers",
  //     venue: "Masía Can Sala", // Solo si es público
  //     province: "Barcelona"
  //   },
  //
  //   numberOfGuests: 120,
  //   durationHours: 6,
  //
  //   packUsed: "wedding-signature",
  //   extrasUsed: ["humo-bajo", "chispas-frias"],
  //
  //   equipment: {
  //     controllers: ["ddj-rev7"],
  //     speakers: ["ev-etx-12p"],
  //     lighting: ["focos-bash-led", "cabezas-moviles-led"],
  //     effects: ["maquina-humo", "maquina-humo-bajo"],
  //   },
  //
  //   media: {
  //     coverImage: "/img/events/evt-boda-ejemplo-2024-11/cover.jpg",
  //     setupImages: [
  //       "/img/events/evt-boda-ejemplo-2024-11/setup-1.jpg",
  //       "/img/events/evt-boda-ejemplo-2024-11/setup-2.jpg"
  //     ],
  //     eventImages: [
  //       "/img/events/evt-boda-ejemplo-2024-11/event-1.jpg",
  //       "/img/events/evt-boda-ejemplo-2024-11/event-2.jpg"
  //     ],
  //   },
  //
  //   testimonial: {
  //     text: "Òrbita Events hizo de nuestra boda un día inolvidable. ¡Todo perfecto!",
  //     rating: 5,
  //     clientName: "María y Jordi",
  //     date: "2024-11-16",
  //     verified: true,
  //     showPublicly: true
  //   },
  //
  //   highlights: [
  //     "Boda de 120 invitados",
  //     "Efectos de humo bajo para primer baile",
  //     "Iluminación LED personalizada",
  //   ],
  //
  //   description: "Boda espectacular en Granollers con más de 120 invitados. Montaje completo con iluminación LED y efectos especiales.",
  //
  //   featured: true,
  //   showInPortfolio: true,
  //   clientConsent: true,
  //
  //   createdAt: "2024-11-27",
  // },

  // ═══════════════════════════════════════════════════════════
  // AQUÍ AÑADE TUS EVENTOS REALES
  // ═══════════════════════════════════════════════════════════

  // TODO: CARLES - Añade aquí los eventos reales que hayas hecho
  // Por ahora está vacío = no se muestra nada en la web (correcto)
];

// ============================================
// HELPERS - FUNCIONES PARA OBTENER EVENTOS
// ============================================

/**
 * Obtener todos los eventos visibles en portfolio
 */
export function getPublicEvents(): Event[] {
  return EVENTS.filter(e => e.showInPortfolio && e.clientConsent);
}

/**
 * Obtener eventos destacados (featured)
 */
export function getFeaturedEvents(limit?: number): Event[] {
  const featured = EVENTS.filter(e => e.featured && e.showInPortfolio && e.clientConsent);

  if (limit) {
    return featured.slice(0, limit);
  }

  return featured;
}

/**
 * Obtener eventos por tipo
 */
export function getEventsByType(type: Event['type']): Event[] {
  return EVENTS.filter(e => e.type === type && e.showInPortfolio && e.clientConsent);
}

/**
 * Obtener eventos más recientes
 */
export function getRecentEvents(limit: number = 6): Event[] {
  const publicEvents = getPublicEvents();

  return publicEvents
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

/**
 * Obtener evento por ID
 */
export function getEventById(id: string): Event | undefined {
  return EVENTS.find(e => e.id === id);
}

/**
 * Obtener eventos con testimonios
 */
export function getEventsWithTestimonials(): Event[] {
  return EVENTS.filter(e =>
    e.testimonial &&
    e.testimonial.showPublicly &&
    e.showInPortfolio &&
    e.clientConsent
  );
}

/**
 * Obtener testimonios de eventos (para sección de testimonios)
 */
export function getEventTestimonials() {
  const eventsWithTestimonials = getEventsWithTestimonials();

  return eventsWithTestimonials.map(event => ({
    ...event.testimonial,
    eventType: event.type,
    eventDate: event.date,
    eventId: event.id,
    eventLocation: event.location.city,
  }));
}

/**
 * Obtener eventos por ciudad
 */
export function getEventsByCity(city: string): Event[] {
  return EVENTS.filter(e =>
    e.location.city.toLowerCase() === city.toLowerCase() &&
    e.showInPortfolio &&
    e.clientConsent
  );
}

/**
 * Obtener eventos por temática
 */
export function getEventsByTheme(theme: string): Event[] {
  return EVENTS.filter(e =>
    e.theme?.toLowerCase().includes(theme.toLowerCase()) &&
    e.showInPortfolio &&
    e.clientConsent
  );
}

/**
 * Contar total de eventos realizados
 */
export function getTotalEventsCount(): number {
  return EVENTS.length;
}

/**
 * Contar total de invitados en todos los eventos
 */
export function getTotalGuestsCount(): number {
  return EVENTS.reduce((total, event) => total + event.numberOfGuests, 0);
}

/**
 * Contar total de horas de eventos
 */
export function getTotalHoursCount(): number {
  return EVENTS.reduce((total, event) => total + event.durationHours, 0);
}

/**
 * Obtener ciudades donde se han hecho eventos
 */
export function getEventCities(): string[] {
  const cities = EVENTS.map(e => e.location.city);
  return [...new Set(cities)].sort(); // Únicas y ordenadas
}

/**
 * Obtener estadísticas de eventos (para mostrar en web)
 */
export function getEventsStats() {
  if (EVENTS.length === 0) {
    return null; // Si no hay eventos, retornar null
  }

  return {
    totalEvents: getTotalEventsCount(),
    totalGuests: getTotalGuestsCount(),
    totalHours: getTotalHoursCount(),
    cities: getEventCities(),
    byType: {
      weddings: getEventsByType('wedding').length,
      corporate: getEventsByType('corporate').length,
      birthdays: getEventsByType('birthday').length,
      baptisms: getEventsByType('baptism').length,
      privateparties: getEventsByType('private-party').length,
      themed: getEventsByType('themed-party').length,
      other: getEventsByType('other').length,
    },
    avgGuests: Math.round(getTotalGuestsCount() / getTotalEventsCount()),
    avgDuration: Math.round((getTotalHoursCount() / getTotalEventsCount()) * 10) / 10,
  };
}

/**
 * Validar eventos (detectar errores en configuración)
 */
export function validateEvents(): string[] {
  const errors: string[] = [];

  EVENTS.forEach(event => {
    if (!event.id) errors.push(`Evento sin ID`);
    if (!event.date) errors.push(`Evento ${event.id}: sin fecha`);
    if (!event.type) errors.push(`Evento ${event.id}: sin tipo`);
    if (event.numberOfGuests <= 0) errors.push(`Evento ${event.id}: número de invitados inválido`);

    // Si se muestra en portfolio pero no hay permiso del cliente
    if (event.showInPortfolio && !event.clientConsent) {
      errors.push(`Evento ${event.id}: marcado para portfolio pero sin consentimiento del cliente`);
    }

    // Si tiene testimonial pero no permiso para mostrarlo
    if (event.testimonial && !event.testimonial.showPublicly && event.showInPortfolio) {
      errors.push(`Evento ${event.id}: testimonial sin permiso para mostrar públicamente`);
    }
  });

  return errors;
}

/**
 * Verifica si hay eventos disponibles para mostrar
 * Útil para ocultar secciones si no hay data
 */
export function hasEvents(): boolean {
  return getPublicEvents().length > 0;
}

// ============================================
// EXPORTS
// ============================================

export default EVENTS;
