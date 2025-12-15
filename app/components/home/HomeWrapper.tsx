'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load experiència mòbil premium
const MobileExperiencePremium = dynamic(
  () => import('@/app/components/ui/MobileExperiencePremium'),
  { ssr: false }
);

interface HomeWrapperProps {
  children: React.ReactNode;
}

export default function HomeWrapper({ children }: HomeWrapperProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Loading state - telón negre
  if (isMobile === null) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mòbil: experiència premium
  if (isMobile) {
    return <MobileExperiencePremium />;
  }

  // Desktop: contingut normal
  return <>{children}</>;
}
