'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PUBLIC_HALLOWEEN_DECORATION_ITEMS, PUBLIC_HALLOWEEN_PREVIEW_ICONS } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════
// HALLOWEEN DECORATION SECTION
// Mostra tots els elements de decoració disponibles
// ═══════════════════════════════════════════════════════════════


export default function HalloweenDecorationSection() {
  const t = useTranslations('halloweenPage.decoration');

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-zinc-950 to-black relative overflow-hidden oe-grid-pattern">
      {/* Fons decoratiu */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-8xl">🕸️</div>
        <div className="absolute top-40 right-20 text-6xl">🕷️</div>
        <div className="absolute bottom-20 left-1/4 text-7xl">💀</div>
        <div className="absolute bottom-40 right-1/3 text-5xl">🦇</div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}{' '}
            <span className="text-orange-500">{t('titleHighlight')}</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Grid de decoració */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {PUBLIC_HALLOWEEN_DECORATION_ITEMS.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="
                relative p-6 rounded-2xl
                bg-gradient-to-br from-orange-500/10 to-red-900/10
                border border-orange-500/20
                hover:border-orange-500/40
                transition-all duration-300
                group
              "
            >
              {/* Icona gran */}
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              {/* Títol */}
              <h3 className="text-white font-bold mb-2 text-sm md:text-base">
                {t(`items.${item.key}.title`)}
              </h3>

              {/* Descripció */}
              <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                {t(`items.${item.key}.description`)}
              </p>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        {/* Nota important */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
            <span className="text-2xl">✅</span>
            <div className="text-left">
              <p className="text-white font-bold">Tot inclòs en el preu</p>
              <p className="text-white/60 text-sm">Muntatge, desmuntatge i transport</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MINI PREVIEW - Per mostrar a la home o altres pàgines
// ═══════════════════════════════════════════════════════════════

export function HalloweenDecorationPreview() {
  const items = PUBLIC_HALLOWEEN_PREVIEW_ICONS;

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/60 text-sm">Decoració inclosa:</span>
      <div className="flex gap-1">
        {items.map((icon, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="text-lg"
          >
            {icon}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
