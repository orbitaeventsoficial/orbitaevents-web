/**
 * USE ANALYTICS HOOK
 * Hook centralitzat per tracking d'events amb Vercel Analytics
 */

import { useCallback, useEffect, useRef } from 'react';

type TrackingData = Record<string, string | number | boolean>;

let globalTrack: ((_event: string, _data?: TrackingData) => void) | null = null;
let _isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * Carregar Vercel Analytics dinàmicament (només en producció)
 */
function loadAnalytics(): Promise<void> {
  if (globalTrack) return Promise.resolve();
  if (loadPromise) return loadPromise;

  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    return Promise.resolve();
  }

  _isLoading = true;
  loadPromise = import('@vercel/analytics')
    .then((mod) => {
      globalTrack = mod.track;
    })
    .catch(() => {
      // Silent fail - analytics not critical
    })
    .finally(() => {
      _isLoading = false;
    });

  return loadPromise;
}

/**
 * Hook per tracking d'events
 * @returns track function que es pot usar per enviar events
 */
export function useAnalytics() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      loadAnalytics();
      isInitialized.current = true;
    }
  }, []);

  const track = useCallback((event: string, data?: TrackingData) => {
    if (globalTrack) {
      globalTrack(event, data);
    }
  }, []);

  return { track };
}

/**
 * Funció per tracking fora de components React
 * (per usar en event handlers globals)
 */
export function trackEvent(event: string, data?: TrackingData): void {
  loadAnalytics().then(() => {
    if (globalTrack) {
      globalTrack(event, data);
    }
  });
}

export type { TrackingData };
