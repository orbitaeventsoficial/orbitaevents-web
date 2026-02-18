'use client';

// ═══════════════════════════════════════════════════════════════════════════
// STATS SECTION (DESKTOP) - Òrbita Events
// Comptadors animats al scroll
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

function useCountUp(target: number, duration: number, started: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, started]);
  return count;
}

const STATS = [
  {
    value: 50,
    prefix: '',
    suffix: '+',
    label: 'Events realitzats',
    sublabel: 'i comptant',
    emoji: '🎉',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.2)',
  },
  {
    value: 5,
    prefix: '',
    suffix: '.0★',
    label: 'Valoració Google',
    sublabel: 'sense excepcions',
    emoji: '🌟',
    gradient: 'from-yellow-300 to-amber-400',
    glow: 'rgba(253,224,71,0.15)',
  },
  {
    value: 2,
    prefix: '<',
    suffix: 'h',
    label: 'Temps de resposta',
    sublabel: 'garantit sempre',
    emoji: '⚡',
    gradient: 'from-cyan-400 to-blue-500',
    glow: 'rgba(34,211,238,0.15)',
  },
  {
    value: 3,
    prefix: '',
    suffix: '+',
    label: "Anys d'experiència",
    sublabel: 'a Catalunya',
    emoji: '🏆',
    gradient: 'from-purple-400 to-pink-500',
    glow: 'rgba(167,139,250,0.15)',
  },
] as const;

function StatCard({
  stat,
  delay,
  started,
}: {
  stat: (typeof STATS)[number];
  delay: number;
  started: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const count = useCountUp(stat.value, 2000, started && !reduceMotion);
  const display = reduceMotion ? stat.value : count;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={
        reduceMotion ? { duration: 0 } : { delay, type: 'spring', damping: 20 }
      }
      className="relative flex flex-col items-center justify-center p-8 rounded-3xl border border-white/10 text-center overflow-hidden group hover:border-white/20 transition-colors"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${stat.glow}, transparent 65%), rgba(255,255,255,0.03)`,
      }}
    >
      {!reduceMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', delay: delay * 2 }}
        />
      )}

      <span className="text-4xl mb-3 block">{stat.emoji}</span>
      <div
        className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent leading-none mb-2`}
      >
        {stat.prefix}
        {display}
        {stat.suffix}
      </div>
      <p className="text-white font-bold text-lg mt-2">{stat.label}</p>
      <p className="text-white/40 text-sm mt-1">{stat.sublabel}</p>
    </motion.div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const reduceMotion = useReducedMotion();

  return (
    <section ref={ref} className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(251,191,36,0.04),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold tracking-wider uppercase mb-4">
            En xifres
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Per què triar{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Òrbita Events?
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} delay={i * 0.1} started={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
