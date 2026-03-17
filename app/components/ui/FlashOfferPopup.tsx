'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
const OFFER_BASE = {
  id: 'flash-250',
  type: 'fixed',
  value: 250,
  originalValue: 450,
  href: '/contacto?pack=oferta-flash',
  gradient: 'from-amber-500 to-orange-500',
  accentColor: 'amber',
} as const;

const STORAGE_KEY = 'flashOfferDismissed';
const COOKIE_CONSENT_KEY = 'orbita_cookie_consent';
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
  const offer = useMemo<OfferConfig>(() => {
    const rawFeatures = t.raw('features');
    const features = Array.isArray(rawFeatures) ? rawFeatures : [];
    return {
      ...OFFER_BASE,
      badge: t('badge'),
      title: t('title'),
      description: t('description'),
      features,
      cta: t('cta', { price: OFFER_BASE.value }),
      finePrint: t('finePrint'),
    };
  }, [t]);
  const [isVisible, setIsVisible] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ minutes: 15, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const saveText = t('save', { amount: (offer.originalValue ?? 0) - offer.value });
  const closeLabel = t('close');
  const countdownText = t('countdown');
  const minutesText = t('minutes');
  const secondsText = t('seconds');
  const hasUnresolvedCopy = [
    offer.badge,
    offer.title,
    offer.description,
    offer.cta,
    offer.finePrint,
    saveText,
    closeLabel,
    countdownText,
    minutesText,
    secondsText,
  ].some((value) => value.includes('flashOffer.'));

  // Marcar componente como montado (solo cliente)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Comprovar si s'ha de mostrar
  useEffect(() => {
    if (!isMounted) return;

    // No mostrar fins que l'usuari hagi gestionat cookies
    const consentGiven = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consentGiven) {
      return;
    }

    // Comprovar si ja s'ha tancat recentment
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return; // No mostrar si s'ha tancat recentment
      }
    }

    // Mostrar després de 25 segons (després de la intro)
    const timer = setTimeout(() => {
      const now = Date.now();
      setStartTime(now);
      setIsVisible(true);
    }, 25000);

    return () => clearTimeout(timer);
  }, [isMounted]);

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

  // Si faltan traducciones, no mostramos popup para evitar textos raros
  if (hasUnresolvedCopy) {
    return null;
  }

  const accentClasses = offer.accentColor === 'amber'
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
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div className={`relative w-full max-w-xs bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl border ${accentClasses.border} shadow-2xl ${accentClasses.shadow} overflow-hidden pointer-events-auto`}>

              {/* Glow effect */}
              <div className={`absolute -top-20 -right-20 w-40 h-40 ${accentClasses.glow1} rounded-full blur-3xl`} />
              <div className={`absolute -bottom-20 -left-20 w-40 h-40 ${accentClasses.glow2} rounded-full blur-3xl`} />

              {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors z-10"
                  aria-label={closeLabel}
                >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="relative p-5 text-center">

                {/* Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${accentClasses.badge} border rounded-full mb-4`}>
                  <span className={`w-1.5 h-1.5 ${accentClasses.badgeDot} rounded-full animate-pulse`} />
                  <span className={`${accentClasses.badgeText} text-xs font-medium`}>{offer.badge}</span>
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                  {offer.title}
                </h2>

                {/* Description */}
                <p className="text-zinc-400 text-sm mb-4">
                  {offer.description}
                </p>

                {/* Value display */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2">
                    {offer.originalValue && (
                      <span className="text-lg text-zinc-500 line-through">
                        {offer.originalValue}€
                      </span>
                    )}
                    <span className={`text-4xl md:text-5xl font-black bg-gradient-to-r ${offer.gradient} bg-clip-text text-transparent`}>
                      {offer.value}€
                    </span>
                  </div>
                  {offer.originalValue && (
                    <span className="text-green-400 text-xs font-medium">
                      {saveText}
                    </span>
                  )}
                </div>

                {/* Features */}
                {offer.features && (
                  <div className="text-left bg-zinc-800/50 rounded-lg p-3 mb-4 border border-zinc-700/50">
                    <ul className="space-y-1">
                      {offer.features.map((feature, i) => (
                        <li key={i} className="text-zinc-300 text-xs">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Countdown - Solo minutos y segundos */}
                <div className="relative mb-4">
                  {/* Text d'urgència */}
                  <div className="text-center mb-2">
                    <span className="text-red-400 text-sm font-bold uppercase tracking-wide animate-pulse">
                      ⏰ {countdownText}
                    </span>
                  </div>

                  {/* Countdown amb recuadre vermell */}
                  <div className="relative p-3 rounded-lg border-2 border-red-500 bg-red-950/30">
                    {/* Glow vermell */}
                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-lg" />

                    <div className="relative grid grid-cols-2 gap-2">
                      <div className="bg-black/40 rounded-lg p-2 border border-red-500/30">
                        <span className="block text-2xl md:text-3xl font-bold text-red-400">
                          {timeLeft.minutes.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-red-300/70 uppercase font-semibold">{minutesText}</span>
                      </div>
                      <div className="bg-black/40 rounded-lg p-2 border border-red-500/30">
                        <span className="block text-2xl md:text-3xl font-bold text-red-400">
                          {timeLeft.seconds.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-red-300/70 uppercase font-semibold">{secondsText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={offer.href}
                  onClick={handleClose}
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r ${offer.gradient} hover:opacity-90 text-white font-bold text-base rounded-lg transition-all hover:shadow-lg ${accentClasses.buttonHover}`}
                >
                  {offer.cta}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                {/* Fine print */}
                <p className="mt-3 text-[10px] text-zinc-600">
                  {offer.finePrint}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
