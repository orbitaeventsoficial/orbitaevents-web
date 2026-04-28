'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';

// ═══════════════════════════════════════════════════════════════════════════
// BOTTOM CTA BAR - SEMPRE VISIBLE AL MÒBIL
// Els CTAs més importants sempre a l'abast del polze
// ═══════════════════════════════════════════════════════════════════════════

interface BottomCTABarProps {
  primaryText?: string;
  primaryHref?: string;
  showWhatsApp?: boolean;
  hideOnScroll?: boolean;
}

export default function BottomCTABar({
  primaryText = 'Pressupost Gratis',
  primaryHref = '/contacto',
  showWhatsApp = true,
  hideOnScroll = true,
}: BottomCTABarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const reduceMotion = useReducedMotion();
  const lastScrollYRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);
  const isVisibleRef = useRef(isVisible);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      if (scrollRaf.current !== null) return;
      scrollRaf.current = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Mostrar sempre a dalt de tot
        if (currentScrollY < 100) {
          if (!isVisibleRef.current) setIsVisible(true);
        } else if (currentScrollY > lastScrollYRef.current) {
          // Amagar quan scroll cap avall, mostrar quan scroll cap amunt
          if (isVisibleRef.current) setIsVisible(false);
        } else if (!isVisibleRef.current) {
          setIsVisible(true);
        }
        
        lastScrollYRef.current = currentScrollY;
        scrollRaf.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollRaf.current !== null) {
        window.cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
    };
  }, [hideOnScroll]);

  return (
    <>
      {/* Spacer dinàmic per evitar que el contingut quedi tapat - considera safe-area */}
      <div className="md:hidden" style={{ height: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} />
      
      {/* Bottom Bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={reduceMotion ? false : { y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Gradient fade */}
            <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
            
            {/* Bar content */}
            <div className="bg-zinc-950 border-t border-zinc-800 px-4 py-3">
              <div className="flex gap-3">
                {/* Primary CTA */}
                <Link
                  href={primaryHref}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold py-3.5 px-4 rounded-xl text-center active:scale-95 transition-transform"
                >
                  {primaryText}
                </Link>
                
                {/* WhatsApp */}
                {showWhatsApp && (
                  <a
                    href={WHATSAPP_URL_WITH_MESSAGE("Hola! M'agradaria informació")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    <span className="sr-only sm:not-sr-only">WhatsApp</span>
                  </a>
                )}
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="text-green-500">✓</span> Resposta &lt;2h
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-500">✓</span> Sense compromís
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
