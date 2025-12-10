/**
 * CANVAS SERVICE
 * Òrbita Events - Ecosistema CRM
 *
 * Generació d'imatges de testimonis per compartir a xarxes socials
 *
 * Utilitza @vercel/og per generar imatges a Vercel Edge Runtime
 * Compatible amb Instagram stories (1080x1920) i posts (1080x1080)
 */

import { getFirstName, getInitials } from '@/lib/utils/normalize';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  logoUrl?: string;
}

export interface TestimonialCanvasData {
  customerName: string;
  text: string;
  rating: number;
  eventType?: string;
  discountCode: string;
  discountPercent: number;
}

// Presets per diferents xarxes socials
export const CANVAS_PRESETS = {
  instagramStory: {
    width: 1080,
    height: 1920,
    backgroundColor: '#0a0a0a',
    accentColor: '#f97316', // orange-500
    textColor: '#ffffff',
  },
  instagramPost: {
    width: 1080,
    height: 1080,
    backgroundColor: '#0a0a0a',
    accentColor: '#f97316',
    textColor: '#ffffff',
  },
  facebookPost: {
    width: 1200,
    height: 630,
    backgroundColor: '#0a0a0a',
    accentColor: '#f97316',
    textColor: '#ffffff',
  },
} satisfies Record<string, CanvasConfig>;

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONS PRINCIPALS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera l'HTML per al canvas de testimoni
 * Aquest HTML s'utilitzarà amb @vercel/og per generar la imatge
 */
export function generateTestimonialCanvasHTML(
  data: TestimonialCanvasData,
  config: CanvasConfig = CANVAS_PRESETS.instagramStory
): string {
  const { customerName, text, rating, discountCode, discountPercent } = data;
  const { backgroundColor, accentColor, textColor } = config;

  const firstName = getFirstName(customerName);
  const initials = getInitials(customerName);

  // Truncar text si és massa llarg
  const maxTextLength = config.height > 1200 ? 300 : 150;
  const truncatedText = text.length > maxTextLength
    ? text.slice(0, maxTextLength) + '...'
    : text;

  // Generar estrelles
  const stars = Array(5)
    .fill(null)
    .map((_, i) => (i < rating ? '★' : '☆'))
    .join('');

  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: ${config.width}px;
      height: ${config.height}px;
      background: linear-gradient(180deg, ${backgroundColor} 0%, #1a1a1a 100%);
      padding: 60px;
      font-family: 'Inter', sans-serif;
    ">
      <!-- Logo -->
      <div style="
        display: flex;
        align-items: center;
        margin-bottom: 40px;
      ">
        <span style="
          font-size: 48px;
          font-weight: 800;
          color: ${textColor};
        ">ÒRBITA</span>
        <span style="
          font-size: 48px;
          font-weight: 300;
          color: ${accentColor};
          margin-left: 12px;
        ">EVENTS</span>
      </div>

      <!-- Avatar / Inicials -->
      <div style="
        width: 120px;
        height: 120px;
        border-radius: 60px;
        background: ${accentColor};
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30px;
      ">
        <span style="
          font-size: 48px;
          font-weight: 700;
          color: ${textColor};
        ">${initials}</span>
      </div>

      <!-- Nom -->
      <div style="
        font-size: 36px;
        font-weight: 600;
        color: ${textColor};
        margin-bottom: 20px;
      ">${firstName}</div>

      <!-- Estrelles -->
      <div style="
        font-size: 40px;
        color: ${accentColor};
        margin-bottom: 40px;
        letter-spacing: 8px;
      ">${stars}</div>

      <!-- Testimoni -->
      <div style="
        font-size: 28px;
        color: ${textColor};
        text-align: center;
        line-height: 1.6;
        max-width: 90%;
        margin-bottom: 60px;
        font-style: italic;
      ">"${truncatedText}"</div>

      <!-- Separador -->
      <div style="
        width: 100px;
        height: 4px;
        background: ${accentColor};
        margin-bottom: 60px;
      "></div>

      <!-- Codi de descompte -->
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(249, 115, 22, 0.1);
        border: 2px solid ${accentColor};
        border-radius: 20px;
        padding: 30px 50px;
      ">
        <span style="
          font-size: 24px;
          color: ${textColor};
          margin-bottom: 10px;
        ">El teu codi de descompte</span>
        <span style="
          font-size: 48px;
          font-weight: 800;
          color: ${accentColor};
          letter-spacing: 4px;
        ">${discountCode}</span>
        <span style="
          font-size: 32px;
          font-weight: 700;
          color: ${textColor};
          margin-top: 10px;
        ">${discountPercent}% OFF</span>
      </div>

      <!-- Footer -->
      <div style="
        position: absolute;
        bottom: 40px;
        font-size: 20px;
        color: rgba(255, 255, 255, 0.5);
      ">www.orbitaevents.com</div>
    </div>
  `;
}

/**
 * Genera els paràmetres per a la ruta API de generació d'imatge
 */
export function generateCanvasApiParams(
  data: TestimonialCanvasData,
  preset: keyof typeof CANVAS_PRESETS = 'instagramStory'
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('name', data.customerName);
  params.set('text', data.text);
  params.set('rating', data.rating.toString());
  params.set('code', data.discountCode);
  params.set('discount', data.discountPercent.toString());
  params.set('preset', preset);
  if (data.eventType) {
    params.set('eventType', data.eventType);
  }
  return params;
}

/**
 * Genera la URL de l'API per obtenir la imatge
 */
export function getCanvasImageUrl(
  baseUrl: string,
  data: TestimonialCanvasData,
  preset: keyof typeof CANVAS_PRESETS = 'instagramStory'
): string {
  const params = generateCanvasApiParams(data, preset);
  return `${baseUrl}/api/canvas/testimonial?${params.toString()}`;
}

/**
 * Tradueix tipus d'event per mostrar al canvas
 */
export function translateEventType(eventType?: string): string {
  const translations: Record<string, string> = {
    WEDDING: 'Boda',
    BIRTHDAY: 'Aniversari',
    CORPORATE: 'Corporatiu',
    COMMUNION: 'Comunió',
    BAPTISM: 'Bateig',
    GRADUATION: 'Graduació',
    ANNIVERSARY: 'Aniversari',
    PRIVATE_PARTY: 'Festa Privada',
    OTHER: 'Esdeveniment',
  };
  return eventType ? translations[eventType] || 'Esdeveniment' : 'Esdeveniment';
}

/**
 * Valida que les dades del canvas són correctes
 */
export function validateCanvasData(data: Partial<TestimonialCanvasData>): string[] {
  const errors: string[] = [];

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('El nom del client és obligatori (mínim 2 caràcters)');
  }

  if (!data.text || data.text.trim().length < 10) {
    errors.push('El testimoni és obligatori (mínim 10 caràcters)');
  }

  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.push('La valoració ha de ser entre 1 i 5');
  }

  if (!data.discountCode || data.discountCode.length < 4) {
    errors.push('El codi de descompte és obligatori');
  }

  if (!data.discountPercent || data.discountPercent <= 0) {
    errors.push('El percentatge de descompte ha de ser positiu');
  }

  return errors;
}
