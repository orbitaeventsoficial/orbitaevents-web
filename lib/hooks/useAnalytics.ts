/**
 * USE ANALYTICS HOOK
 * Hook centralitzat per tracking d'events amb Google Tag Manager (dataLayer)
 */

import { useCallback } from 'react';

type TrackingData = Record<string, string | number | boolean>;

/**
 * Push event to GTM dataLayer
 */
function pushToDataLayer(event: string, data?: TrackingData): void {
  if (typeof window === 'undefined') return;

  const win = window as unknown as { dataLayer: Record<string, unknown>[] };
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({
    event,
    ...data,
  });
}

/**
 * Hook per tracking d'events
 * @returns track function que es pot usar per enviar events
 */
export function useAnalytics() {
  const track = useCallback((event: string, data?: TrackingData) => {
    pushToDataLayer(event, data);
  }, []);

  return { track };
}

/**
 * Funció per tracking fora de components React
 * (per usar en event handlers globals)
 */
export function trackEvent(event: string, data?: TrackingData): void {
  pushToDataLayer(event, data);
}

export type { TrackingData };
