'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function WhyUs() {
  const t = useTranslations('whyUs');

  const cards = [
    { icon: '🎯', titleKey: 'experience.title', descKey: 'experience.description' },
    { icon: '🧠', titleKey: 'timing.title', descKey: 'timing.description' },
    { icon: '🔧', titleKey: 'equipment.title', descKey: 'equipment.description' },
  ];
  
  return (
    <section className="py-20 bg-gradient-to-b from-black via-purple-950/10 to-black">
      <div className="container mx-auto px-4">
        
        {/* Títol */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 max-w-2xl mx-auto"
          >
            {t('subtitle')}
          </motion.p>
        </div>
        
        {/* 3 Diferenciadors */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-amber-500/30 transition-colors"
            >
              <span className="text-4xl mb-4 block">{card.icon}</span>
              <h3 className="text-xl font-bold text-white mb-3">
                {t(card.titleKey)}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {t(card.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Frase destacada */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="relative">
            <span className="absolute -top-6 left-0 text-6xl text-amber-500/20">&quot;</span>
            <blockquote className="text-xl md:text-2xl text-white/90 italic px-8">
              {t('quote')}
            </blockquote>
            <span className="absolute -bottom-6 right-0 text-6xl text-amber-500/20">&quot;</span>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}
