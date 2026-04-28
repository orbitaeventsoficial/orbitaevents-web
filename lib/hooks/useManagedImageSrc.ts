'use client';

import { useEffect, useState } from 'react';

export function useManagedImageSrc(key: string, fallback: string): string {
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(
          `/api/public/image-manager?key=${encodeURIComponent(key)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) return;
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        const managed = data?.data?.[key]?.item?.src;
        if (typeof managed === 'string' && managed.trim().length > 0) {
          setSrc(managed);
        }
      } catch {
        // mantenir fallback estàtic
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return src;
}
