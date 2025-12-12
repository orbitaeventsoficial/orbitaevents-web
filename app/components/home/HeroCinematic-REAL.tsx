'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HERO CINEMATIC 3.0 - CONNECTAT A BD (VERSIÓ DEFINITIVA)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CANVIS vs versió anterior:
 * - Stats de BD via usePublicStats() ✅
 * - Disponibilitat REAL via useAvailability() ✅
 * - Countdown amb dates REALS via useCountdown() ✅
 * - Zero dades hardcoded ✅
 * 
 * Manolo: "Cada número que veus és REAL. Zero mentides."
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/lib/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// HOOKS REALS - Connectats a BD
import { usePublicStats, useAvailability, useCountdown } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLES MÁGICAS
// ═══════════════════════════════════════════════════════════════════════════

function MagicParticles() {
  const particles = useMemo(() => {
    return [...Array(50)].map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-amber-400/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPING EFFECT
// ═══════════════════════════════════════════════════════════════════════════

function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 1000);
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span>
      {displayedText}
      <span className={`inline-block w-[3px] h-[1em] bg-amber-400 ml-1 ${showCursor ? 'animate-blink' : 'opacity-0'}`} />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COUNTDOWN TIMER - Amb data REAL de BD
// ═══════════════════════════════════════════════════════════════════════════

function CountdownTimerReal({ targetDate }: { targetDate: Date | null }) {
  const { timeLeft } = useCountdown(targetDate);

  if (!targetDate) {
    return <span className="text-white/50 text-sm">...</span>;
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      {[
        { value: timeLeft.days, label: 'D' },
        { value: timeLeft.hours, label: 'H' },
        { value: timeLeft.minutes, label: 'M' },
        { value: timeLeft.seconds, label: 'S' },
      ].map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <motion.span
            key={unit.value}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl sm:text-2xl font-black text-white tabular-nums bg-black/40 px-2 sm:px-3 py-1 rounded-lg border border-amber-500/30"
          >
            {String(unit.value).padStart(2, '0')}
          </motion.span>
          <span className="text-[10px] text-white/50 mt-1">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS ANIMADAS - Ara amb dades REALS de BD!
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedStat({ 
  value, 
  suffix, 
  label, 
  isLoading 
}: { 
  value: number | string; 
  suffix: string; 
  label: string;
  isLoading?: boolean;
}) {
  const [count, setCount] = useState(0);
  const numericValue = typeof value === 'string' ? parseInt(value) || 0 : value;

  useEffect(() => {
    if (isLoading) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [numericValue, isLoading]);

  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black text-amber-400">
        {isLoading ? (
          <span className="animate-pulse">--</span>
        ) : (
          <>{count}{suffix}</>
        )}
      </div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF BADGES - Amb dades REALS
// ═══════════════════════════════════════════════════════════════════════════

function SocialProofBadge({ 
  stats, 
  isLoading,
  t 
}: { 
  stats: { totalEvents: number; googleRating: number | null };
  isLoading: boolean;
  t: (key: string) => string;
}) {
  const proofs = [
    { 
      icon: '⭐', 
      text: stats.googleRating ? `${stats.googleRating}/5 a Google` : t('socialProof.google'), 
      color: 'text-yellow-400' 
    },
    { 
      icon: '🎉', 
      text: `+${stats.totalEvents} esdeveniments`, 
      color: 'text-green-400' 
    },
    { 
      icon: '📍', 
      text: 'Barcelona + Girona', 
      color: 'text-pink-400' 
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % proofs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [proofs.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
      >
        <span className={`text-lg ${proofs[currentIndex].color}`}>{proofs[currentIndex].icon}</span>
        <span className="text-sm text-white/80">
          {isLoading ? '...' : proofs[currentIndex].text}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroCinematicBrutalReal() {
  const t = useTranslations('hero');
  const tWhatsapp = useTranslations('whatsappMessages');
  
  // 🔥 DADES REALS DE BD!
  const { stats, isLoading: statsLoading } = usePublicStats();
  const { countdownTarget, currentMonthAvailable, isLoading: availLoading } = useAvailability();
  
  const isLoading = statsLoading || availLoading;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-black">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-amber-900/20" />
        
        {/* Magic particles */}
        <MagicParticles />
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto pt-20 pb-32"
      >
        {/* Badge amb prova social REAL */}
        <motion.div variants={itemVariants} className="mb-6">
          <SocialProofBadge stats={stats} isLoading={isLoading} t={t} />
        </motion.div>

        {/* Headline principal */}
        <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
          <span className="block">{t('headline.line1')}</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
            <TypingText text={t('headline.line2')} delay={800} />
          </span>
        </motion.h1>

        {/* Punchline */}
        <motion.p
          variants={itemVariants}
          className="mt-6 sm:mt-8 text-2xl sm:text-3xl md:text-4xl font-black"
        >
          <span className="relative inline-block">
            <span className="text-amber-400">{t('punchline')}</span>
            <span 
              className="absolute inset-0 blur-xl opacity-50 text-amber-400"
              aria-hidden="true"
            >
              {t('punchline')}
            </span>
          </span>
        </motion.p>

        {/* Serveis */}
        <motion.div
          variants={itemVariants}
          className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6"
        >
          {[
            { icon: '🎧', labelKey: 'serviceLabels.dj' },
            { icon: '🔊', labelKey: 'serviceLabels.sound' },
            { icon: '💡', labelKey: 'serviceLabels.lights' },
            { icon: '✨', labelKey: 'serviceLabels.magic' },
          ].map((service, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1, y: -2 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 hover:border-amber-500/30 transition-colors"
            >
              <span className="text-lg">{service.icon}</span>
              <span className="text-sm text-white/70">{t(service.labelKey)}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* 🔥 STATS REALS DE BD! 🔥 */}
        <motion.div
          variants={itemVariants}
          className="mt-8 grid grid-cols-3 gap-6 sm:gap-10"
        >
          <AnimatedStat 
            value={stats.yearsExperience} 
            suffix="" 
            label={t('stats.years')} 
            isLoading={isLoading}
          />
          <AnimatedStat 
            value={stats.totalEvents} 
            suffix="+" 
            label={t('stats.events')} 
            isLoading={isLoading}
          />
          <AnimatedStat 
            value={stats.responseTime} 
            suffix="" 
            label={t('stats.responseTime')} 
            isLoading={isLoading}
          />
        </motion.div>

        {/* CTA PRINCIPAL */}
        <motion.div variants={itemVariants} className="mt-10 w-full sm:w-auto">
          <Link
            href="/contacto"
            className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 overflow-hidden rounded-full font-bold text-lg transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-[length:200%_100%] animate-shimmer" />
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
              style={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.6)' }} 
            />
            <span className="relative flex items-center gap-3 text-black">
              <span>📝</span>
              <span>{t('cta.primary')}</span>
              <motion.svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </span>
          </Link>
        </motion.div>

        {/* CTAs SECUNDARIS */}
        <motion.div
          variants={itemVariants}
          className="mt-5 flex items-center gap-6"
        >
          <Link
            href={`https://wa.me/34699121023?text=${encodeURIComponent(tWhatsapp('general'))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/60 hover:text-green-400 transition-colors group"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl"
            >
              💬
            </motion.span>
            <span className="text-sm group-hover:underline">{t('cta.whatsapp')}</span>
          </Link>
          
          <span className="text-white/20">|</span>
          
          <Link
            href="tel:+34699121023"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <span className="text-xl">📞</span>
            <span className="text-sm group-hover:underline">{t('cta.call')}</span>
          </Link>
        </motion.div>

        {/* 🔥 URGÈNCIA AMB DADES REALS! 🔥 */}
        <motion.div
          variants={itemVariants}
          className="mt-10 p-4 sm:p-6 bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 backdrop-blur-sm rounded-2xl border border-red-500/30"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-semibold text-sm sm:text-base">
                🔥 {t('urgency.nextDate')}
              </span>
            </div>

            {/* Countdown amb data REAL de BD */}
            <CountdownTimerReal targetDate={countdownTarget} />
          </div>

          <p className="mt-3 text-xs sm:text-sm text-white/50 text-center">
            {t('urgency.remaining')}{' '}
            <span className="text-amber-400 font-bold">
              {isLoading ? '--' : currentMonthAvailable} {t('urgency.saturdays')}
            </span>{' '}
            {t('urgency.in')} {new Date().toLocaleDateString('ca-ES', { month: 'long' })}
          </p>
        </motion.div>

      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2"
      >
        <span className="text-xs text-white/40">{t('scrollMore')}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
        >
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-amber-400 rounded-full" 
          />
        </motion.div>
      </motion.div>

      {/* CTA FIX MÒBIL */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/98 to-transparent sm:hidden safe-area-bottom">
        <Link
          href="/contacto"
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-400 active:from-amber-600 active:to-amber-500 text-black font-bold text-base rounded-full shadow-lg shadow-amber-500/30"
        >
          <span>📝</span>
          <span>{t('mobileCta')}</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Estils */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
        .safe-area-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </section>
  );
}
