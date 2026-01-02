/**
 * SISTEMA DE TESTIMONIOS AUTOMÁTICO - ÒRBITA EVENTS
 *
 * FILOSOFÍA: "Si no hay reviews, no se muestra nada. CERO inventos."
 * - Las reviews se obtienen automáticamente de Google Reviews API
 * - Solo se muestran reviews de 5 estrellas (configuración en site-config.ts)
 * - Si Google Reviews no está disponible, no se muestra la sección
 * - Si tienes reviews manuales (email, WhatsApp), añádelas al array MANUAL_TESTIMONIALS
 *
 * SISTEMA AUTO-ACTUALIZABLE:
 * - Fetch automático desde Google Reviews cada X horas (cache)
 * - Filtrado automático por rating mínimo
 * - Ordenación por fecha (más recientes primero)
 *
 * @author Manolo - Arquitecto Digital
 */

import { SITE_CONFIG } from './site-config';

// ============================================
// TIPOS
// ============================================

export interface Testimonial {
  id: string;
  clientName: string;
  clientInitials?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  date: string; // ISO date
  eventType?: 'wedding' | 'corporate' | 'birthday' | 'baptism' | 'private-party' | 'other';
  location?: string; // Ciudad del evento

  source: {
    platform: 'google' | 'facebook' | 'email' | 'whatsapp' | 'direct';
    url?: string; // Link a la review original (si existe)
    verified: boolean;
    profilePhoto?: string; // URL de foto de perfil (Google Reviews)
  };

  featured?: boolean; // Destacar en homepage
  showOnWebsite?: boolean; // Ocultar si el cliente no da permiso
}

// ============================================
// TESTIMONIOS MANUALES
// Solo añadir aquí si tienes testimonios REALES de clientes
// por email, WhatsApp o en persona (CON SU PERMISO)
// ============================================

export const MANUAL_TESTIMONIALS: Testimonial[] = [
  // ⚠️ EJEMPLO - ELIMINAR cuando tengas testimonios reales
  // {
  //   id: "manual-001",
  //   clientName: "María Rodríguez",
  //   clientInitials: "M.R.",
  //   rating: 5,
  //   text: "Increíble experiencia con Òrbita Events. Todo fue perfecto desde el primer contacto.",
  //   date: "2024-11-15",
  //   eventType: "wedding",
  //   location: "Granollers",
  //   source: {
  //     platform: "whatsapp",
  //     verified: true,
  //   },
  //   featured: true,
  //   showOnWebsite: true,
  // },

  // Array vacío - los testimonios se obtienen desde Google Reviews API
];

// ============================================
// FETCH DE GOOGLE REVIEWS
// ============================================

/**
 * Obtiene reviews desde Google Reviews API
 * Si Google Reviews no está configurado o falla, retorna array vacío
 */
export async function fetchGoogleReviews(): Promise<Testimonial[]> {
  // Si Google Reviews no está habilitado, retornar vacío
  if (!SITE_CONFIG.features.reviewsEnabled) {
    return [];
  }

  try {
    const response = await fetch('/api/google-reviews', {
      next: { revalidate: 3600 } // Cache 1 hora
    });

    if (!response.ok) {
      console.warn('Google Reviews API failed:', response.status);
      return [];
    }

    const data = await response.json();

    // Si no hay reviews, retornar vacío
    if (!data.reviews || data.reviews.length === 0) {
      return [];
    }

    // Transformar reviews de Google al formato de Testimonial
    const googleReviews: Testimonial[] = data.reviews.map((review: any, index: number) => ({
      id: `google-${review.time || index}`,
      clientName: review.author_name,
      rating: review.rating,
      text: review.text,
      date: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString(),
      source: {
        platform: 'google',
        url: review.author_url,
        verified: true,
        profilePhoto: review.profile_photo_url,
      },
      showOnWebsite: true,
    }));

    // Filtrar solo reviews con rating mínimo (configurado en site-config.ts)
    const minRating = SITE_CONFIG.reviews.minRatingToShow || 5;
    const filteredReviews = googleReviews.filter(review => review.rating >= minRating);

    return filteredReviews;

  } catch (error) {
    console.warn('Error fetching Google Reviews:', error);
    return [];
  }
}

