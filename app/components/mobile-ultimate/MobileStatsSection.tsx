'use client';

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE STATS SECTION - Òrbita Events
// Comptadors animats que pugen quan entren a la vista
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ── Hook de comptador animat ────────────────────────────────────────────────

function useCountUp(target: number, duration: number, started: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration, started]);

  return count;
}

// ── Dades estàtiques (valors i estils, no text) ─────────────────────────────

const STAT_CONFIGS = [
  {
    key: 'events' as const,
    value: 50,
    prefix: '',
    suffix: '+',
    emoji: '🎉',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.18)',
  },
  {
    key: 'rating' as const,
    value: 5,
    prefix: '',
    suffix: '.0★',
    emoji: '🌟',
    gradient: 'from-yellow-300 to-amber-400',
    glow: 'rgba(253,224,71,0.15)',
  },
  {
    key: 'response' as const,
    value: 2,
    prefix: '<',
    suffix: 'h',
    emoji: '⚡',
    gradient: 'from-cyan-400 to-blue-500',
    glow: 'rgba(34,211,238,0.15)',
  },
  {
    key: 'experience' as const,
    value: 3,
    prefix: '',
    suffix: '+',
    emoji: '🏆',
    gradient: 'from-purple-400 to-pink-500',
    glow: 'rgba(167,139,250,0.15)',
  },
] as const;

// ── Targeta individual ─────────────────────────────────────────────────────

interface StatCardProps {
  config: (typeof STAT_CONFIGS)[number];
  label: string;
  sublabel: string;
  delay: number;
  started: boolean;
}

function StatCard({ config, label, sublabel, delay, started }: StatCardProps) {
  const reduceMotion = useReducedMotion();
  const count = useCountUp(config.value, 1800, started && !reduceMotion);
  const display = reduceMotion ? config.value : count;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.88 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { delay, duration: 0.34, ease: [0.22, 1, 0.36, 1] }
      }
      className="relative flex flex-col items-center justify-center p-5 rounded-3xl border border-white/10 text-center overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${config.glow}, transparent 70%), rgba(255,255,255,0.04)`,
      }}
    >
      {/* Shine sweep */}
      {!reduceMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
            delay: delay * 3,
          }}
        />
      )}

      <span className="text-3xl mb-2 block">{config.emoji}</span>

      <div
        className={`text-4xl font-black bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent leading-none mb-1`}
      >
        {config.prefix}
        {display}
        {config.suffix}
      </div>

      <p className="text-white font-semibold text-sm mt-1.5">{label}</p>
      <p className="text-white/60 text-xs mt-0.5">{sublabel}</p>
    </motion.div>
  );
}

// ── Component principal ────────────────────────────────────────────────────

export default function MobileStatsSection() {
  const t = useTranslations('homePage.stats');
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const reduceMotion = useReducedMotion();

  return (
    <section ref={ref} className="py-14 px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(251,191,36,0.04),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
          {t('sectionLabel')}
        </span>
        <h2 className="text-3xl font-black text-white">
          {t('heading')}{' '}
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            {t('headingHighlight')}
          </span>
        </h2>
      </motion.div>

      {/* Grid 2×2 */}
      <div className="grid grid-cols-2 gap-4">
        {STAT_CONFIGS.map((config, i) => (
          <StatCard
            key={config.key}
            config={config}
            label={t(`${config.key}.label`)}
            sublabel={t(`${config.key}.sublabel`)}
            delay={i * 0.08}
            started={isInView}
          />
        ))}
      </div>
    </section>
  );
}
