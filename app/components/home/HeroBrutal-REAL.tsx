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
import Link from 'next/link';
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
  return (
    <div className="text-center px-4">
      <div className="text-2xl md:text-4xl font-black text-amber-400 mb-1">
        {isLoading ? (
          <span className="inline-block w-12 h-8 bg-amber-400/20 rounded animate-pulse" />
        ) : (
          <>
            {value}
            {suffix && <span className="text-amber-300">{suffix}</span>}
          </>
        )}
      </div>
      <div className="text-xs md:text-sm text-white/60 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-black/60 backdrop-blur-sm border border-amber-500/30 rounded-lg px-3 py-2 md:px-4 md:py-3 min-w-[60px] md:min-w-[80px]">
        <span className="text-2xl md:text-4xl font-black text-amber-400 tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] md:text-xs text-white/50 uppercase tracking-wider mt-1">
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
          ⚡ {t('urgencyExpired') || 'Consulta disponibilitat ara!'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-white/70 text-sm text-center">
        {t('countdownPrefix') || 'Proper dissabte disponible en:'}
      </p>
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <CountdownUnit value={timeLeft.days} label={t('days') || 'Dies'} />
        <span className="text-2xl md:text-4xl text-amber-400/50 font-light">:</span>
        <CountdownUnit value={timeLeft.hours} label={t('hours') || 'Hores'} />
        <span className="text-2xl md:text-4xl text-amber-400/50 font-light">:</span>
        <CountdownUnit value={timeLeft.minutes} label={t('mins') || 'Mins'} />
        <span className="text-2xl md:text-4xl text-amber-400/50 font-light hidden md:block">:</span>
        <div className="hidden md:block">
          <CountdownUnit value={timeLeft.seconds} label={t('secs') || 'Segs'} />
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
            <span className="text-white/70"> {t('happyClients') || 'events feliços'}</span>
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

  // Headlines que roten - llegeix de l'array 'headlines' del JSON
  const headlinesRaw = t.raw('headlines') as Array<{line1: string, line2: string}> | undefined;
  const headlines = headlinesRaw && headlinesRaw.length > 0
    ? headlinesRaw
    : [
        { line1: t('headline1') || 'A les 4am la teva sogra', line2: t('headline2') || 'BALLAVA DESCALÇA' },
        { line1: "L'únic DJ que et garanteix", line2: 'FESTES ÈPIQUES' },
        { line1: 'Convertim el teu event en', line2: 'LLEGENDA' },
        { line1: 'No contractes un DJ', line2: 'CONTRACTA UNA EXPERIÈNCIA' },
        { line1: 'El teu casament mereix', line2: 'SER INOLVIDABLE' },
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
          <source src="/videos/hero-loop.mp4" type="video/mp4" />
        </video>
        
        {/* Fallback image mentre carrega video */}
        {!videoLoaded && (
          <Image
            src="/img/hero-fallback.webp"
            alt="Òrbita Events - DJ Barcelona"
            fill
            className="object-cover opacity-40"
            priority
          />
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
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

          {/* Badge principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold">
              <span className="animate-pulse">🔥</span>
              {t('badge') || 'DJ + So + Llums + Efectes Especials'}
              <span className="animate-pulse">🔥</span>
            </span>
          </motion.div>

          {/* Headline rotativa - dues línies */}
          <div className="min-h-[140px] md:min-h-[200px] mb-6 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentHeadline}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Línia 1 - text blanc */}
                <span className="block text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-2">
                  {headlines[currentHeadline].line1}
                </span>
                {/* Línia 2 - text destacat en gradient */}
                <span className="block text-4xl md:text-6xl lg:text-7xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
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
            className="text-lg md:text-xl text-white/70 mb-8 max-w-3xl mx-auto"
          >
            {t('subtitle') || 'Casaments, festes privades i events corporatius a Barcelona i Girona. Equipament professional de 4000W, llums LED intel·ligents i efectes especials que deixen sense alè.'}
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
              label={t('stats.years') || 'Anys experiència'}
              isLoading={statsLoading}
            />
            <AnimatedStat
              value={stats.totalEvents}
              suffix="+"
              label={t('stats.events') || 'Events realitzats'}
              isLoading={statsLoading}
            />
            <AnimatedStat
              value={stats.responseTime}
              label={t('stats.response') || 'Temps resposta'}
              isLoading={statsLoading}
            />
            <AnimatedStat
              value={stats.coverage}
              label={t('stats.coverage') || 'Cobertura'}
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
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-lg rounded-full overflow-hidden transition-all hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t('cta.primary') || 'Sol·licita Pressupost GRATIS'}
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            
            <Link
              href="/portfolio"
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-lg rounded-full hover:bg-white/20 hover:border-white/40 transition-all flex items-center justify-center gap-2"
            >
              <span>▶</span>
              {t('cta.secondary') || 'Veure Portfolio'}
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
              {t('trust.guarantee') || 'Garantia 100% satisfacció'}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              {t('trust.response') || 'Resposta en menys de 2h'}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              {t('trust.equipment') || 'Equipament professional'}
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
          <span className="text-xs uppercase tracking-widest">{t('scroll') || 'Descobreix més'}</span>
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
