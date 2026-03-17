'use client';

/**
 * HomePageWrapper - Detecta movil i mostra la versio corresponent.
 * Mobile: MobileHomePage (experiencia PWA completa)
 * Desktop: contingut normal de la home
 */

import { useState, useEffect, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const MobileHomePage = dynamic(
  () => import('@/app/components/mobile-ultimate/MobileHomePage'),
  { ssr: false }
);

interface HomePageWrapperProps {
  children: ReactNode;
}

export default function HomePageWrapper({ children }: HomePageWrapperProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const syncViewport = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    syncViewport(mediaQuery);
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  if (isMobile === null) {
    return <>{children}</>;
  }

  return isMobile ? <MobileHomePage /> : <>{children}</>;
}
