// app/components/ui/HeroCinematic.tsx
// ÒRBITA EVENTS 3.0 - Hero Cinematogràfic WOW Edition
// Experiència immersiva amb logo de fons, breathing CTA, partícules multicolor

'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Sparkles,
  Play,
  ArrowRight,
  Calendar,
  Star,
  MapPin,
  Clock,
  Zap,
  X
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/site-config';
// Estadístiques reals - empresa fundada 2023
const REAL_STATS = {
  yearsExperience: '2+',
  coverage: 'BCN + GI',
  dedication: 100,
};

// Types
interface NextBooking {
  type: string;
  location: string;
  timeAgo: string;
}

export default function HeroCinematic() {
  const t = useTranslations('hero');
  const tAccessibility = useTranslations('accessibility');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Scroll progress per parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  // Estats
  const [lastBooking] = useState<NextBooking | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Stats reals i verificables
  const stats = useMemo(() => ({
    yearsExperience: REAL_STATS.yearsExperience,
    coverage: REAL_STATS.coverage,
    dedication: REAL_STATS.dedication,
  }), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animació de comptatge
  const CountUp = ({ end, suffix = '' }: { end: number; suffix?: string }) => {
    const [count, setCount] = useState(end);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
      setCount(0);

      const duration = 2000;
      const steps = 60;
      const increment = end / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [end]);

    if (!isMounted) {
      return <span>{end.toLocaleString()}{suffix}</span>;
    }

    return <span>{count.toLocaleString()}{suffix}</span>;
  };

  // Variants per animacions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  // Títol des de traduccions
  const titleLine1 = t('title.line1');
  const titleLine2 = t('title.line2');
  const titleLine3 = t('title.line3');

  // Enhanced particles with multiple colors (gold, purple, fuchsia)
  const enhancedParticles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 80 + 40,
      colorClass: i % 3 === 0
        ? 'from-amber-400/20 to-yellow-300/10'
        : i % 3 === 1
        ? 'from-purple-500/15 to-fuchsia-400/10'
        : 'from-fuchsia-400/15 to-amber-400/10',
      duration: Math.random() * 4 + 6,
      delay: Math.random() * 3,
    }));
  }, []);

  return (
    <>
      <section
        ref={containerRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#030303]"
      >
        {/* === VÍDEO BACKGROUND AMB PARALLAX === */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ scale, opacity }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/img/hero-home-visual.jpg"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>

          {/* Logo centrat amb animació */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.img
              src="/img/logoplanetatextdreta.svg"
              alt=""
              className="w-[70vw] max-w-[700px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.08, 0.15, 0.08],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                filter: 'drop-shadow(0 0 100px rgba(215, 184, 110, 0.3))'
              }}
            />
          </div>

          {/* Gradient overlay per millorar llegibilitat */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

          {/* Overlay gradient cinematogràfic */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />

          {/* Vignette effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
        </motion.div>

        {/* === PARTÍCULES MULTICOLOR MILLORADES === */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {enhancedParticles.map((p) => (
            <motion.div
              key={p.id}
              className={`absolute rounded-full bg-gradient-to-br ${p.colorClass} blur-xl`}
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 30 - 15, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: p.delay,
              }}
            />
          ))}
        </div>

        {/* === CONTINGUT PRINCIPAL === */}
        <motion.div
          className="relative z-20 max-w-7xl mx-auto px-6 py-24 text-center"
          style={{ y }}
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? "visible" : "hidden"}
        >
          {/* Badges de disponibilitat + Tematització */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-8"
            variants={itemVariants}
          >
            {/* Badge Tematització - PUNT FORT */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                         bg-gradient-to-r from-amber-500/20 to-orange-500/20
                         border border-amber-500/30 backdrop-blur-xl shadow-2xl">
              <span className="text-lg">🎭</span>
              <span className="text-amber-400 text-sm font-semibold">
                {t('themingSpecialists')}
              </span>
            </div>

            {/* Badge Disponibilitat */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-white/90 text-sm font-medium">
                {t('availableSlots', { count: 4 })}
              </span>
            </div>
          </motion.div>

          {/* TÍTOL PRINCIPAL */}
          <motion.div
            className="mb-8"
            variants={itemVariants}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-tight">
              <span className="block text-white">{titleLine1}</span>
              <span className="block text-white">{titleLine2},</span>
              <span className="block bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
                {titleLine3}
              </span>
            </h1>
          </motion.div>

          {/* Subtítol */}
          <motion.p
            className="text-xl sm:text-2xl lg:text-3xl text-white/80 max-w-4xl mx-auto mb-12 leading-relaxed"
            variants={itemVariants}
          >
            {t('subtitle')}{' '}
            <span className="text-amber-400 font-semibold">{t('subtitleBold')}</span>
            {' '}{t('subtitleEnd')}
          </motion.p>

          {/* STATS EN VIVO - Dades verificables */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-12"
            variants={itemVariants}
          >
            {[
              {
                icon: Sparkles,
                value: stats.yearsExperience,
                label: t('stats.yearsExperience'),
              },
              {
                icon: MapPin,
                value: stats.coverage,
                label: t('stats.coverage'),
              },
              {
                icon: Zap,
                value: '2h',
                label: t('stats.response'),
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <stat.icon className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-white font-bold text-lg">
                    {stat.value}
                  </div>
                  <div className="text-white/50 text-xs">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            variants={itemVariants}
          >
            {/* CTA Principal - Configurador amb BREATHING effect */}
            <Link href="/configurador">
              <motion.button
                className="group relative px-10 py-5 rounded-2xl font-bold text-lg text-black overflow-hidden"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(215, 184, 110, 0.3), 0 10px 40px rgba(215, 184, 110, 0.2)',
                    '0 0 40px rgba(215, 184, 110, 0.5), 0 15px 60px rgba(215, 184, 110, 0.3)',
                    '0 0 20px rgba(215, 184, 110, 0.3), 0 10px 40px rgba(215, 184, 110, 0.2)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient background animat */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-[length:200%_auto] animate-gradient-shift" />

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                {/* Glow ring pulse */}
                <motion.div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-400/50 via-fuchsia-500/30 to-purple-500/50 blur-lg opacity-0 group-hover:opacity-100"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <span className="relative z-10 flex items-center gap-3">
                  <Zap className="w-6 h-6" />
                  {t('configureEvent')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>
            </Link>

            {/* CTA Secundari - Veure Demo */}
            <motion.button
              onClick={() => setShowVideoModal(true)}
              className="group flex items-center gap-3 px-8 py-5 rounded-2xl font-semibold text-white bg-white/5 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Play className="w-5 h-5 text-amber-400 ml-1" />
              </div>
              <span>{t('watchDemo')}</span>
              <span className="text-white/50 text-sm">{t('demoLength')}</span>
            </motion.button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-6 text-white/60 text-sm"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span>{t('responseTime')}</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{t('webDiscount')}</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-2">
              <span className="text-xl">💯</span>
              <span>{t('satisfactionGuaranteed')}</span>
            </div>
          </motion.div>

          {/* Notificació reserva recent - Social Proof Real */}
          <AnimatePresence>
            {lastBooking && (
              <motion.div
                initial={{ opacity: 0, y: 50, x: -50 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-6 left-6 z-50 max-w-sm"
              >
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg">
                    🎉
                  </div>
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">
                      {lastBooking.type} a {lastBooking.location}
                    </div>
                    <div className="text-white/50 text-xs">
                      Reservat fa {lastBooking.timeAgo}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1.5 h-3 rounded-full bg-amber-400"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL VIDEO DEMO - NOU DISSENY
      ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowVideoModal(false)}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label={tAccessibility('closeVideo')}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Video container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-3xl blur-2xl" />

              {/* Video */}
              <video
                src="/video/hero.mp4"
                controls
                autoPlay
                playsInline
                className="relative w-full rounded-2xl shadow-2xl shadow-black/50"
                style={{ maxHeight: '80vh' }}
              >
                El teu navegador no suporta vídeo HTML5.
              </video>

              {/* Title under video */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center text-white/60 mt-4 text-sm"
              >
                🎬 Demo Òrbita Events — Experiències que es recorden
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
