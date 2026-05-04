'use client';

import { useEffect, useState } from 'react';
import { fetchImageManager } from '@/lib/api/imageManagerClient';

export function useManagedImageSrc(key: string, fallback: string): string {
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetchImageManager(key, { cache: 'no-store' });
        if (cancelled) return;
        const managed = response.data?.[key]?.item?.src;
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
