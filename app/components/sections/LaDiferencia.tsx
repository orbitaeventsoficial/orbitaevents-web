// app/components/sections/LaDiferencia.tsx
// ÒRBITA EVENTS - La Diferència
// Secció minimalista: 3 punts diferencials, màxim 100 paraules

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Heart, Sparkles, Users } from 'lucide-react';

const differentials = [
  {
    icon: Heart,
    key: 'experience',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: Sparkles,
    key: 'magic',
    color: 'from-purple-400 to-fuchsia-500',
  },
  {
    icon: Users,
    key: 'team',
    color: 'from-cyan-400 to-blue-500',
  },
];

export default function LaDiferencia() {
  const t = useTranslations('diferencia');

  return (
    <section className="relative py-24 bg-neutral-950 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/5 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* 3 Differentials */}
        <div className="grid md:grid-cols-3 gap-8">
          {differentials.map((diff, index) => (
            <motion.div
              key={diff.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="text-center group"
            >
              {/* Icon */}
              <div className="relative mb-6 inline-block">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${diff.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <diff.icon className="w-8 h-8 text-white" />
                </div>
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${diff.color} blur-xl opacity-30 group-hover:opacity-50 transition-opacity`} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-3">
                {t(`${diff.key}.title`)}
              </h3>

              {/* Description - max 30 words each */}
              <p className="text-white/60 leading-relaxed">
                {t(`${diff.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
