'use client';

// ═══════════════════════════════════════════════════════════════════════════
// HERO BRUTAL REAL - LA MILLOR PUTA HERO DEL PLANETA
// ═══════════════════════════════════════════════════════════════════════════
// 
// 100% connectat a Base de Dades:
// - Stats REALS (events completats, valoració mitjana)
// - Disponibilitat REAL (calendari)
// - Countdown REAL (proper dissabte disponible)
// - Zero dades fake
//
// Versió: 3.0 DEFINITIVA - Desembre 2025
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  usePublicStats, 
  useAvailability, 
  useCountdown 
} from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AnimatedStatProps {
  value: number | string;
  suffix?: string;
  label: string;
  isLoading?: boolean;
}

interface CountdownUnitProps {
  value: number;
  label: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedStat({ value, suffix = '', label, isLoading }: AnimatedStatProps) {
  // Detectar si el valor és text llarg (cobertura) per ajustar el tamany
  const isLongText = typeof value === 'string' && value.length > 5;

  return (
    <div className="group text-center px-6 py-3 relative">
      {/* Glow subtil en hover */}
      <div className="absolute inset-0 bg-amber-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Valor */}
      <div className="relative">
        <div className={`font-black mb-1 ${isLongText ? 'text-xl md:text-2xl lg:text-3xl' : 'text-3xl md:text-5xl'}`}>
          {isLoading ? (
            <span className="inline-block w-16 h-10 bg-gradient-to-r from-amber-400/20 to-amber-400/40 rounded-lg animate-pulse" />
          ) : (
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              {value}
              {suffix && <span className="text-amber-300">{suffix}</span>}
            </span>
          )}
        </div>
        <div className="text-xs md:text-sm text-white/70 uppercase tracking-widest font-medium">
          {label}
        </div>
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center group">
      <div className="relative bg-black/70 backdrop-blur-md border border-amber-500/40 rounded-xl px-4 py-3 md:px-5 md:py-4 min-w-[70px] md:min-w-[90px] overflow-hidden group-hover:border-amber-400/60 transition-colors duration-300">
        {/* Reflex superior - efecte vidre */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        {/* Número amb glow */}
        <span className="relative text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 tabular-nums drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] md:text-xs text-white/60 uppercase tracking-widest font-medium mt-2">
        {label}
      </span>
    </div>
  );
}

function CountdownTimerReal() {
  const t = useTranslations('hero');
  const { countdownTarget, data, isLoading } = useAvailability();
  const { timeLeft, isExpired } = useCountdown(countdownTarget);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-lg px-4 py-3 min-w-[80px]">
            <div className="w-12 h-10 bg-amber-400/20 rounded animate-pulse mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (isExpired || !countdownTarget) {
    return (
      <div className="text-center py-4">
        <span className="text-amber-400 font-bold animate-pulse">
          ⚡ {t('urgencyExpired')}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-white/70 text-sm text-center">
        {t('countdownPrefix')}
      </p>
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <CountdownUnit value={timeLeft.days} label={t('days')} />
        <span className="text-2xl md:text-4xl text-amber-400/50 font-light">:</span>
        <CountdownUnit value={timeLeft.hours} label={t('hours')} />
        <span className="text-2xl md:text-4xl text-amber-400/50 font-light">:</span>
        <CountdownUnit value={timeLeft.minutes} label={t('mins')} />
        <span className="text-2xl md:text-4xl text-amber-400/50 font-light hidden md:block">:</span>
        <div className="hidden md:block">
          <CountdownUnit value={timeLeft.seconds} label={t('secs')} />
        </div>
      </div>
      {data.scarcityMessage && (
        <p className="text-center text-sm">
          <span className={`
            ${data.urgencyLevel === 'critical' ? 'text-red-400 animate-pulse' : ''}
            ${data.urgencyLevel === 'high' ? 'text-orange-400' : ''}
            ${data.urgencyLevel === 'medium' ? 'text-amber-400' : ''}
            ${data.urgencyLevel === 'low' ? 'text-white/60' : ''}
          `}>
            🔥 {data.scarcityMessage}
          </span>
        </p>
      )}
    </div>
  );
}

function SocialProofBadge() {
  const t = useTranslations('hero');
  const { stats, isLoading } = usePublicStats();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-full px-4 py-2"
    >
      {/* Avatars stack */}
      <div className="flex -space-x-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-black flex items-center justify-center text-xs font-bold text-black"
          >
            {['🎉', '💍', '🎊', '⭐'][i]}
          </div>
        ))}
      </div>
      
      {/* Text */}
      <div className="text-sm">
        {isLoading ? (
          <span className="inline-block w-20 h-4 bg-white/20 rounded animate-pulse" />
        ) : (
          <>
            <span className="text-amber-400 font-bold">{stats.totalEvents}+</span>
            <span className="text-white/70"> {t('happyClients')}</span>
          </>
        )}
      </div>
      
      {/* Rating */}
      <div className="flex items-center gap-1 pl-2 border-l border-white/20">
        <span className="text-amber-400">★</span>
        <span className="text-white font-bold">
          {isLoading ? '--' : stats.averageRating.toFixed(1)}
        </span>
      </div>
    </motion.div>
  );
}

