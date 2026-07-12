// app/lib/analytics.ts
/**
 * MANOLO'S ANALYTICS TRACKER
 * Sistema centralizado de tracking para Google Analytics 4
 *
 * Uso: import { trackEvent, trackLead, trackWhatsAppClick } from '@/lib/analytics';
 */

import { log } from '@/lib/logger';

// Window globals (gtag, dataLayer, gtagConsentUpdate) are declared in types/window.d.ts

/**
 * Tipos de eventos principales
 */
type EventCategory = 
  | 'Contact'
  | 'Engagement'
  | 'Navigation'
  | 'CTA';

type EventName = 
  | 'generate_lead'
  | 'contact_whatsapp'
  | 'contact_phone'
  | 'scroll'
  | 'click_cta'
  | 'page_view';

/**
 * Interface para eventos personalizados
 */
interface TrackEventParams {
  eventName: EventName;
  eventCategory: EventCategory;
  eventLabel?: string;
  value?: number;
  additionalParams?: Record<string, unknown>;
}

/**
 * Verifica si estamos en el lado del cliente
 */
const isClientSide = (): boolean => typeof window !== 'undefined';

/**
 * Función universal para trackear cualquier evento
 * Se envía a Google Analytics
 */
export const trackEvent = ({
  eventName,
  eventCategory,
  eventLabel,
  value,
  additionalParams = {},
}: TrackEventParams): void => {
  if (!isClientSide()) return;

  // 📊 GOOGLE ANALYTICS 4
  if (window.gtag) {
    window.gtag('event', eventName, {
      event_category: eventCategory,
      event_label: eventLabel,
      value: value,
      ...additionalParams,
    });
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      event_category: eventCategory,
      event_label: eventLabel,
      value: value,
      ...additionalParams,
    });
    return;
  }

  log.debug('Track Event (no analytics)', { eventName, eventCategory, eventLabel, value });
};

/**
 * IMPORTS ESENCIALES: packs-config es TU FUENTE DE VERDAD
 */
import { getPackById, PackId } from '@/config/packs-config'; // ← AJUSTA RUTA SI ES NECESARIO

/**
 * OBTENER VALOR REAL DEL PACK (fuente única de verdad)
 */
const getRealPackValue = (packId: PackId): number => {
  const pack = getPackById(packId);
  return pack?.priceValue || 0;
};

/**
 * TRACKEAR LEAD GENERADO (conversión principal)
 * AHORA USA PRECIO REAL DEL PACK SI SE SELECCIONÓ
 */
export const trackLead = (data: {
  eventType: string;
  estimatedValue?: number;
  source?: string;
  packId?: PackId; // ← NUEVO: opcional, pero ORO PURO
}): void => {
  const { eventType, estimatedValue, source, packId } = data;

  // PRIORIDAD: packId real > estimatedValue > fallback desde DB
  let finalValue = estimatedValue ?? 0;

  if (packId) {
    finalValue = getRealPackValue(packId);
  } else if (finalValue === 0) {
    // Fallback: intenta buscar pack por eventType (ej: boda → pack boda)
    const pack = getPackById(eventType as PackId);
    finalValue = pack?.priceValue || 500; // 500€ fallback seguro si no existe
  }

  trackEvent({
    eventName: 'generate_lead',
    eventCategory: 'Contact',
    eventLabel: eventType,
    value: finalValue,
    additionalParams: {
      lead_source: source || 'contact_form',
      event_type: eventType,
      ...(packId && { pack_id: packId, pack_value: finalValue }),
    },
  });
};

/**
 * TRACKEAR CLICK EN WHATSAPP
 */
export const trackWhatsAppClick = (source: string = 'generic'): void => {
  trackEvent({
    eventName: 'contact_whatsapp',
    eventCategory: 'Contact',
    eventLabel: `WhatsApp - ${source}`,
    additionalParams: {
      contact_method: 'whatsapp',
      source: source,
    },
  });
};

/**
 * TRACKEAR CLICK EN TELÉFONO
 */
export const trackPhoneClick = (source: string = 'generic'): void => {
  trackEvent({
    eventName: 'contact_phone',
    eventCategory: 'Contact',
    eventLabel: `Phone - ${source}`,
    additionalParams: {
      contact_method: 'phone',
      source: source,
    },
  });
};

/**
 * TRACKEAR SCROLL DEPTH (profundidad de scroll)
 */
export const trackScrollDepth = (percentage: number): void => {
  trackEvent({
    eventName: 'scroll',
    eventCategory: 'Engagement',
    eventLabel: `${percentage}%`,
    value: percentage,
    additionalParams: {
      scroll_depth: percentage,
    },
  });
};

/**
 * TRACKEAR CLICK EN CTA (Call To Action)
 */
export const trackCTAClick = (ctaLabel: string, ctaLocation: string): void => {
  trackEvent({
    eventName: 'click_cta',
    eventCategory: 'CTA',
    eventLabel: ctaLabel,
    additionalParams: {
      cta_location: ctaLocation,
      cta_text: ctaLabel,
    },
  });
};

/**
 * TRACKEAR PAGE VIEW (útil para SPAs con navegación dinámica)
 */
export const trackPageView = (pagePath: string, pageTitle: string): void => {
  if (!isClientSide()) return;

  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: 'page_view',
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

/**
 * TRACKING DIRECTE D'EVENT GA4 SENSE CATEGORIES/LABELS
 * Per al tracking de pàgines de servei públiques (bodas, discomovil, fiestas)
 * que envien events com `bodas_pack_cta`, `discomovil_hero_cta`, etc. amb
 * params arbitraris (pack_id, position, etc.) sense necessitat de
 * la capa event_category/event_label/value que afegeix `trackEvent`.
 */
export type PublicServiceEventValue = string | number | boolean | undefined;
export type PublicServiceEventParams = Record<string, PublicServiceEventValue>;

export const trackPublicServiceEvent = (
  action: string,
  params: PublicServiceEventParams,
): void => {
  if (!isClientSide()) return;
  if (!window.gtag) return;
  window.gtag('event', action, params);
};
