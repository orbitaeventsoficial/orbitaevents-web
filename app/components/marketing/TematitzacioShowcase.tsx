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
// DADES DELS TEMES
// ============================================================

const THEMES_SHOWCASE = [
  {
    id: 'monmagic',
    name: 'Món Màgic',
    emoji: '⚡',
    tagline: "Màgia d'escola de bruixeria al teu event",
    description: 'Transforma el teu event en una experiència màgica: efectes de varetes, il·luminació de veles flotants, música encantada, i fins i tot humo que sembla màgia real.',
    features: ['Efectes de vareta màgica', 'Veles flotants', "Efectes de boira màgica", 'Playlist temàtica'],
    gradient: 'from-amber-600 to-yellow-400',
    color: '#fbbf24',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    tagline: 'La nit més terrorífica',
    description: 'Convertim qualsevol espai en una casa encantada: llums vermelles i taronges, humo baixa, efectes de so terrorífics, i una ambientació que farà cridar els teus convidats.',
    features: ['Decoració terrorífica', 'Efectes de boira', 'Llums estroboscòpiques', 'So ambient esgarrifós'],
    gradient: 'from-orange-600 to-red-500',
    color: '#f97316',
  },
  {
    id: 'tropical',
    name: 'Tropical',
    emoji: '🌴',
    tagline: 'Paradís a Catalunya',
    description: 'Porta el Carib a casa teva: llums càlides, efectes de palmeres projectades, música reggaeton i salsa, i una atmosfera que et farà sentir a la platja.',
    features: ['Projeccions tropicals', 'Llums càlides', 'Playlist caribenyes', 'Efectes de posta de sol'],
    gradient: 'from-emerald-500 to-teal-400',
    color: '#10b981',
  },
  {
    id: 'disco',
    name: 'Disco 80s',
    emoji: '🪩',
    tagline: 'Viatja als anys daurats',
    description: "Bola de discoteca gegant, llums de neó, màquina de fum, i els millors hits dels 70s i 80s. Una festa retro que farà ballar a totes les generacions.",
    features: ['Bola disco gegant', 'Llums de neó', "Vestits d'època opcional", 'Greatest hits 70s-80s'],
    gradient: 'from-fuchsia-500 to-purple-500',
    color: '#d946ef',
  },
  {
    id: 'elegant',
    name: 'Elegant Gold',
    emoji: '✨',
    tagline: 'Sofisticació pura',
    description: "Per als que busquen classe i distinció: il·luminació daurada, efectes subtils però impressionants, música lounge i jazz, i una atmosfera de gala.",
    features: ['Il·luminació daurada', 'Efectes subtils', 'Jazz & Lounge', 'Ambientació premium'],
    gradient: 'from-amber-400 to-yellow-300',
    color: '#fbbf24',
  },
  {
    id: 'custom',
    name: 'La Teva Idea',
    emoji: '🎨',
    tagline: 'Tu imagines, nosaltres creem',
    description: "Tens una idea diferent? Peaky Blinders, Star Wars, Anime, Medieval... Digue'ns la teva visió i la fem realitat amb efectes, música i ambientació a mida.",
    features: ['Disseny personalitzat', 'Qualsevol temàtica', 'Efectes a mida', 'Assessorament creatiu'],
    gradient: 'from-violet-500 to-indigo-500',
    color: '#8b5cf6',
  },
];

// ============================================================
// COMPONENT PRINCIPAL
// ============================================================

export default function TematitzacioShowcase() {
  const [activeTheme, setActiveTheme] = useState(THEMES_SHOWCASE[0]);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const t = useTranslations('tematitzacio');

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
              {t('badge') || 'El Nostre Punt Fort'}
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {t('title') || 'Tematització'}
            </span>{' '}
            {t('titleSuffix') || "d'Events"}
          </h2>

          <p className="text-xl sm:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            {t('subtitle') || 'No fem events normals. Creem experiències immersives que transporten els teus convidats a un altre món.'}
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
            {THEMES_SHOWCASE.map((theme, i) => (
              <motion.button
                key={theme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * i }}
                onClick={() => setActiveTheme(theme)}
                className={`relative p-4 rounded-2xl text-left transition-all duration-300
                          overflow-hidden group ${
                            activeTheme.id === theme.id
                              ? 'ring-2 ring-offset-2 ring-offset-black'
                              : 'hover:bg-white/10'
                          }`}
                style={{
                  backgroundColor: activeTheme.id === theme.id
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
                  {theme.name}
                </span>

                {/* Indicador actiu */}
                {activeTheme.id === theme.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-2 right-2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>

          {/* Detall del tema actiu */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTheme.id}
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
                      {activeTheme.name}
                    </h3>
                    <p
                      className="text-lg font-medium"
                      style={{ color: activeTheme.color }}
                    >
                      {activeTheme.tagline}
                    </p>
                  </div>
                </div>

                {/* Descripció */}
                <p className="text-white/70 text-lg leading-relaxed mb-6">
                  {activeTheme.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {activeTheme.features.map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center gap-2"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: activeTheme.color }}
                      />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/configurador?tema=${activeTheme.id}`} className="flex-1">
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
                      {t('cta') || 'Vull aquest tema!'} 🚀
                    </motion.button>
                  </Link>
                  <Link href="/portfolio" className="sm:flex-none">
                    <button className="w-full sm:w-auto py-4 px-6 rounded-xl font-medium
                                     text-white/80 hover:text-white border border-white/20
                                     hover:bg-white/5 transition-all">
                      {t('examples') || 'Veure exemples'}
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
                  {t('testimonial') || '"La tematització màgica va ser INCREÏBLE. Els convidats no paraven de fer fotos. Semblava que estàvem en una escola de bruixeria de veritat!"'}
                </p>
                <p className="text-white/40 text-xs">
                  — Lorena i Carles, Casament Món Màgic
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
            {t('custom') || 'No veus el que busques? Fem'}{' '}
            <span className="text-amber-400 font-semibold">QUALSEVOL</span>{' '}
            {t('customSuffix') || 'temàtica que imaginis.'}
          </p>
          <Link href="/contacto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20
                       text-white font-semibold border border-white/20
                       transition-all"
            >
              {t('contact') || "Explica'ns la teva idea"} 💡
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
