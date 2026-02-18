'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING CTAs - Focus en WhatsApp
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 1. CTA DESKTOP - Botó flotant que porta al contacte
// ═══════════════════════════════════════════════════════════════════════════

export function ContactDesktop() {
  const t = useTranslations('common');
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
                  <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
                  <span className="text-white/80">Respon en menys de 2h 💬</span>
                </div>
                {/* Arrow */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-[#111]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button - WhatsApp */}
          <a
            href={WHATSAPP_URL_WITH_MESSAGE("Hola! M'agradaria informació sobre els vostres serveis d'events.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackWhatsAppClick('floating_desktop');
              trackCTAClick('floating_whatsapp_desktop', 'floating_cta_desktop');
            }}
            className="relative group block"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />

            {/* Button */}
            <div className="relative w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 group-hover:shadow-[#25D366]/50 group-hover:scale-110 transition-all duration-300">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. BOTTOM BAR MOBILE - Focus en WhatsApp
// IMPORTANT: Ara la barra NOMÉS apareix després de fer scroll més enllà
// de l'altura del viewport (quan el Hero ja no és visible)
// Això evita tenir 2 sets de botons CTA a la vegada
// ═══════════════════════════════════════════════════════════════════════════

export function BottomBarMobile() {
  const t = useTranslations('common');
  const [isVisible, setIsVisible] = useState(false); // CANVI: Comença OCULT
  const reduceMotion = useReducedMotion();
  const lastScrollYRef = useRef(0);
  const scrollRaf = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRaf.current !== null) return;
      scrollRaf.current = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const viewportHeight = window.innerHeight;

        // LÒGICA MILLORADA:
        // - NO mostrar mentre estem al Hero (primer viewport)
        // - SÍ mostrar quan hem passat el 70% del viewport (el Hero ja no es veu)
        const heroPassed = currentScrollY > viewportHeight * 0.7;

        if (!heroPassed) {
          // Encara veiem el Hero - AMAGAR la barra sticky
          setIsVisible(false);
          lastScrollYRef.current = currentScrollY;
          scrollRaf.current = null;
          return;
        }

        // Ja hem passat el Hero - mostrar/amagar segons direcció scroll
        if (currentScrollY > lastScrollYRef.current && currentScrollY > viewportHeight) {
          // Scroll down - amagar
          setIsVisible(false);
        } else {
          // Scroll up - mostrar
          setIsVisible(true);
        }

        lastScrollYRef.current = currentScrollY;
        scrollRaf.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Comprovar estat inicial
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollRaf.current !== null) {
        window.cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
    };
  }, []);

  return (
    <>
      {/* Spacer condicional - només quan la barra és visible */}
      {isVisible && <div className="h-[72px] md:hidden" />}

      {/* Bottom Bar - NOMÉS MÒBIL */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={reduceMotion ? false : { y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Gradient fade */}
            <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />

            {/* Bar */}
            <div className="bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3">
              <div className="flex gap-3">
                {/* Botó Principal - WhatsApp */}
                <a
                  href={WHATSAPP_URL_WITH_MESSAGE("Hola! M'agradaria informació")}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => {
                    trackWhatsAppClick('floating_mobile');
                    trackCTAClick('floating_whatsapp_mobile', 'floating_cta_mobile');
                  }}
                  className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-3.5 rounded-xl text-center active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t('buttons.whatsapp')}
                </a>

                {/* Secundari - Formulari */}
                <Link
                  href="/contacto"
                  onClick={() => trackCTAClick('floating_contact_form_mobile', 'floating_cta_mobile')}
                  className="bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform border border-zinc-700"
                >
                  {t('buttons.requestQuote')}
                </Link>
              </div>

              {/* Trust line */}
              <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-[#666]">
                <span>✓ {t('trust.responseTime')}</span>
                <span>✓ {t('trust.noCommitment')}</span>
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
