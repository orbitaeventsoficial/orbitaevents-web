'use client';

/**
 * FlashOffer.tsx - VERSIÓ SIMPLIFICADA
 *
 * Desactivat temporalment per evitar errors 401 amb l'API admin/settings
 * TODO: Crear endpoint públic /api/public/offer-settings quan es necessiti
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface OfferConfig {
  endDate: string;
  discount: number;
  ctaLink: string;
  isActive: boolean;
  title?: string;
  description?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function FlashOffer() {
  const t = useTranslations('flashOffer');
  const [offerConfig, setOfferConfig] = useState<OfferConfig | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Configuració local (no crida API admin)
  useEffect(() => {
    setMounted(true);

    // Comprovar si ja s'ha tancat en aquesta sessió
    if (typeof window !== 'undefined') {
      const wasDismissed = sessionStorage.getItem('flashOfferDismissed');
      if (wasDismissed) {
        setIsDismissed(true);
        setIsLoading(false);
        return;
      }
    }

    // Configuració local - desactivat per defecte
    // Per activar, canviar isActive a true i configurar endDate
    const config: OfferConfig = {
      isActive: false, // DESACTIVAT - canviar a true per activar
      endDate: '', // Format: '2025-12-31T23:59:59'
      discount: 10,
      ctaLink: '/configurador',
      title: '',
      description: '',
    };

    setOfferConfig(config);
    setIsLoading(false);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!offerConfig?.isActive || !offerConfig?.endDate) return;

    const calculateTimeLeft = () => {
      const end = new Date(offerConfig.endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setIsDismissed(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [offerConfig]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('flashOfferDismissed', 'true');
    }
  };

  // No renderitzar si:
  // - No està mounted (evita hydration mismatch)
  // - Està carregant
  // - L'usuari l'ha tancat
  // - No hi ha configuració
  // - L'oferta no està activa
  if (!mounted || isLoading || isDismissed || !offerConfig?.isActive) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
            {/* Text oferta */}
            <div className="flex items-center gap-2">
              <motion.span
                className="text-2xl"
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              >
                ⚡
              </motion.span>
              <span className="font-bold text-white text-sm sm:text-base">
                {offerConfig.title || t('title')}
              </span>
              <span className="hidden sm:inline text-white/90 text-sm">
                — {offerConfig.description || t('description')}
              </span>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1 sm:gap-2">
              <TimeBlock value={timeLeft.days} label={t('days')} />
              <span className="text-white font-bold text-lg">:</span>
              <TimeBlock value={timeLeft.hours} label={t('hours')} />
              <span className="text-white font-bold text-lg">:</span>
              <TimeBlock value={timeLeft.minutes} label={t('minutes')} />
              <span className="text-white font-bold text-lg hidden sm:inline">:</span>
              <div className="hidden sm:block">
                <TimeBlock value={timeLeft.seconds} label={t('seconds')} />
              </div>
            </div>

            {/* CTA Button */}
            <Link href={offerConfig.ctaLink}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-white text-orange-600 font-bold rounded-full text-sm shadow-lg hover:shadow-xl transition-shadow"
              >
                {t('cta', { discount: offerConfig.discount })} →
              </motion.button>
            </Link>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-all"
              aria-label={t('close')}
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.2 }}
      animate={{ scale: 1 }}
      className="bg-black/30 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[48px] text-center"
    >
      <span className="text-white font-mono font-bold text-base sm:text-lg">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white/60 text-[10px] ml-1">{label}</span>
    </motion.div>
  );
}
