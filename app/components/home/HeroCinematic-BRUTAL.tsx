'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HERO CINEMATIC 2.0 - LA OBRA MAESTRA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Versión BRUTAL con:
 * - Efectos cinematográficos de Hollywood
 * - Animaciones de impacto que hipnotizan
 * - Copy que vende EMOCIONES
 * - Scarcity real con countdown
 * - CTAs irresistibles que convierten
 * - Particles mágicas en el fondo
 * - Efecto de typing para el headline
 * 
 * ARQUITECTURA MANOLO:
 * IMPACTO (3 seg) → Video hero inmersivo
 * DESEO (10 seg) → Transformación visible
 * CREDIBILIDAD (30 seg) → Prueba social aplastante
 * URGENCIA (45 seg) → Calendario real
 * ACCIÓN (60 seg) → Oferta irrechazable
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from '@/lib/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLES MÁGICAS - Fondo con partículas doradas flotantes
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
// TYPING EFFECT - Texto que se escribe solo
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
// COUNTDOWN TIMER - Escasez real
// ═══════════════════════════════════════════════════════════════════════════

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

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
// STATS ANIMADAS - Números que impactan
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-black text-amber-400">
        {count}{suffix}
      </div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF BADGES - Credibilidad instantánea
// ═══════════════════════════════════════════════════════════════════════════

function SocialProofBadge({ t }: { t: (key: string) => string }) {
  const proofs = [
    { icon: '⭐', textKey: 'socialProof.google', color: 'text-yellow-400' },
    { icon: '🎉', textKey: 'socialProof.events', color: 'text-green-400' },
    { icon: '💍', textKey: 'socialProof.weddings', color: 'text-pink-400' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % proofs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [proofs.length]);

  return (
    <div className="h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-2"
        >
          <span className={proofs[currentIndex].color}>{proofs[currentIndex].icon}</span>
          <span className="text-sm text-white/70">{t(proofs[currentIndex].textKey)}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO PRINCIPAL - LA BESTIA
// ═══════════════════════════════════════════════════════════════════════════

export function HeroCinematicBrutal() {
  const t = useTranslations('hero');
  const tWhatsapp = useTranslations('whatsappMessages');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Parallax effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.5], [0.5, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Fecha para countdown - Próximo sábado disponible
  const nextAvailableDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(15);
    return date;
  }, []);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Variants para animaciones staggered
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const glowVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <section ref={containerRef} className="relative min-h-[100svh] w-full overflow-hidden bg-black">
      
      {/* ═══════════════════════════════════════════════════════════════════
          CAPA 1: VIDEO BACKGROUND CON PARALLAX
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{ scale: videoScale, opacity: videoOpacity }}
        className="absolute inset-0"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          poster="/img/hero-home-visual.jpg"
        >
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          CAPA 2: OVERLAYS CINEMATOGRÁFICOS
          ═══════════════════════════════════════════════════════════════════ */}
      
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)]" />
      
      {/* Gold accent gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/20 via-transparent to-purple-900/20" />
      
      {/* Scan lines (subtle) */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          CAPA 3: PARTÍCULAS MÁGICAS
          ═══════════════════════════════════════════════════════════════════ */}
      <MagicParticles />

      {/* ═══════════════════════════════════════════════════════════════════
          CAPA 4: CONTENIDO PRINCIPAL
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{ y: contentY }}
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className="relative z-10 min-h-[100svh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-20 pb-32 sm:pb-24"
      >
        
        {/* SOCIAL PROOF - Arriba de todo */}
        <motion.div variants={itemVariants} className="mb-6">
          <SocialProofBadge t={t} />
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            HEADLINE BRUTAL - EL GANCHO EMOCIONAL
            ═══════════════════════════════════════════════════════════════ */}
        <motion.h1 variants={itemVariants} className="max-w-5xl">
          {/* Línea 1: La escena */}
          <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white/80 leading-tight mb-2">
            {showContent && <TypingText text={t('headline1')} delay={500} />}
          </span>
          
          {/* Línea 2: El impacto */}
          <motion.span 
            variants={glowVariants}
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] mt-2"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f59e0b 50%, #ffffff 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-shift 4s ease infinite',
            }}
          >
            {t('headline2')}
          </motion.span>
        </motion.h1>

        {/* PUNCHLINE - Remate épico */}
        <motion.p
          variants={itemVariants}
          className="mt-6 sm:mt-8 text-2xl sm:text-3xl md:text-4xl font-black"
        >
          <span className="relative inline-block">
            <span className="text-amber-400">{t('punchline')}</span>
            {/* Glow behind */}
            <span 
              className="absolute inset-0 blur-xl opacity-50 text-amber-400"
              aria-hidden="true"
            >
              {t('punchline')}
            </span>
          </span>
        </motion.p>

        {/* SERVICIOS - Iconos minimalistas */}
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

        {/* STATS ANIMADAS */}
        <motion.div
          variants={itemVariants}
          className="mt-8 grid grid-cols-3 gap-6 sm:gap-10"
        >
          <AnimatedStat value={2} suffix="+" label={t('stats.years')} />
          <AnimatedStat value={48} suffix="+" label={t('stats.events')} />
          <AnimatedStat value={2} suffix="h" label={t('stats.responseTime')} />
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════
            CTA PRINCIPAL - EL BOTÓN QUE CONVIERTE
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div variants={itemVariants} className="mt-10 w-full sm:w-auto">
          <Link
            href="/contacto"
            className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 overflow-hidden rounded-full font-bold text-lg transition-all duration-300"
          >
            {/* Gradient background animado */}
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-[length:200%_100%] animate-shimmer" />
            
            {/* Glow effect */}
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
              style={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.6)' }} 
            />
            
            {/* Content */}
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

        {/* CTAs SECUNDARIOS */}
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

        {/* ═══════════════════════════════════════════════════════════════
            URGENCIA - SCARCITY REAL
            ═══════════════════════════════════════════════════════════════ */}
        <motion.div
          variants={itemVariants}
          className="mt-10 p-4 sm:p-6 bg-gradient-to-r from-red-950/50 via-red-900/30 to-red-950/50 backdrop-blur-sm rounded-2xl border border-red-500/30"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Indicador pulsante */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-semibold text-sm sm:text-base">
                🔥 {t('urgency.nextDate')}
              </span>
            </div>

            {/* Countdown */}
            <CountdownTimer targetDate={nextAvailableDate} />
          </div>

          <p className="mt-3 text-xs sm:text-sm text-white/50 text-center" suppressHydrationWarning>
            {t('urgency.remaining')} <span className="text-amber-400 font-bold">2 {t('urgency.saturdays')}</span> {t('urgency.in')} {new Date().toLocaleDateString('ca-ES', { month: 'long' })}
          </p>
        </motion.div>

      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          SCROLL INDICATOR - Solo desktop
          ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FIJO MÓVIL - Siempre visible
          ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          ESTILOS ADICIONALES
          ═══════════════════════════════════════════════════════════════════ */}
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

export default HeroCinematicBrutal;
