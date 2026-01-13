// app/components/blog/BlogViewTracker.tsx
'use client';

import { useEffect } from 'react';

export default function BlogViewTracker({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/blog/${encodeURIComponent(slug)}/view?locale=${encodeURIComponent(locale)}`, {
      method: 'POST',
      keepalive: true,
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [slug, locale]);

  return null;
}
