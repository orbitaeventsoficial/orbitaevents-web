'use client';

import { useMemo } from 'react';

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
};

/**
 * Reads UTM parameters from the current URL search params and returns
 * a stable object ready to merge into API request bodies.
 * Also captures the landing page pathname.
 */
export function useUtmParams(): UtmParams {
  return useMemo(() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const result: UtmParams = {};
    const src = params.get('utm_source');
    const med = params.get('utm_medium');
    const cam = params.get('utm_campaign');
    if (src) result.utmSource = src.slice(0, 200);
    if (med) result.utmMedium = med.slice(0, 200);
    if (cam) result.utmCampaign = cam.slice(0, 200);
    result.landingPage = window.location.pathname.slice(0, 500);
    return result;
  }, []);
}
