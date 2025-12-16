// app/components/home/HeroStats.tsx
// ═══════════════════════════════════════════════════════════════════════════
// HERO STATS - Números animats amb delay
// ═══════════════════════════════════════════════════════════════════════════
// - Números animats dinàmics des de BBDD (48+ events mínim)
// - Delay més llarg (apareixen més tard)
// - Fons més llegible
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePublicStats } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// DADES
// ═══════════════════════════════════════════════════════════════════════════

interface Stat {
  value: string;
  suffix?: string;
  label: string;
  labelEs: string;
}

// Stats estàtics (no depenen de BBDD)
const STATIC_STATS: Stat[] = [
  { value: '92', suffix: '%', label: 'Repeteixen o recomanen', labelEs: 'Repiten o recomiendan' },
  { value: '100', suffix: '%', label: 'Amb equip backup', labelEs: 'Con equipo backup' },
  { value: '2', suffix: 'h', label: 'Temps de resposta', labelEs: 'Tiempo de respuesta' },
];

// Helper per crear stats amb valor dinàmic d'events
const getStats = (totalEvents: number): Stat[] => [
  { value: String(totalEvents), suffix: '+', label: 'Events realitzats', labelEs: 'Eventos realizados' },
  ...STATIC_STATS,
];

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: Animar números
// ═══════════════════════════════════════════════════════════════════════════

function useAnimatedNumber(end: number, duration: number = 2000, start: boolean = false) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!start) {
      setCurrent(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return current;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: Stat individual
// ═══════════════════════════════════════════════════════════════════════════

function AnimatedStat({
  stat,
  index,
  isVisible,
  isEs
}: {
  stat: Stat;
  index: number;
  isVisible: boolean;
  isEs: boolean;
}) {
  const numericValue = parseInt(stat.value, 10);
  const animatedValue = useAnimatedNumber(numericValue, 2000, isVisible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay: 0.8 + (index * 0.15), // DELAY MÉS LLARG (0.8s base)
        ease: 'easeOut'
      }}
      className="text-center"
    >
      {/* Valor - MÉS GRAN i VISIBLE */}
      <div className="flex items-baseline justify-center">
        <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
          {animatedValue}
        </span>
        <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-amber-400 ml-0.5">
          {stat.suffix}
        </span>
      </div>

      {/* Label - MÉS VISIBLE */}
      <p className="text-sm md:text-base text-zinc-300 mt-1 font-medium">
        {isEs ? stat.labelEs : stat.label}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroStats() {
  const t = useTranslations('common');
  const isEs = t('language') === 'es';

  // Stats dinàmics des de BBDD
  const { stats: publicStats } = usePublicStats();
  const stats = getStats(publicStats.totalEvents);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.5,
    // IMPORTANT: margin negatiu per activar més tard
    margin: '-100px'
  });

  return (
    <div
      ref={ref}
      className="
        relative z-10
        py-8 px-4
        bg-gradient-to-t from-black/80 via-black/50 to-transparent
        border-t border-white/10
      "
    >
      {/* Backdrop blur per millor llegibilitat */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Stats */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full max-w-4xl mx-auto">
        {stats.map((stat, index) => (
          <AnimatedStat
            key={stat.label}
            stat={stat}
            index={index}
            isVisible={isInView}
            isEs={isEs}
          />
        ))}
      </div>
    </div>
  );
}
