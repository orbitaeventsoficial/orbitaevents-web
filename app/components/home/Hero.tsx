'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { Stats } from './Stats';
import { useTranslations } from 'next-intl';

// HYDRATION FIX: Pre-computed deterministic particle positions
// Using seeded pseudo-random values to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { left: 15, top: 23, duration: 3.2, delay: 0.5 },
  { left: 42, top: 67, duration: 4.1, delay: 1.2 },
  { left: 78, top: 12, duration: 3.8, delay: 0.8 },
  { left: 5, top: 89, duration: 4.5, delay: 1.8 },
  { left: 91, top: 45, duration: 3.5, delay: 0.3 },
  { left: 33, top: 78, duration: 4.2, delay: 1.5 },
  { left: 67, top: 34, duration: 3.9, delay: 0.9 },
  { left: 23, top: 56, duration: 4.4, delay: 1.1 },
  { left: 88, top: 91, duration: 3.3, delay: 0.6 },
  { left: 51, top: 8, duration: 4.0, delay: 1.4 },
  { left: 12, top: 42, duration: 3.7, delay: 0.7 },
  { left: 76, top: 65, duration: 4.3, delay: 1.9 },
  { left: 38, top: 19, duration: 3.4, delay: 0.4 },
  { left: 95, top: 73, duration: 4.6, delay: 1.0 },
  { left: 8, top: 31, duration: 3.6, delay: 1.6 },
  { left: 62, top: 87, duration: 4.1, delay: 0.2 },
  { left: 29, top: 4, duration: 3.8, delay: 1.3 },
  { left: 84, top: 58, duration: 4.4, delay: 0.1 },
  { left: 47, top: 95, duration: 3.5, delay: 1.7 },
  { left: 71, top: 26, duration: 4.2, delay: 0.0 },
];

export function Hero() {
  const t = useTranslations('hero');

  const services = [
    { icon: '🎵', key: 'dj' },
    { icon: '💡', key: 'lighting' },
    { icon: '✨', key: 'effects' },
    { icon: '🎭', key: 'theming' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />

      {/* Partícules decoratives - HYDRATION FIX: Using pre-computed positions */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLE_POSITIONS.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Contingut */}
      <div className="container mx-auto px-4 text-center relative z-10">

        {/* Badge diferenciador */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur rounded-full mb-6 border border-amber-500/30"
        >
          <span className="text-amber-400">🎯</span>
          <span className="text-amber-300 text-sm font-medium">
            {t('simpleBadge')}
          </span>
        </motion.div>

        {/* Títol principal - SEO optimitzat */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          {t('simpleTitle1')}{' '}
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {t('simpleTitle2')}
          </span>
        </motion.h1>

        {/* Subtítol - La narrativa REAL */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8"
        >
          {t('simpleSubtitle')}
          <span className="text-white font-medium"> {t('simpleSubtitleHighlight')}</span>
        </motion.p>

        {/* Serveis en pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {services.map((service) => (
            <span
              key={service.key}
              className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white text-sm border border-white/10"
            >
              {service.icon} {t(`simpleServices.${service.key}`)}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link
            href="/contacto"
            className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-lg shadow-amber-500/25"
          >
            {t('simpleCta.budget')}
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">🚀</span>
          </Link>
          <Link
            href="https://wa.me/34699121023"
            target="_blank"
            className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            {t('simpleCta.whatsapp')}
          </Link>
        </motion.div>

        {/* Stats honestos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Stats />
        </motion.div>

        {/* Indicador scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
