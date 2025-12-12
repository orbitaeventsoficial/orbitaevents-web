'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WHY US BRUTAL - POR QUÉ SOMOS LA ÚNICA OPCIÓN
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Esta sección elimina objeciones y posiciona a Òrbita como la única
 * opción lógica. No comparamos con competencia - la aplastamos.
 * 
 * Estructura:
 * 1. Diferenciadores únicos (lo que nadie más hace)
 * 2. Promesa de valor clara
 * 3. Prueba visual de resultados
 * 4. Transición suave al CTA
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// DIFFERENTIATOR CARD
// ═══════════════════════════════════════════════════════════════════════════

interface DifferentiatorProps {
  icon: string;
  title: string;
  description: string;
  highlight: string;
  index: number;
}

function DifferentiatorCard({ icon, title, description, highlight, index }: DifferentiatorProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="group relative"
    >
      {/* Card */}
      <div className="relative h-full p-8 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all duration-500 overflow-hidden">
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Number indicator */}
        <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/20 text-sm font-bold">
          {String(index + 1).padStart(2, '0')}
        </div>
        
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-16 h-16 mb-6 flex items-center justify-center text-4xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-2xl border border-amber-500/20"
        >
          {icon}
        </motion.div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-white/60 leading-relaxed mb-4">
          {description}
        </p>
        
        {/* Highlight badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full border border-amber-500/20">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          <span className="text-amber-400 text-sm font-medium">{highlight}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPARISON TABLE (Nosotros vs Típico DJ)
// ═══════════════════════════════════════════════════════════════════════════

function ComparisonTable({ t }: { t: (key: string) => string }) {
  const comparisons = [
    { us: t('comparison.items.1.us'), them: t('comparison.items.1.them') },
    { us: t('comparison.items.2.us'), them: t('comparison.items.2.them') },
    { us: t('comparison.items.3.us'), them: t('comparison.items.3.them') },
    { us: t('comparison.items.4.us'), them: t('comparison.items.4.them') },
    { us: t('comparison.items.5.us'), them: t('comparison.items.5.them') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto mt-16 overflow-hidden rounded-2xl border border-white/10"
    >
      {/* Header */}
      <div className="grid grid-cols-2 bg-white/5">
        <div className="p-4 text-center border-r border-white/10">
          <span className="text-amber-400 font-bold">🚀 {t('comparison.us')}</span>
        </div>
        <div className="p-4 text-center">
          <span className="text-white/40">{t('comparison.them')}</span>
        </div>
      </div>

      {/* Rows */}
      {comparisons.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="grid grid-cols-2 border-t border-white/5"
        >
          <div className="p-4 flex items-center gap-2 border-r border-white/5 bg-green-500/5">
            <span className="text-green-400">✓</span>
            <span className="text-white/80 text-sm">{item.us}</span>
          </div>
          <div className="p-4 flex items-center gap-2 bg-red-500/5">
            <span className="text-red-400/50">✗</span>
            <span className="text-white/40 text-sm">{item.them}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function WhyUsBrutal() {
  const t = useTranslations('whyUs');

  const differentiators = [
    {
      icon: '🎯',
      title: t('differentiators.experience.title'),
      description: t('differentiators.experience.description'),
      highlight: t('differentiators.experience.highlight'),
    },
    {
      icon: '🧠',
      title: t('differentiators.timing.title'),
      description: t('differentiators.timing.description'),
      highlight: t('differentiators.timing.highlight'),
    },
    {
      icon: '🔧',
      title: t('differentiators.equipment.title'),
      description: t('differentiators.equipment.description'),
      highlight: t('differentiators.equipment.highlight'),
    },
    {
      icon: '✨',
      title: t('differentiators.themes.title'),
      description: t('differentiators.themes.description'),
      highlight: t('differentiators.themes.highlight'),
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-black via-purple-950/5 to-black overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 mb-4 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-full border border-amber-500/20"
          >
            💡 {t('badge')}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white mb-6"
          >
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              {t('titleHighlight')}
            </span>
            ?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto"
          >
            {t('subtitle')}{' '}
            <span className="text-white font-medium">{t('subtitleBold')}</span>
          </motion.p>
        </div>

        {/* Differentiators Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {differentiators.map((item, index) => (
            <DifferentiatorCard
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              highlight={item.highlight}
              index={index}
            />
          ))}
        </div>

        {/* Comparison Table */}
        <ComparisonTable t={t} />

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center mt-20 p-10 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-3xl border border-amber-500/20"
        >
          <div className="relative">
            <span className="absolute -top-8 left-4 text-7xl text-amber-500/20">"</span>
            <blockquote className="text-xl md:text-2xl text-white/90 italic leading-relaxed px-8">
              {t('quote').split(t('quoteHighlight'))[0]}
              <span className="text-amber-400 font-semibold not-italic">{t('quoteHighlight')}</span>
              {t('quote').split(t('quoteHighlight'))[1]}
            </blockquote>
            <span className="absolute -bottom-8 right-4 text-7xl text-amber-500/20">"</span>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold text-lg">
              Ò
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">{t('quoteAuthor')}</p>
              <p className="text-white/50 text-sm">{t('quoteSubtitle')}</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default WhyUsBrutal;
