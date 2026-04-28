'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { fetchPublicStats } from '@/lib/api/publicStatsClient';

// ─── Count-up hook ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, started: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || target <= 0) { setCount(target); return; }
    let startTime: number | null = null;
    let raf: number;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, started]);
  return count;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface StatConfig {
  key: string;
  value: number;
  prefix: string;
  suffix: string;
}

// ─── Stat Card — Clean, monochrome + amber accent ──────────────────────────

function StatCard({
  config,
  label,
  sublabel,
  delay,
  started,
}: {
  config: StatConfig;
  label: string;
  sublabel: string;
  delay: number;
  started: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const count = useCountUp(config.value, 2000, started && !reduceMotion);
  const display = reduceMotion ? config.value : count;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={
        reduceMotion ? { duration: 0 } : { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }
      className="flex flex-col items-center text-center py-8 px-4 group"
    >
      <div className="text-4xl sm:text-5xl md:text-6xl font-black leading-none mb-2 tabular-nums bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
        {config.prefix}{display}{config.suffix}
      </div>
      <p className="text-white font-semibold text-sm sm:text-base">{label}</p>
      <p className="text-white/40 text-xs sm:text-sm mt-0.5">{sublabel}</p>
    </motion.div>
  );
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_STATS: StatConfig[] = [
  { key: 'events', value: 50, prefix: '', suffix: '+' },
  { key: 'rating', value: 5, prefix: '', suffix: '.0★' },
  { key: 'response', value: 2, prefix: '<', suffix: 'h' },
  { key: 'experience', value: 3, prefix: '', suffix: '+' },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function StatsSection() {
  const t = useTranslations('homePage.stats');
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const reduceMotion = useReducedMotion();
  const [stats, setStats] = useState<StatConfig[]>(DEFAULT_STATS);

  useEffect(() => {
    fetchPublicStats(locale)
      .then((data) => {
        if (!data.ok || !data.stats) return;
        const s = data.stats;
        const yearsNum = Math.max(1, new Date().getFullYear() - (s.yearStarted || 2023));
        setStats([
          { ...DEFAULT_STATS[0], value: Math.max(s.totalEvents || 0, 50) },
          { ...DEFAULT_STATS[1], value: (s.averageRating && s.averageRating >= 4) ? s.averageRating : 5 },
          { ...DEFAULT_STATS[2], value: 2 },
          { ...DEFAULT_STATS[3], value: yearsNum },
        ]);
      })
      .catch(() => { /* keep defaults */ });
  }, [locale]);

  return (
    <section ref={ref} className="relative py-16 md:py-24 overflow-hidden">
      {/* Glow radial central ambre subtil */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[200px] bg-amber-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-amber-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-medium tracking-wider uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t('sectionLabel')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white">
            {t('heading')}{' '}
            <span className="text-amber-400">{t('headingHighlight')}</span>
          </h2>
        </motion.div>

        {/* Grid amb separadors verticals */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          {stats.map((config, i) => (
            <StatCard
              key={config.key}
              config={config}
              label={t(`${config.key}.label`)}
              sublabel={t(`${config.key}.sublabel`)}
              delay={i * 0.1}
              started={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
