'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING CTAs - Focus en FORMULARI DE CONTACTE (no WhatsApp)
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. CTA DESKTOP - Botó flotant que porta al contacte
// ═══════════════════════════════════════════════════════════════════════════

export function ContactDesktop() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Mostrar després de scroll
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mostrar tooltip després de 3 segons
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 4000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-8 right-8 z-40 hidden md:block"
        >
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[#111] border border-white/10 rounded-lg px-4 py-2 whitespace-nowrap"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-white/80">Respon en &lt;2h</span>
                </div>
                {/* Arrow */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-[#111]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button - Contacte */}
          <Link
            href="/contacto"
            className="relative group block"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-20" />

            {/* Button */}
            <div className="relative w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 group-hover:scale-110 transition-all duration-300">
              <svg className="w-6 h-6 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. BOTTOM BAR MOBILE - Focus en contacte
// ═══════════════════════════════════════════════════════════════════════════

export function BottomBarMobile() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Sempre visible a dalt
      if (currentScrollY < 100) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Amagar quan scroll down, mostrar quan scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Spacer perquè el contingut no quedi tapat */}
      <div className="h-[72px] md:hidden" />

      {/* Bottom Bar - NOMÉS MÒBIL */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Gradient fade */}
            <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />

            {/* Bar */}
            <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3">
              <div className="flex gap-3">
                {/* Botó Principal - CONTACTE */}
                <Link
                  href="/contacto"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 font-bold py-3.5 rounded-xl text-center active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Sol·licitar pressupost
                </Link>

                {/* Telèfon - Opcional, més discret */}
                <a
                  href="tel:699121023"
                  className="bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform border border-zinc-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              </div>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-[#666]">
                <span>✓ Resposta &lt;2h</span>
                <span>✓ Sense compromís</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. EXPORT COMBINAT
// ═══════════════════════════════════════════════════════════════════════════

export default function FloatingCTAs() {
  return (
    <>
      <ContactDesktop />
      <BottomBarMobile />
    </>
  );
}
