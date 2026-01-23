'use client';

/**
 * HomePageWrapper - Detecta mòbil i mostra la versió corresponent
 * Mobile: MobileHomePage (experiència PWA completa)
 * Desktop: Contingut normal de la home
 *
 * OPTIMIZADO: SSR muestra contenido desktop (mejor FCP/LCP)
 * El cambio a mobile solo ocurre client-side si es necesario
 */

import { useState, useEffect, ReactNode, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Lazy load MobileHomePage per no afectar el bundle desktop
const MobileHomePage = dynamic(
  () => import('@/app/components/mobile-ultimate/MobileHomePage'),
  { ssr: false }
);

interface HomePageWrapperProps {
  children: ReactNode; // Contingut desktop
}

export default function HomePageWrapper({ children }: HomePageWrapperProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Usar 768px para consistencia con Tailwind md: breakpoint
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const checkMobile = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Initial check
    checkMobile(mediaQuery);

    // Listen for changes (más eficiente que resize)
    mediaQuery.addEventListener('change', checkMobile);
    return () => mediaQuery.removeEventListener('change', checkMobile);
  }, []);

  // SSR + Initial render: Muestra contenido desktop (mejor FCP)
  // Una vez hidratado, si es móvil cambiará automáticamente
  if (isMobile === null) {
    return <>{children}</>;
  }

  // Mobile: Experiència PWA completa
  if (isMobile) {
    return <MobileHomePage />;
  }

  // Desktop: Contingut normal
  return <>{children}</>;
}