/**
 * Obtiene TODOS los testimonios (Google + Manuales)
 * IMPORTANTE: Si no hay ninguno, retorna array vacío (no inventar nada)
 */
export async function getAllTestimonials(): Promise<Testimonial[]> {
  const googleReviews = await fetchGoogleReviews();
  const allTestimonials = [...googleReviews, ...MANUAL_TESTIMONIALS];

  // Filtrar solo los que deben mostrarse en web
  const visibleTestimonials = allTestimonials.filter(t => t.showOnWebsite !== false);

  // Ordenar por fecha (más recientes primero)
  return visibleTestimonials.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Obtiene solo testimonios destacados (featured)
 */
export async function getFeaturedTestimonials(limit?: number): Promise<Testimonial[]> {
  const allTestimonials = await getAllTestimonials();
  const featured = allTestimonials.filter(t => t.featured === true);

  if (limit) {
    return featured.slice(0, limit);
  }

  return featured;
}

/**
 * Obtiene testimonios por tipo de evento
 */
export async function getTestimonialsByEventType(eventType: Testimonial['eventType']): Promise<Testimonial[]> {
  const allTestimonials = await getAllTestimonials();
  return allTestimonials.filter(t => t.eventType === eventType);
}

/**
 * Obtiene testimonios por rating mínimo
 */
export async function getTestimonialsByMinRating(minRating: number): Promise<Testimonial[]> {
  const allTestimonials = await getAllTestimonials();
  return allTestimonials.filter(t => t.rating >= minRating);
}

/**
 * Calcula el rating promedio de todos los testimonios
 */
export async function getAverageRating(): Promise<number> {
  const allTestimonials = await getAllTestimonials();

  if (allTestimonials.length === 0) {
    return 0; // Si no hay testimonios, retornar 0
  }

  const totalRating = allTestimonials.reduce((sum, t) => sum + t.rating, 0);
  const average = totalRating / allTestimonials.length;

  return Math.round(average * 10) / 10; // Redondear a 1 decimal
}

/**
 * Cuenta total de reviews
 */
export async function getTotalReviewsCount(): Promise<number> {
  const allTestimonials = await getAllTestimonials();
  return allTestimonials.length;
}

/**
 * Verifica si hay testimonios disponibles para mostrar
 * Útil para ocultar secciones si no hay data
 */
export async function hasTestimonials(): Promise<boolean> {
  const allTestimonials = await getAllTestimonials();
  return allTestimonials.length > 0;
}

/**
 * Obtiene estadísticas de testimonios (para mostrar en web)
 */
export async function getTestimonialsStats() {
  const allTestimonials = await getAllTestimonials();

  if (allTestimonials.length === 0) {
    return null; // Si no hay testimonios, retornar null
  }

  const avgRating = await getAverageRating();
  const totalCount = allTestimonials.length;

  // Contar por rating
  const ratingDistribution = {
    5: allTestimonials.filter(t => t.rating === 5).length,
    4: allTestimonials.filter(t => t.rating === 4).length,
    3: allTestimonials.filter(t => t.rating === 3).length,
    2: allTestimonials.filter(t => t.rating === 2).length,
    1: allTestimonials.filter(t => t.rating === 1).length,
  };

  // Contar por plataforma
  const platformDistribution = {
    google: allTestimonials.filter(t => t.source.platform === 'google').length,
    facebook: allTestimonials.filter(t => t.source.platform === 'facebook').length,
    email: allTestimonials.filter(t => t.source.platform === 'email').length,
    whatsapp: allTestimonials.filter(t => t.source.platform === 'whatsapp').length,
    direct: allTestimonials.filter(t => t.source.platform === 'direct').length,
  };

  return {
    avgRating,
    totalCount,
    ratingDistribution,
    platformDistribution,
    verifiedCount: allTestimonials.filter(t => t.source.verified).length,
  };
}

// ============================================
// EXPORTS
// ============================================

const testimonialsConfig = {
  getAllTestimonials,
  getFeaturedTestimonials,
  getTestimonialsByEventType,
  getTestimonialsByMinRating,
  getAverageRating,
  getTotalReviewsCount,
  hasTestimonials,
  getTestimonialsStats,
};

export default testimonialsConfig;
