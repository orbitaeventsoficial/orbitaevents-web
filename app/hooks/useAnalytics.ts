// app/hooks/useAnalytics.ts
'use client';

import { useCallback, useEffect, useRef } from 'react';

// Type compatible with @vercel/analytics track function
type TrackFunction = (_event: string, _data?: Record<string, any>) => void;

let trackFn: TrackFunction | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

async function loadAnalytics(): Promise<void> {
  if (trackFn || isLoading) return;
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;

  isLoading = true;
  try {
    const { track } = await import('@vercel/analytics');
    trackFn = track as TrackFunction;
  } catch (e) {
    console.warn('Analytics failed to load');
  } finally {
    isLoading = false;
  }
}

export function useAnalytics() {
  const queueRef = useRef<Array<[string, Record<string, any>?]>>([]);

  useEffect(() => {
    if (!loadPromise) {
      loadPromise = loadAnalytics();
    }
    loadPromise.then(() => {
      // Flush queued events
      queueRef.current.forEach(([event, data]) => {
        trackFn?.(event, data);
      });
      queueRef.current = [];
    });
  }, []);

  const track = useCallback((event: string, data?: Record<string, any>) => {
    if (trackFn) {
      trackFn(event, data);
    } else {
      queueRef.current.push([event, data]);
    }
  }, []);

  return { track };
}
