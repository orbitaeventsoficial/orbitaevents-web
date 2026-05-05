// hooks/useScrollTracking.ts
// ─────────────────────────────────────────────
// Detecta quines seccions entren al viewport i envia events al dataLayer
// Cada secció es dispara una sola vegada per sessió

import { useEffect } from 'react';

const seen = new Set<string>();

export function useScrollTracking(selector = '[data-section-id]') {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sectionId = (entry.target as HTMLElement).dataset.sectionId;
          if (!sectionId || seen.has(sectionId)) return;

          seen.add(sectionId);

          // GTM dataLayer
          if (Array.isArray(window.dataLayer)) {
            window.dataLayer.push({
              event: 'section_view',
              section_id: sectionId,
            });
          }

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [selector]);
}
