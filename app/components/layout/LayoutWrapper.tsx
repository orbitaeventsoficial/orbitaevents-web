'use client';

import { usePathname } from 'next/navigation';
// Headers PROFESSIONALS v6 - Sense rosa, tot daurat
import HeaderPro from "@/app/components/ui/HeaderPro";
import MobileHeaderPro from "@/app/components/ui/MobileHeaderPro";
import Footer from "@/app/components/ui/footer";
import CookieConsent from "@/app/components/legal/CookieConsent.client";
import { MagicThemeSystem } from "@/app/components/magic/ThemeSystem";
import FlashOffer from "@/app/components/marketing/FlashOffer";
import BottomNav from "@/app/components/ui/BottomNav";
import FloatingContactButtons from "@/app/components/ui/FloatingContactButtons";
import MobileOptimizations from "@/app/components/ui/MobileOptimizations";

// Pàgines que NO mostren header/footer (experiència immersiva)
const IMMERSIVE_PAGES = ['/sensorial'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Comprovar si és una pàgina immersiva (sense header/footer)
  const isImmersive = IMMERSIVE_PAGES.some(page => pathname?.includes(page));

  if (isImmersive) {
    // Pàgina immersiva - SENSE header, footer, whatsapp, cookies
    return (
      <MagicThemeSystem>
      <MobileOptimizations />
        {children}
      </MagicThemeSystem>
    );
  }

  // Pàgina normal - AMB tot
  return (
    <MagicThemeSystem>
      <MobileOptimizations />
      <FlashOffer />

      {/* Header mòbil (només visible en mòbil) */}
      <div className="md:hidden">
        <MobileHeaderPro />
      </div>

      {/* Header desktop (només visible en desktop) */}
      <div className="hidden md:block">
        <HeaderPro />
      </div>

      {/* Main content - padding bottom per BottomNav en mòbil */}
      <main id="main-content" tabIndex={-1} className="min-h-screen outline-none pb-20 md:pb-0">
        {children}
      </main>

      <Footer />

      {/* Floating contact buttons - visible en totes les pantalles */}
      <FloatingContactButtons />

      {/* Bottom navigation només mòbil */}
      <BottomNav />

      <CookieConsent />
    </MagicThemeSystem>
  );
}
