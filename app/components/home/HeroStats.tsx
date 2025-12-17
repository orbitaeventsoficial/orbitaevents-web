// app/components/home/HeroStats.tsx
// ═══════════════════════════════════════════════════════════════════════════
// HERO STATS - i18n complet v1.1
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
  labelKey: string;
}

const STATIC_STATS: Stat[] = [
  { value: '92', suffix: '%', labelKey: 'repeatOrRecommend' },
  { value: '100', suffix: '%', labelKey: 'withBackup' },
  { value: '2', suffix: 'h', labelKey: 'responseTime' },
];

const getStats = (totalEvents: number): Stat[] => [
  { value: String(totalEvents), suffix: '+', labelKey: 'eventsRealized' },
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
  t
}: {
  stat: Stat;
  index: number;
  isVisible: boolean;
  t: (key: string) => string;
}) {
  const numericValue = parseInt(stat.value, 10);
  const animatedValue = useAnimatedNumber(numericValue, 2000, isVisible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay: 0.8 + (index * 0.15),
        ease: 'easeOut'
      }}
      className="text-center"
    >
      <div className="flex items-baseline justify-center">
        <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
          {animatedValue}
        </span>
        <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-amber-400 ml-0.5">
          {stat.suffix}
        </span>
      </div>
      <p className="text-sm md:text-base text-zinc-300 mt-1 font-medium">
        {t(stat.labelKey)}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroStats() {
  const t = useTranslations('homeSections.heroStats');
  const { stats: publicStats } = usePublicStats();
  const stats = getStats(publicStats.totalEvents);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.5,
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
      <div className="absolute inset-0 backdrop-blur-sm" />

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full max-w-4xl mx-auto">
        {stats.map((stat, index) => (
          <AnimatedStat
            key={stat.labelKey}
            stat={stat}
            index={index}
            isVisible={isInView}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
