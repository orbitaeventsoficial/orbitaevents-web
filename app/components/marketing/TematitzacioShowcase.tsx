// ============================================================
// SECCIÓ "EL NOSTRE PUNT FORT" - TEMATITZACIÓ
// ============================================================
// Component que destaca LA TEMATITZACIÓ com a diferenciador clau
// ============================================================

'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// ============================================================
// CONFIGURACIÓ VISUAL DELS TEMES (colors i emojis no es tradueixen)
// ============================================================

const THEME_STYLES = {
  monmagic: {
    id: 'monmagic',
    emoji: '⚡',
    gradient: 'from-amber-600 to-yellow-400',
    color: '#fbbf24',
  },
  halloween: {
    id: 'halloween',
    emoji: '🎃',
    gradient: 'from-orange-600 to-red-500',
    color: '#f97316',
  },
  tropical: {
    id: 'tropical',
    emoji: '🌴',
    gradient: 'from-emerald-500 to-teal-400',
    color: '#10b981',
  },
  disco: {
    id: 'disco',
    emoji: '🪩',
    gradient: 'from-fuchsia-500 to-purple-500',
    color: '#d946ef',
  },
  elegant: {
    id: 'elegant',
    emoji: '✨',
    gradient: 'from-amber-400 to-yellow-300',
    color: '#fbbf24',
  },
  custom: {
    id: 'custom',
    emoji: '🎨',
    gradient: 'from-violet-500 to-indigo-500',
    color: '#8b5cf6',
  },
};

const THEME_IDS = ['monmagic', 'halloween', 'tropical', 'disco', 'elegant', 'custom'] as const;
type ThemeId = typeof THEME_IDS[number];

// ============================================================
// COMPONENT PRINCIPAL
// ============================================================

export default function TematitzacioShowcase() {
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('monmagic');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const t = useTranslations('tematitzacio');

  const activeTheme = THEME_STYLES[activeThemeId];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-32 overflow-hidden"
      id="tematitzacio"
    >
      {/* Fons animat */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              `radial-gradient(circle at 20% 50%, ${activeTheme.color}30 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 50%, ${activeTheme.color}30 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 50%, ${activeTheme.color}30 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header de la secció */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Badge destacat */}
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                     bg-gradient-to-r from-amber-500/20 to-orange-500/20
                     border border-amber-500/30 mb-6"
          >
            <span className="text-2xl">🏆</span>
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
              {t('badge')}
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {t('title')}
            </span>{' '}
            {t('titleSuffix')}
          </h2>

          <p className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Grid de temes */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Selector de temes */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {THEME_IDS.map((themeId, i) => {
              const theme = THEME_STYLES[themeId];
              return (
                <motion.button
                  key={themeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 * i }}
                  onClick={() => setActiveThemeId(themeId)}
                  className={`relative p-4 rounded-2xl text-left transition-all duration-300
                            overflow-hidden group ${
                              activeThemeId === themeId
                                ? 'ring-2 ring-offset-2 ring-offset-black'
                                : 'hover:bg-white/10'
                            }`}
                  style={{
                    backgroundColor: activeThemeId === themeId
                      ? `${theme.color}20`
                      : 'rgba(255,255,255,0.05)',
                    '--tw-ring-color': theme.color,
                  } as React.CSSProperties}
                >
                  {/* Glow effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `radial-gradient(circle at center, ${theme.color}20 0%, transparent 70%)`,
                    }}
                  />

                  <span className="text-3xl block mb-2 relative z-10
                                group-hover:scale-110 transition-transform">
                    {theme.emoji}
                  </span>
                  <span className="text-white font-semibold text-sm block relative z-10">
                    {t(`themes.${themeId}.name`)}
                  </span>

                  {/* Indicador actiu */}
                  {activeThemeId === themeId && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-2 right-2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Detall del tema actiu */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeThemeId}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Card de detall */}
              <div
                className="p-6 sm:p-8 rounded-3xl border backdrop-blur-sm"
                style={{
                  backgroundColor: `${activeTheme.color}10`,
                  borderColor: `${activeTheme.color}30`,
                }}
              >
                {/* Header del tema */}
                <div className="flex items-start gap-4 mb-6">
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="text-5xl"
                  >
                    {activeTheme.emoji}
                  </motion.span>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">
                      {t(`themes.${activeThemeId}.name`)}
                    </h3>
                    <p
                      className="text-lg font-medium"
                      style={{ color: activeTheme.color }}
                    >
                      {t(`themes.${activeThemeId}.tagline`)}
                    </p>
                  </div>
                </div>

                {/* Descripció */}
                <p className="text-white/70 text-lg leading-relaxed mb-6">
                  {t(`themes.${activeThemeId}.description`)}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: activeTheme.color }}
                      />
                      <span className="text-white/80 text-sm">{t(`themes.${activeThemeId}.features.${i}`)}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/configurador?tema=${activeThemeId}`} className="flex-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-black
                               bg-gradient-to-r ${activeTheme.gradient}
                               shadow-lg transition-shadow`}
                      style={{
                        boxShadow: `0 10px 30px ${activeTheme.color}30`,
                      }}
                    >
                      {t('cta')} 🚀
                    </motion.button>
                  </Link>
                  <Link href="/portfolio" className="sm:flex-none">
                    <button className="w-full sm:w-auto py-4 px-6 rounded-xl font-medium
                                     text-white/80 hover:text-white border border-white/20
                                     hover:bg-white/5 transition-all">
                      {t('examples')}
                    </button>
                  </Link>
                </div>
              </div>

              {/* Testimoni relacionat */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-white/60 text-sm italic mb-2">
                  {t('testimonial')}
                </p>
                <p className="text-white/40 text-xs">
                  {t('testimonialAuthor')}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA final */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-16 pt-12 border-t border-white/10"
        >
          <p className="text-white/60 text-lg mb-6">
            {t('custom')}{' '}
            <span className="text-amber-400 font-semibold">QUALSEVOL</span>{' '}
            {t('customSuffix')}
          </p>
          <Link href="/contacto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20
                       text-white font-semibold border border-white/20
                       transition-all"
            >
              {t('contact')} 💡
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