function GoogleRatingBadge() {
  const { stats, isLoading } = usePublicStats();
  
  if (isLoading || !stats.googleRating) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.7 }}
      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span className="text-white text-sm font-medium">{stats.googleRating}</span>
      <span className="text-amber-400 text-sm">★</span>
      <span className="text-white/60 text-xs">({stats.googleReviewsCount})</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroBrutalReal() {
  const t = useTranslations('hero');
  const { stats, isLoading: statsLoading } = usePublicStats();
  const { data: availability, isLoading: availLoading } = useAvailability();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Headlines des de traduccions
  const headlines = [
    { line1: t('headlines.0.line1'), line2: t('headlines.0.line2') },
    { line1: t('headlines.1.line1'), line2: t('headlines.1.line2') },
    { line1: t('headlines.2.line1'), line2: t('headlines.2.line2') },
    { line1: t('headlines.3.line1'), line2: t('headlines.3.line2') },
    { line1: t('headlines.4.line1'), line2: t('headlines.4.line2') },
  ];

  const [currentHeadline, setCurrentHeadline] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [headlines.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-40' : 'opacity-0'}`}
        >
          <source src="/video/promohalloween.mp4" type="video/mp4" />
        </video>
        
        {/* Fallback image mentre carrega video */}
        {!videoLoaded && (
          <Image
            src="/img/hero-home-visual.jpg"
            alt="Òrbita Events - DJ Barcelona"
            fill
            sizes="100vw"
            className="object-cover opacity-40"
            priority
          />
        )}
        
        {/* Overlays - Reduït per més lluminositat */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-amber-900/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Social Proof Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap justify-center gap-3"
          >
            <SocialProofBadge />
            <GoogleRatingBadge />
          </motion.div>

          {/* Badge principal - Premium amb glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <span className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold overflow-hidden group">
              {/* Fons gradient animat */}
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 bg-[length:200%_auto] animate-shimmer pointer-events-none" />
              {/* Glow blur */}
              <span className="absolute inset-0 blur-xl bg-amber-500/50 scale-150 opacity-50 pointer-events-none" />
              {/* Contingut */}
              <span className="relative z-10 flex items-center gap-2 text-black">
                <span className="animate-bounce">🔥</span>
                {t('badge')}
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🔥</span>
              </span>
            </span>
          </motion.div>

          {/* Headline rotativa - Premium amb efectes */}
          <div className="min-h-[160px] md:min-h-[220px] mb-8 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentHeadline}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                {/* Línia 1 - text blanc amb ombra */}
                <span className="block text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {headlines[currentHeadline].line1}
                </span>
                {/* Línia 2 - gradient amb glow espectacular */}
                <span className="block text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                  {headlines[currentHeadline].line2}
                </span>
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Subtítol */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl lg:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-medium [text-shadow:_0_2px_20px_rgba(0,0,0,0.9),_0_4px_40px_rgba(0,0,0,0.7)]"
          >
            {t('subtitle')}
          </motion.p>

          {/* STATS REALS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6 md:gap-8 mb-10 py-6 border-y border-white/10"
          >
            <AnimatedStat
              value={stats.yearsExperience}
              label={t('stats.years')}
              isLoading={statsLoading}
            />
            <AnimatedStat
              value={stats.totalEvents}
              suffix="+"
              label={t('stats.events')}
              isLoading={statsLoading}
            />
            <AnimatedStat
              value={stats.responseTime}
              label={t('stats.response')}
              isLoading={statsLoading}
            />
            <AnimatedStat
              value={stats.coverage}
              label={t('stats.coverage')}
              isLoading={statsLoading}
            />
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <Link
              href="/contacto"
              className="group relative w-full sm:w-auto px-10 py-5 overflow-hidden rounded-full transform hover:scale-105 transition-all duration-500 hover:shadow-[0_0_60px_rgba(251,191,36,0.4)]"
            >
              {/* Fons base gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 pointer-events-none" />
              
              {/* Shimmer animat */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
              
              {/* Glow pulsant */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 blur-xl animate-pulse" />
              </div>
              
              {/* Contingut */}
              <span className="relative z-10 flex items-center justify-center gap-3 text-black font-black text-lg tracking-wide">
                {t('cta.primary')}
                <span className="group-hover:translate-x-2 transition-transform duration-300 text-xl">→</span>
              </span>
            </Link>
            
            <Link
              href="/portfolio"
              className="group w-full sm:w-auto px-10 py-5 relative overflow-hidden rounded-full border-2 border-white/20 hover:border-amber-400/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(251,191,36,0.2)]"
            >
              {/* Fons glass */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm group-hover:bg-white/10 transition-all duration-500 pointer-events-none" />
              
              {/* Contingut */}
              <span className="relative z-10 flex items-center justify-center gap-3 text-white font-semibold text-lg">
                <span className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full group-hover:bg-amber-500/20 transition-colors duration-300">▶</span>
                {t('cta.secondary')}
              </span>
            </Link>
          </motion.div>

          {/* Countdown i Urgència */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-black/40 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6 max-w-xl mx-auto"
          >
            <CountdownTimerReal />
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              {t('trust.guarantee')}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              {t('trust.response')}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              {t('trust.equipment')}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs uppercase tracking-widest">{t('scroll')}</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2"
          >
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
