'use client';

/**
 * HomePageWrapper - Detecta movil i mostra la versio corresponent.
 * Mobile: MobileHomePage (experiencia PWA completa)
 * Desktop: contingut normal de la home
 *
 * PERF: Mentre JS detecta viewport, mostra skeleton mòbil via CSS (md:hidden)
 *       perquè l'usuari mòbil no vegi pàgina buida.
 */

import { useState, useEffect, ReactNode } from 'react';
import type { PublicPortfolioShowcaseStory } from '@/lib/constants';
import type { PublicMobileServiceCardId } from '@/lib/constants/public-service-media';
import dynamic from 'next/dynamic';

const MobileHomePage = dynamic(
  () => import('@/app/components/mobile-ultimate/MobileHomePage'),
  { ssr: false }
);

function MobileLoadingSkeleton() {
  return (
    <div className="md:hidden min-h-screen bg-bg-main flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-full bg-white/5 oe-shimmer mb-6" />
      <div className="h-8 w-64 rounded-lg bg-white/5 oe-shimmer mb-3" />
      <div className="h-5 w-48 rounded-lg bg-white/5 oe-shimmer mb-8" />
      <div className="h-12 w-52 rounded-full bg-amber-500/10 oe-shimmer" />
    </div>
  );
}

interface HomePageWrapperProps {
  children: ReactNode;
  mobilePortfolioStories?: PublicPortfolioShowcaseStory[];
  mobileServiceCardImages?: Record<PublicMobileServiceCardId, string>;
}

export default function HomePageWrapper({
  children,
  mobilePortfolioStories = [],
  mobileServiceCardImages,
}: HomePageWrapperProps) {
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
    return (
      <>
        {children}
        <MobileLoadingSkeleton />
      </>
    );
  }

  return isMobile ? (
    <MobileHomePage
      portfolioStories={mobilePortfolioStories}
      serviceCardImages={mobileServiceCardImages}
    />
  ) : (
    <>{children}</>
  );
}
