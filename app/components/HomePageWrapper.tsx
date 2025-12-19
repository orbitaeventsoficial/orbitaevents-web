'use client';

/**
 * HomePageWrapper - Detecta mòbil i mostra la versió corresponent
 * Mobile: MobileHomePage (experiència PWA completa)
 * Desktop: Contingut normal de la home
 */

import { useState, useEffect, ReactNode } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      // Detecta mòbil per viewport < 1024px
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // SSR: Mostra el contingut desktop mentre es carrega
  if (!mounted) {
    return <>{children}</>;
  }

  // Mobile: Experiència PWA completa
  if (isMobile) {
    return <MobileHomePage />;
  }

  // Desktop: Contingut normal
  return <>{children}</>;
}
