"use client";

// app/components/marketing/TransformationSection.tsx
import { motion } from 'framer-motion';
import { X, Check, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TransformationSection() {
  const t = useTranslations('transformation');

  const comparisons = [
    {
      wrong: t('comparisons.1.wrong'),
      problem: t('comparisons.1.problem'),
      right: t('comparisons.1.right'),
      benefit: t('comparisons.1.benefit'),
    },
    {
      wrong: t('comparisons.2.wrong'),
      problem: t('comparisons.2.problem'),
      right: t('comparisons.2.right'),
      benefit: t('comparisons.2.benefit'),
    },
    {
      wrong: t('comparisons.3.wrong'),
      problem: t('comparisons.3.problem'),
      right: t('comparisons.3.right'),
      benefit: t('comparisons.3.benefit'),
    },
  ];
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-b from-bg-main to-bg-surface relative overflow-hidden">
      {/* 🔥 PARTÍCULAS BRUTALES */}
      <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-oe-gold/40 to-yellow-400/20 blur-3xl top-[10%] left-[5%] animate-float" style={{ animationDuration: "7s" }} />
        <div className="absolute w-28 h-28 rounded-full bg-purple-500/30 blur-2xl bottom-[25%] right-[10%] animate-scale-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-oe-gold/20 border border-oe-gold px-4 py-2 mb-6
                     animate-glow-pulse hover:scale-110 transition-transform"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(218, 165, 32, 0.4))' }}
          >
            <Sparkles className="w-4 h-4 text-oe-gold animate-rotate-slow" />
            <span className="text-sm font-medium text-oe-gold">{t('badge')}</span>
          </motion.div>

          <h2 className="text-h2 text-white mb-6">
            {t('title')}
            <br />
            <span className="text-oe-gold">{t('titleHighlight')}</span>
          </h2>

          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            {t('subtitle')}{' '}
            <span className="text-oe-gold font-bold">{t('subtitleHighlight')}</span>.
          </p>
        </div>

        <div className="space-y-8">
          {comparisons.map((comparison, idx) => (
            <motion.div
              key={idx}
              className="grid md:grid-cols-2 gap-6 items-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* PROBLEMA */}
              <div className="relative rounded-3xl border-2 border-red-500/30 bg-red-500/5 p-8">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                  <X className="w-4 h-4" />
                  {t('others')}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 mt-2">{comparison.wrong}</h3>
                <p className="text-red-400 italic">"{comparison.problem}"</p>
              </div>

              {/* SOLUCIÓN BRUTAL */}
              <div className="relative rounded-3xl border-2 border-oe-gold bg-oe-gold/5 p-8 shadow-oe-glow
                            hover:scale-105 transition-all duration-300 hover:drop-shadow-[0_0_30px_rgba(218,165,32,0.6)]
                            animate-glow-pulse group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-oe-gold text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {t('withOrbita')}
                </div>
                <h3 className="text-2xl font-bold text-oe-gold mb-3 mt-2">{comparison.right}</h3>
                <p className="text-white">{comparison.benefit}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
