// app/components/home/HeroVideo.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - HERO VIDEO BRUTAL v1.0
// ═══════════════════════════════════════════════════════════════════════════
//
// El hero que HIPNOTIZA y CONVIERTE.
// - Video de fondo con overlay cinematográfico
// - Texto con animaciones de entrada
// - Stats en tiempo real
// - Countdown de urgencia
// - CTAs con efectos premium
// - Scroll indicator animado
// - Mobile optimizado (imagen fallback)
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Play: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: Countdown para próximo fin de semana
// ═══════════════════════════════════════════════════════════════════════════

function useWeekendCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek);
      
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + daysUntilSaturday);
      nextSaturday.setHours(18, 0, 0, 0);

      const diff = nextSaturday.getTime() - now.getTime();
      
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: Stats animados
// ═══════════════════════════════════════════════════════════════════════════

function useAnimatedNumber(target: number, duration: number = 2000) {
  const [current, setCurrent] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setCurrent(Math.min(Math.round(increment * currentStep), target));
      if (currentStep >= steps) clearInterval(timer);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target, duration, hasStarted]);

  return { current, start: () => setHasStarted(true) };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Stat Card
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ number, suffix, label, delay }: { number: number; suffix: string; label: string; delay: number }) {
  const { current, start } = useAnimatedNumber(number);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) start(); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [start]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="text-center"
    >
      <div className="text-3xl md:text-4xl font-black text-white">
        {current}{suffix}
      </div>
      <div className="text-xs md:text-sm text-white/60 mt-1">{label}</div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

interface HeroVideoProps {
  videoSrc?: string;
  posterSrc?: string;
  fallbackImage?: string;
}

export default function HeroVideo({
  videoSrc = '/videos/hero-orbita.mp4',
  posterSrc = '/img/hero-poster.webp',
  fallbackImage = '/img/hero-fallback.webp'
}: HeroVideoProps) {
  const t = useTranslations('hero');
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const countdown = useWeekendCountdown();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay video when loaded
  useEffect(() => {
    if (videoRef.current && !isMobile) {
      videoRef.current.play().catch(() => {});
    }
  }, [isMobile, videoLoaded]);

  return (
    <motion.section
      ref={containerRef}
      className="relative h-screen min-h-[700px] max-h-[1000px] overflow-hidden"
      style={{ opacity }}
    >
      {/* Video/Image Background */}
      <motion.div className="absolute inset-0" style={{ scale }}>
        {!isMobile ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={fallbackImage}
            alt="Òrbita Events"
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Overlays cinematográficos */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
        
        {/* Vignette effect */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }} />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 h-full flex flex-col justify-center px-4 md:px-8"
        style={{ y }}
      >
        <div className="container mx-auto max-w-6xl">
          {/* Badge de urgencia */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              🔥 Próximo fin de semana en {countdown.days}d {countdown.hours}h
            </span>
          </motion.div>

          {/* Título principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6"
          >
            <span className="block">No posem música.</span>
            <span className="block mt-2">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                Creem experiències
              </span>
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mb-8"
          >
            Música + Tematització + Animació + Jocs + Efectes especials.
            <br className="hidden md:block" />
            Tot el que necessites per a un event <strong className="text-white">inolvidable</strong>.
          </motion.p>

          {/* Features rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-4 mb-10"
          >
            {[
              'Pressupost en 2 min',
              'Resposta en < 2h',
              'Equip backup 100%',
              '+ de 195 events'
            ].map((feature, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-sm text-white/70">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Icons.Check />
                </span>
                {feature}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {/* CTA Principal */}
            <Link
              href="/configurador"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 overflow-hidden rounded-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] animate-gradient" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-3 text-black font-bold text-lg">
                <Icons.Sparkles />
                <span>Pressupost Gratis</span>
              </span>
            </Link>

            {/* CTA WhatsApp */}
            <a
              href="https://wa.me/34699121023?text=Hola! M'agradaria informació sobre els vostres serveis"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-emerald-500/20 border border-white/20 hover:border-emerald-500/50 rounded-2xl backdrop-blur-sm transition-all"
            >
              <Icons.WhatsApp />
              <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                WhatsApp Directe
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 pt-8 border-t border-white/10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number={195} suffix="+" label="Events realitzats" delay={1.1} />
              <StatCard number={92} suffix="%" label="Repeteixen o recomanen" delay={1.2} />
              <StatCard number={100} suffix="%" label="Amb equip backup" delay={1.3} />
              <StatCard number={2} suffix="h" label="Temps de resposta" delay={1.4} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-white/50"
        >
          <span className="text-xs uppercase tracking-widest">Descobreix més</span>
          <Icons.ChevronDown />
        </motion.div>
      </motion.div>

      {/* Gradient animation */}
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </motion.section>
  );
}
