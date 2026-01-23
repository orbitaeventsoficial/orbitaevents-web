'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

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
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
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
