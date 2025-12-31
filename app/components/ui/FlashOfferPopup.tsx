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

const OFFERS: OfferConfig[] = [
  {
    id: 'discount-15',
    type: 'percentage',
    value: 15,
    badge: 'OFERTA LIMITADA',
    title: 'Reserva ara i estalvia!',
    description: 'Descompte exclusiu per a nous clients',
    cta: 'Demana pressupost amb -15%',
    href: '/contacto',
    finePrint: '*Vàlid per reserves realitzades abans del 28 de febrer',
    gradient: 'from-amber-500 to-orange-500',
    accentColor: 'amber',
  },
  {
    id: 'flash-250',
    type: 'fixed',
    value: 250,
    originalValue: 450,
    badge: '⚡ OFERTA FLASH',
    title: 'Festa privada completa',
    description: 'DJ + So + Llums per a festes de fins a 50 persones',
    features: [
      '🎧 DJ professional 2 hores',
      '🔊 Equip de so 3200W',
      '💡 Il·luminació LED',
      '✨ Màquina de fum inclosa',
    ],
    cta: 'Reserva per 250€',
    href: '/contacto?pack=oferta-flash',
    finePrint: '*Festes de fins a 50 persones. Subjecte a disponibilitat.',
    gradient: 'from-purple-500 to-pink-500',
    accentColor: 'purple',
  },
];

const STORAGE_KEY = 'flashOfferDismissed';
const OFFER_INDEX_KEY = 'flashOfferIndex';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hores

// Data final de l'oferta
const OFFER_END_DATE = new Date('2026-02-28T23:59:59');

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
  const [currentOffer, setCurrentOffer] = useState<OfferConfig>(OFFERS[0]);

  // Seleccionar oferta i comprovar si s'ha de mostrar
  useEffect(() => {
    // Comprovar si ja s'ha tancat recentment
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return; // No mostrar si s'ha tancat recentment
      }
    }

    // Alternar oferta (0 -> 1 -> 0 -> 1...)
    const lastIndex = parseInt(localStorage.getItem(OFFER_INDEX_KEY) || '0', 10);
    const nextIndex = (lastIndex + 1) % OFFERS.length;
    setCurrentOffer(OFFERS[nextIndex]);
    localStorage.setItem(OFFER_INDEX_KEY, nextIndex.toString());

    // Mostrar després de 4 segons
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

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

  const isPercentage = currentOffer.type === 'percentage';
  const accentClasses = currentOffer.accentColor === 'amber'
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
                  <span className={`${accentClasses.badgeText} text-sm font-medium`}>{currentOffer.badge}</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                  {currentOffer.title}
                </h2>

                {/* Description */}
                <p className="text-zinc-400 mb-6">
                  {currentOffer.description}
                </p>

                {/* Value display */}
                {isPercentage ? (
                  <div className="inline-flex items-baseline gap-1 mb-6">
                    <span className={`text-6xl md:text-7xl font-black bg-gradient-to-r ${currentOffer.gradient} bg-clip-text text-transparent`}>
                      -{currentOffer.value}%
                    </span>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-3">
                      {currentOffer.originalValue && (
                        <span className="text-2xl text-zinc-500 line-through">
                          {currentOffer.originalValue}€
                        </span>
                      )}
                      <span className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${currentOffer.gradient} bg-clip-text text-transparent`}>
                        {currentOffer.value}€
                      </span>
                    </div>
                    {currentOffer.originalValue && (
                      <span className="text-green-400 text-sm font-medium">
                        Estalvia {currentOffer.originalValue - currentOffer.value}€!
                      </span>
                    )}
                  </div>
                )}

                {/* Features (for fixed price offers) */}
                {currentOffer.features && (
                  <div className="text-left bg-zinc-800/50 rounded-xl p-4 mb-6 border border-zinc-700/50">
                    <ul className="space-y-2">
                      {currentOffer.features.map((feature, i) => (
                        <li key={i} className="text-zinc-300 text-sm">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Countdown */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-zinc-800/50 rounded-xl p-2 border border-zinc-700/50">
                    <span className="block text-xl md:text-2xl font-bold text-white">
                      {timeLeft.days}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">{t('days')}</span>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-2 border border-zinc-700/50">
                    <span className="block text-xl md:text-2xl font-bold text-white">
                      {timeLeft.hours.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">{t('hours')}</span>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-2 border border-zinc-700/50">
                    <span className="block text-xl md:text-2xl font-bold text-white">
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">{t('minutes')}</span>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-2 border border-zinc-700/50">
                    <span className="block text-xl md:text-2xl font-bold text-white">
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">{t('seconds')}</span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={currentOffer.href}
                  onClick={handleClose}
                  className={`inline-flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r ${currentOffer.gradient} hover:opacity-90 text-white font-bold text-lg rounded-xl transition-all hover:shadow-lg ${accentClasses.buttonHover}`}
                >
                  {currentOffer.cta}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                {/* Fine print */}
                <p className="mt-4 text-xs text-zinc-600">
                  {currentOffer.finePrint}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
