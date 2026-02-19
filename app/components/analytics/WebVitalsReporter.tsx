'use client';

// app/components/analytics/WebVitalsReporter.tsx
// ─────────────────────────────────────────────
// Reporta Core Web Vitals a GTM dataLayer + Umami
// Metrics: CLS, INP, LCP, FCP, TTFB

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // 1. Google Tag Manager / dataLayer
  if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
    (window as any).dataLayer.push({
      event: 'web_vitals',
      metric_name: metric.name,
      metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
      metric_id: metric.id,
      metric_delta: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
    });
  }

  // 2. Umami custom event (if available)
  if (typeof window !== 'undefined' && (window as any).umami) {
    (window as any).umami.track(`web_vitals_${metric.name.toLowerCase()}`, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      rating: metric.rating,
    });
  }
}

export default function WebVitalsReporter() {
  useEffect(() => {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      onCLS(sendToAnalytics);
      onINP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onFCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
    });
  }, []);

  return null;
}
