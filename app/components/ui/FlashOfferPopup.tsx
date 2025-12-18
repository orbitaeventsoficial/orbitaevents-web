'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

/**
 * FlashOfferPopup - Popup d'oferta flash amb countdown
 *
 * Apareix després de 3 segons a la pàgina principal
 * Es guarda a localStorage per no mostrar-lo de nou en 24h
 */

const DISCOUNT = 15;
const STORAGE_KEY = 'flashOfferDismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hores

// Data final de l'oferta (final de gener 2025)
const OFFER_END_DATE = new Date('2025-01-31T23:59:59');

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const difference = OFFER_END_DATE.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function FlashOfferPopup() {
  const t = useTranslations('flashOffer');
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  // Comprovar si s'ha de mostrar
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return; // No mostrar si s'ha tancat recentment
      }
    }

    // Mostrar després de 3 segons
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  // No renderitzar si l'oferta ha acabat
  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl border border-amber-500/20 shadow-2xl shadow-amber-500/10 overflow-hidden pointer-events-auto">

              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors z-10"
                aria-label={t('close')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="relative p-8 text-center">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-amber-400 text-sm font-medium">OFERTA LIMITADA</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                  {t('title')}
                </h2>

                {/* Description */}
                <p className="text-zinc-400 mb-6">
                  {t('description')}
                </p>

                {/* Discount badge */}
                <div className="inline-flex items-baseline gap-1 mb-8">
                  <span className="text-6xl md:text-7xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    -{DISCOUNT}%
                  </span>
                </div>

                {/* Countdown */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                  <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <span className="block text-2xl md:text-3xl font-bold text-white">
                      {timeLeft.days}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">{t('days')}</span>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <span className="block text-2xl md:text-3xl font-bold text-white">
                      {timeLeft.hours.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">{t('hours')}</span>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <span className="block text-2xl md:text-3xl font-bold text-white">
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">{t('minutes')}</span>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <span className="block text-2xl md:text-3xl font-bold text-white">
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">{t('seconds')}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href="/contacto"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-900 font-bold text-lg rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/25"
                >
                  {t('cta', { discount: DISCOUNT })}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                {/* Fine print */}
                <p className="mt-4 text-xs text-zinc-600">
                  *Vàlid per reserves realitzades abans del 31 de gener
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
