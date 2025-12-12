'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

/**
 * FloatingContactButtons - Botons flotants de contacte
 *
 * Característiques:
 * - Apareix després de 300px scroll
 * - Botó principal WhatsApp
 * - Expandeix per mostrar Trucar i Email
 * - Auto-collapse després de 5s
 * - Respecta safe areas iPhone X+
 * - Animacions suaus
 */

// CONFIGURACIÓ - CANVIAR AQUÍ
const CONFIG = {
  phone: '34699121023',
  email: 'info@orbitaevents.com',
  showAfterScroll: 200, // px
  autoCollapseDelay: 5000, // ms
};

export default function FloatingContactButtons() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('floatingButtons');

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mostrar després de scroll
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      setIsVisible(window.scrollY > CONFIG.showAfterScroll);
    };

    // Check inicial
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  // Auto-collapse
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, CONFIG.autoCollapseDelay);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const whatsappMessage = t('whatsappMessage');
  const whatsappUrl = `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(whatsappMessage)}`;

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
          }}
          className="fixed z-[9999]"
          style={{
            right: '16px',
            bottom: 'max(80px, calc(16px + env(safe-area-inset-bottom, 0px)))',
          }}
        >
          <div className="flex flex-col items-end gap-3">
            {/* Botons secundaris (quan expandit) */}
            <AnimatePresence>
              {isExpanded && (
                <>
                  {/* Trucar */}
                  <motion.a
                    initial={{ opacity: 0, scale: 0.5, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: 20 }}
                    transition={{ delay: 0.1, type: 'spring', damping: 20 }}
                    href={`tel:+${CONFIG.phone}`}
                    className="flex items-center gap-3 pl-4 pr-5 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg shadow-blue-600/30"
                    style={{ minHeight: '48px' }}
                  >
                    <span className="text-xl">📞</span>
                    <span className="whitespace-nowrap">{t('callNow')}</span>
                  </motion.a>

                  {/* Email */}
                  <motion.a
                    initial={{ opacity: 0, scale: 0.5, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: 20 }}
                    transition={{ delay: 0.05, type: 'spring', damping: 20 }}
                    href={`mailto:${CONFIG.email}`}
                    className="flex items-center gap-3 pl-4 pr-5 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg shadow-purple-600/30"
                    style={{ minHeight: '48px' }}
                  >
                    <span className="text-xl">✉️</span>
                    <span className="whitespace-nowrap">{t('email')}</span>
                  </motion.a>
                </>
              )}
            </AnimatePresence>

            {/* Botó principal WhatsApp */}
            <motion.a
              href={isExpanded ? whatsappUrl : '#'}
              target={isExpanded ? '_blank' : undefined}
              rel={isExpanded ? 'noopener noreferrer' : undefined}
              onClick={(e) => {
                if (!isExpanded) {
                  e.preventDefault();
                  setIsExpanded(true);
                }
              }}
              className="flex items-center gap-3 pl-4 pr-5 py-3 bg-[#25D366] text-white font-bold rounded-full shadow-xl shadow-green-600/40"
              style={{ minHeight: '52px' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Icona animada */}
              <motion.span
                className="text-2xl"
                animate={
                  !isExpanded
                    ? {
                        rotate: [0, -12, 12, -12, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: 'easeInOut',
                }}
              >
                💬
              </motion.span>

              <span className="whitespace-nowrap">
                {isExpanded ? t('whatsapp') : t('contactUs')}
              </span>

              {/* Indicador expandir */}
              {!isExpanded && (
                <motion.span
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-xs opacity-70"
                >
                  ↑
                </motion.span>
              )}
            </motion.a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
