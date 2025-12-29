'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  phoneNumber = '34699121023',
  message = "Hola! M'agradaria informació sobre els vostres serveis",
  showBadge = true,
  badgeText = 'Respon en <2h',
  position = 'bottom-right',
  hideOnMobile = true,
}: WhatsAppStickyProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

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
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 md:right-6' 
    : 'left-4 md:left-6';

  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <AnimatePresence>
      {hasScrolled && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
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
                initial={{ opacity: 0, x: position === 'bottom-right' ? 20 : -20 }}
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
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
            
            {/* Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-14 h-14 bg-green-500 rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center"
            >
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </motion.div>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
