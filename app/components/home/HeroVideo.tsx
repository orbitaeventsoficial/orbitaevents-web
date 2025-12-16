// app/components/home/HeroVideo.tsx
// ═══════════════════════════════════════════════════════════════════════════
// HERO VIDEO - AMB SCROLL DELAY I STATS QUE FUNCIONEN
// Fix: El fundido ara comença més tard (després de 200px scroll)
// Fix: Stats dinàmics des de la BBDD (48+ events mínim)
// Fix: Internacionalització CA/ES completa
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { usePublicStats } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: Números animats
// ═══════════════════════════════════════════════════════════════════════════

function useAnimatedNumber(target: number, duration: number = 2000, trigger: boolean = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);

      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, trigger]);

  return value;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS DATA (Bilingüe) - Ara dinàmic des de BBDD
// ═══════════════════════════════════════════════════════════════════════════

interface StatData {
  value: number;
  suffix: string;
  labelCa: string;
  labelEs: string;
}

// Stats estàtics (no depenen de BBDD)
const STATIC_STATS: StatData[] = [
  { value: 92, suffix: '%', labelCa: 'Repeteixen o recomanen', labelEs: 'Repiten o recomiendan' },
  { value: 100, suffix: '%', labelCa: 'Amb equip backup', labelEs: 'Con equipo backup' },
  { value: 2, suffix: 'h', labelCa: 'Temps de resposta', labelEs: 'Tiempo de respuesta' },
];

// Helper per crear stats amb valor dinàmic d'events
const getStatsData = (totalEvents: number): StatData[] => [
  { value: totalEvents, suffix: '+', labelCa: 'Events realitzats', labelEs: 'Eventos realizados' },
  ...STATIC_STATS,
];

// ═══════════════════════════════════════════════════════════════════════════
// STAT ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function StatItem({
  stat,
  index,
  isVisible,
  isEs
}: {
  stat: StatData;
  index: number;
  isVisible: boolean;
  isEs: boolean;
}) {
  const animatedValue = useAnimatedNumber(stat.value, 2000, isVisible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        ease: 'easeOut'
      }}
      className="text-center"
    >
      <div className="flex items-baseline justify-center">
        <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          {animatedValue}
        </span>
        <span className="text-xl md:text-2xl font-bold text-amber-400 ml-0.5">
          {stat.suffix}
        </span>
      </div>
      <p className="text-xs md:text-sm text-zinc-400 mt-1">
        {isEs ? stat.labelEs : stat.labelCa}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroVideo() {
  const t = useTranslations('common');
  const isEs = t('language') === 'es';

  // Stats dinàmics des de BBDD
  const { stats } = usePublicStats();
  const statsData = getStatsData(stats.totalEvents);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // SCROLL PARALLAX - COMENÇA MÉS TARD
  // ═══════════════════════════════════════════════════════════════════════
  const { scrollY } = useScroll();

  // El fade comença després de 200px scroll
  const opacity = useTransform(
    scrollY,
    [0, 200, 800],
    [1, 1, 0]
  );

  const scale = useTransform(
    scrollY,
    [0, 200, 800],
    [1, 1, 1.1]
  );

  const y = useTransform(
    scrollY,
    [0, 800],
    [0, 150]
  );

  const contentY = useTransform(
    scrollY,
    [0, 200, 600],
    [0, 0, -50]
  );

  const contentOpacity = useTransform(
    scrollY,
    [0, 300, 600],
    [1, 1, 0]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // STATS TRIGGER - Després de 1.5s
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Detectar mòbil
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autoplay video
  useEffect(() => {
    if (videoRef.current && !isMobile) {
      videoRef.current.play().catch(() => {});
    }
  }, [isMobile]);

  // ═══════════════════════════════════════════════════════════════════════
  // TEXTOS BILINGÜES
  // ═══════════════════════════════════════════════════════════════════════
  const texts = {
    badge: isEs ? '✨ Creadores de Experiencias Inmersivas' : '✨ Creadors d\'Experiències Immersives',
    title1: isEs ? 'No ponemos música.' : 'No posem música.',
    title2: isEs ? 'Creamos experiencias.' : 'Creem experiències.',
    subtitle: isEs
      ? 'Tematización + DJ profesional para bodas y eventos en Barcelona y Girona.'
      : 'Tematització + DJ professional per a casaments i events a Barcelona i Girona.',
    trust1: isEs ? 'Presupuesto en 2 min' : 'Pressupost en 2 min',
    trust2: isEs ? 'Respuesta en < 2h' : 'Resposta en < 2h',
    trust3: isEs ? 'Equipo backup 100%' : 'Equip backup 100%',
    cta1: isEs ? 'Presupuesto Gratis' : 'Pressupost Gratis',
    cta2: isEs ? 'WhatsApp Directo' : 'WhatsApp Directe',
    scroll: isEs ? 'Descubre más' : 'Descobreix més',
  };

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[700px] overflow-hidden bg-black"
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VIDEO BACKGROUND */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity, scale, y }}
      >
        {!isMobile ? (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            poster="/img/hero-poster.webp"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/hero-orbita.mp4" type="video/mp4" />
          </video>
        ) : (
          <Image
            src="/img/hero-fallback.webp"
            alt="Òrbita Events"
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 mb-6"
          >
            <span className="text-amber-400 text-sm font-medium">
              {texts.badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
          >
            {texts.title1}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              {texts.title2}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-lg md:text-xl text-zinc-300 mb-8 max-w-2xl mx-auto"
          >
            {texts.subtitle}
          </motion.p>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-zinc-400"
          >
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> {texts.trust1}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> {texts.trust2}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> {texts.trust3}
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/configurador"
              className="
                inline-flex items-center justify-center gap-2
                px-8 py-4
                bg-gradient-to-r from-amber-500 to-amber-400
                text-zinc-900 font-bold text-lg
                rounded-xl
                hover:from-amber-400 hover:to-amber-300
                hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25
                transition-all duration-300
              "
            >
              <span>✨</span>
              {texts.cta1}
            </Link>

            <a
              href="https://wa.me/34699121023?text=Hola! M'agradaria informació sobre els vostres serveis"
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center justify-center gap-2
                px-8 py-4
                bg-white/10 backdrop-blur-sm
                text-white font-semibold text-lg
                rounded-xl
                border border-white/20
                hover:bg-white/20
                hover:scale-105
                transition-all duration-300
              "
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {texts.cta2}
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATS - AMB DELAY I VALORS REALS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-gradient-to-t from-black via-black/90 to-transparent pt-16 pb-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {statsData.map((stat, index) => (
                <StatItem
                  key={stat.labelCa}
                  stat={stat}
                  index={index}
                  isVisible={statsVisible}
                  isEs={isEs}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <span className="text-xs uppercase tracking-wider">{texts.scroll}</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
