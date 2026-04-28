'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';

// ═══════════════════════════════════════════════════════════════════════════
// WHATSAPP STICKY PREMIUM
// Botó flotant amb pulse animation i tooltip
// ═══════════════════════════════════════════════════════════════════════════

interface WhatsAppStickyProps {
  phoneNumber?: string;
  message?: string;
  showBadge?: boolean;
  badgeText?: string;
  position?: 'bottom-right' | 'bottom-left';
  hideOnMobile?: boolean; // Si tens BottomCTABar, amaga aquest al mòbil
}

export default function WhatsAppSticky({
  phoneNumber = WHATSAPP_NUMBER,
  message = "Hola! M'agradaria informació sobre els vostres serveis",
  showBadge = true,
  badgeText = 'Respon en <2h',
  position = 'bottom-right',
  hideOnMobile = true,
}: WhatsAppStickyProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const scrollRaf = useRef<number | null>(null);
  const hasScrolledRef = useRef(hasScrolled);

  useEffect(() => {
    hasScrolledRef.current = hasScrolled;
  }, [hasScrolled]);

  // Mostrar tooltip automàticament després de 5 segons
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    const showTimer = setTimeout(() => {
      setShowTooltip(true);

      // Amagar després de 5 segons
      hideTimer = setTimeout(() => setShowTooltip(false), 5000);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  // Detectar scroll per mostrar
  useEffect(() => {
    let isMounted = true;

    const handleScroll = () => {
      if (scrollRaf.current !== null || !isMounted) return;
      scrollRaf.current = window.requestAnimationFrame(() => {
        if (!isMounted) {
          scrollRaf.current = null;
          return;
        }
        const nextValue = window.scrollY > 300;
        if (nextValue !== hasScrolledRef.current) {
          hasScrolledRef.current = nextValue;
          setHasScrolled(nextValue);
        }
        scrollRaf.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      isMounted = false;
      window.removeEventListener('scroll', handleScroll);
      if (scrollRaf.current !== null) {
        window.cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
    };
  }, []);

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 md:right-6' 
    : 'left-4 md:left-6';

  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <AnimatePresence>
      {hasScrolled && (
        <motion.div
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`
            fixed bottom-24 ${positionClasses} z-40
            ${hideOnMobile ? 'hidden md:block' : 'block'}
          `}
        >
          {/* Tooltip / Badge */}
          <AnimatePresence>
            {(showTooltip || isHovered) && showBadge && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: position === 'bottom-right' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: position === 'bottom-right' ? 20 : -20 }}
                className={`
                  absolute top-1/2 -translate-y-1/2
                  ${position === 'bottom-right' ? 'right-full mr-3' : 'left-full ml-3'}
                  bg-zinc-900 text-white text-sm font-medium
                  px-3 py-2 rounded-lg
                  whitespace-nowrap
                  border border-zinc-700
                  shadow-xl
                `}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 bg-green-500 rounded-full ${reduceMotion ? '' : 'animate-pulse'}`} />
                  {badgeText}
                </span>
                
                {/* Arrow */}
                <div 
                  className={`
                    absolute top-1/2 -translate-y-1/2
                    ${position === 'bottom-right' ? '-right-2' : '-left-2'}
                    w-0 h-0
                    border-t-8 border-t-transparent
                    border-b-8 border-b-transparent
                    ${position === 'bottom-right' 
                      ? 'border-l-8 border-l-zinc-900' 
                      : 'border-r-8 border-r-zinc-900'
                    }
                  `}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button */}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative block"
          >
            {/* Ping animation */}
            <span className={`absolute inset-0 rounded-full bg-green-500 ${reduceMotion ? '' : 'animate-ping'} opacity-30`} />
            
            {/* Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-14 h-14 bg-green-500 rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center"
            >
              <WhatsAppIcon className="w-7 h-7 text-white" />
            </motion.div>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
