'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface StatsProps {
  variant?: 'default' | 'compact';
}

export function Stats({ variant = 'default' }: StatsProps) {
  const t = useTranslations('stats');

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
        <span>2+ {t('yearsExperience')}</span>
        <span>•</span>
        <span>BCN {t('coverage')}</span>
        <span>•</span>
        <span>2h {t('response')}</span>
      </div>
    );
  }

  const stats = [
    { value: '2+', labelKey: 'yearsExperience' },
    { value: 'BCN', labelKey: 'coverage' },
    { value: '2h', labelKey: 'response' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.value}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="text-center"
        >
          <div className="text-3xl md:text-4xl font-bold text-amber-400">
            {stat.value}
          </div>
          <div className="text-white/80 text-sm font-medium">
            {t(stat.labelKey)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
