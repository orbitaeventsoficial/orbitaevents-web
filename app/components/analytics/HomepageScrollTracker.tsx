'use client';

// app/components/analytics/HomepageScrollTracker.tsx
// ─────────────────────────────────────────────
// Client component que instancia el hook de scroll tracking per la homepage
// S'afegeix a page.tsx sense trencar el Server Component

import { useScrollTracking } from '@/hooks/useScrollTracking';

export default function HomepageScrollTracker() {
  useScrollTracking('[data-section-id]');
  return null;
}
