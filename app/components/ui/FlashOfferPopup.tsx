'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

/**
 * FlashOfferPopup - Sistema de popups d'oferta alternatius
 *
 * Mostra alternativament:
 * 1. Oferta 15% descompte general
 * 2. Oferta Flash 250€ - Festes privades 2h
 *
 * Alterna cada visita per no repetir la mateixa oferta
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ D'OFERTES
// ═══════════════════════════════════════════════════════════════════════════

interface OfferConfig {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  originalValue?: number;
  badge: string;
  title: string;
  description: string;
  features?: string[];
  cta: string;
  href: string;
  finePrint: string;
  gradient: string;
  accentColor: string;
}

// Solo oferta flash de 250€
const OFFER: OfferConfig = {
  id: 'flash-250',
  type: 'fixed',
  value: 250,
  originalValue: 450,
  badge: '⚡ OFERTA FLASH - TEMPS LIMITAT',
  title: 'Reserva abans que s\'esgoti el temps!',
  description: 'Festa privada completa: DJ + So + Llums (fins a 50 persones)',
  features: [
    '🎧 DJ professional 2 hores',
    '🔊 Equip de so 3200W',
    '💡 Il·luminació LED',
    '✨ Màquina de fum inclosa',
  ],
  cta: 'Reserva ara per 250€',
  href: '/contacto?pack=oferta-flash',
  finePrint: '*Oferta vàlida durant el temps indicat. Fins a 50 persones. Subjecte a disponibilitat.',
  gradient: 'from-purple-500 to-pink-500',
  accentColor: 'purple',
};

const STORAGE_KEY = 'flashOfferDismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hores
const COUNTDOWN_DURATION = 15 * 60 * 1000; // 15 minuts

interface TimeLeft {
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(startTime: number): TimeLeft {
  const now = Date.now();
  const elapsed = now - startTime;
  const remaining = COUNTDOWN_DURATION - elapsed;

  if (remaining <= 0) {
    return { minutes: 0, seconds: 0 };
  }

  return {
    minutes: Math.floor(remaining / 1000 / 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
}

export default function FlashOfferPopup() {
  const t = useTranslations('flashOffer');
  const [isVisible, setIsVisible] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ minutes: 15, seconds: 0 });

  // Comprovar si s'ha de mostrar
  useEffect(() => {
    // Comprovar si ja s'ha tancat recentment
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return; // No mostrar si s'ha tancat recentment
      }
    }

    // Mostrar després de 5 segons (després de la intro)
    const timer = setTimeout(() => {
      const now = Date.now();
      setStartTime(now);
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Countdown timer (15 minuts)
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(startTime);
      setTimeLeft(remaining);

      // Tancar automàticament quan s'acabi el temps
      if (remaining.minutes === 0 && remaining.seconds === 0) {
        setIsVisible(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, startTime]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  // No renderitzar si l'oferta ha acabat
  if (timeLeft.minutes === 0 && timeLeft.seconds === 0 && isVisible) {
    return null;
  }

  const accentClasses = OFFER.accentColor === 'amber'
    ? {
        badge: 'bg-amber-500/10 border-amber-500/20',
        badgeText: 'text-amber-400',
        badgeDot: 'bg-amber-500',
        glow1: 'bg-amber-500/20',
        glow2: 'bg-orange-500/20',
        border: 'border-amber-500/20',
        shadow: 'shadow-amber-500/10',
        buttonHover: 'hover:shadow-amber-500/25',
      }
    : {
        badge: 'bg-purple-500/10 border-purple-500/20',
        badgeText: 'text-purple-400',
        badgeDot: 'bg-purple-500',
        glow1: 'bg-purple-500/20',
        glow2: 'bg-pink-500/20',
        border: 'border-purple-500/20',
        shadow: 'shadow-purple-500/10',
        buttonHover: 'hover:shadow-purple-500/25',
      };

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
            <div className={`relative w-full max-w-md bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl border ${accentClasses.border} shadow-2xl ${accentClasses.shadow} overflow-hidden pointer-events-auto`}>

              {/* Glow effect */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 ${accentClasses.glow1} rounded-full blur-3xl`} />
              <div className={`absolute -bottom-20 -left-20 w-40 h-40 ${accentClasses.glow2} rounded-full blur-3xl`} />

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
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 ${accentClasses.badge} border rounded-full mb-6`}>
                  <span className={`w-2 h-2 ${accentClasses.badgeDot} rounded-full animate-pulse`} />
                  <span className={`${accentClasses.badgeText} text-sm font-medium`}>{OFFER.badge}</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                  {OFFER.title}
                </h2>

                {/* Description */}
                <p className="text-zinc-400 mb-6">
                  {OFFER.description}
                </p>

                {/* Value display */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-3">
                    {OFFER.originalValue && (
                      <span className="text-2xl text-zinc-500 line-through">
                        {OFFER.originalValue}€
                      </span>
                    )}
                    <span className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${OFFER.gradient} bg-clip-text text-transparent`}>
                      {OFFER.value}€
                    </span>
                  </div>
                  {OFFER.originalValue && (
                    <span className="text-green-400 text-sm font-medium">
                      Estalvia {OFFER.originalValue - OFFER.value}€!
                    </span>
                  )}
                </div>

                {/* Features */}
                {OFFER.features && (
                  <div className="text-left bg-zinc-800/50 rounded-xl p-4 mb-6 border border-zinc-700/50">
                    <ul className="space-y-2">
                      {OFFER.features.map((feature, i) => (
                        <li key={i} className="text-zinc-300 text-sm">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Countdown - Solo minutos y segundos */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <span className="block text-3xl md:text-4xl font-bold text-white">
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">{t('minutes')}</span>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <span className="block text-3xl md:text-4xl font-bold text-white">
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-zinc-500 uppercase">{t('seconds')}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={OFFER.href}
                  onClick={handleClose}
                  className={`inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r ${OFFER.gradient} hover:opacity-90 text-white font-bold text-lg rounded-xl transition-all hover:shadow-lg ${accentClasses.buttonHover}`}
                >
                  {OFFER.cta}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                {/* Fine print */}
                <p className="mt-4 text-xs text-zinc-600">
                  {OFFER.finePrint}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
