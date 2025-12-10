// ============================================================
// FITXER: app/components/ui/SmartStats.tsx
// DESCRIPCIÓ: Stats VERIFICABLES i honestos - Empresa fundada 2023
// ACTUALITZAT: Desembre 2025 - Només dades reals
// ============================================================

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ============================================================
// ESTADÍSTIQUES REALS I VERIFICABLES - Empresa fundada Agost 2023
// ============================================================

const REAL_STATS = {
  yearsExperience: '2+',   // 2+ anys des de 2023
  coverage: 'BCN + Girona', // Barcelona i Girona
  response: '2h',          // Resposta en 2 hores
};

// ============================================================
// TIPUS
// ============================================================

interface SmartStatsProps {
  variant?: 'hero' | 'footer' | 'compact';
  animate?: boolean;
}

// ============================================================
// COMPONENT: Número animat
// ============================================================

function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  duration = 2000
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = startValue + (value - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toString();

  return (
    <span ref={ref}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

// ============================================================
// COMPONENT PRINCIPAL: SmartStats - ESTADÍSTIQUES VERIFICABLES
// ============================================================

export default function SmartStats({
  variant = 'hero',
  animate = true
}: SmartStatsProps) {
  const t = useTranslations('stats');

  // Estils segons variant
  const styles = {
    hero: {
      container: 'flex flex-wrap justify-center gap-6 sm:gap-10 lg:gap-16',
      number: 'text-4xl sm:text-5xl lg:text-6xl font-black text-white',
      label: 'text-white/60 text-sm sm:text-base mt-1',
    },
    footer: {
      container: 'flex flex-wrap justify-center gap-4 sm:gap-6',
      number: 'text-2xl sm:text-3xl font-bold text-white',
      label: 'text-white/50 text-xs sm:text-sm',
    },
    compact: {
      container: 'flex justify-center gap-4 text-sm',
      number: 'text-lg font-bold text-amber-400',
      label: 'text-white/50 text-xs',
    },
  };

  const s = styles[variant];

  return (
    <motion.div
      className={s.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {/* ANYS EXPERIÈNCIA */}
      <div className="text-center">
        <p className={s.number}>{REAL_STATS.yearsExperience}</p>
        <p className={s.label}>{t('yearsExperience')}</p>
      </div>

      {/* COBERTURA */}
      <div className="text-center">
        <p className={s.number}>{REAL_STATS.coverage}</p>
        <p className={s.label}>{t('coverage')}</p>
      </div>

      {/* RESPOSTA */}
      <div className="text-center">
        <p className={s.number}>{REAL_STATS.response}</p>
        <p className={s.label}>{t('response') || 'resposta'}</p>
      </div>
    </motion.div>
  );
}

// ============================================================
// EXPORT: Constants per usar a altres components
// ============================================================

export { REAL_STATS };
