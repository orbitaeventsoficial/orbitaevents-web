/**
 * Deferred Component Loader
 * Defers loading of heavy components until after page load
 */

'use client';

import { useState, useEffect, type ReactNode } from 'react';

interface DeferredComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  delay?: number;
}

export function DeferredComponent({
  children,
  fallback = null,
  delay = 100,
}: DeferredComponentProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
