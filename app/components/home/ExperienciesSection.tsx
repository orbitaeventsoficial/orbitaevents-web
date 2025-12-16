// app/components/home/ExperienciesSection.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - EXPERIÈNCIES IMMERSIVES v1.0
// ═══════════════════════════════════════════════════════════════════════════
//
// Component PROTAGONISTA - Experiències amb tematització completa
// - Món Màgic (Harry Potter)
// - Halloween
// - Altres temàtiques
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// DADES EXPERIÈNCIES
// ═══════════════════════════════════════════════════════════════════════════

const experiencies = [
  {
    id: 'mon-magic',
    name: 'Món Màgic',
    nameEs: 'Mundo Mágico',
    tagline: "L'experiència Harry Potter definitiva",
    taglineEs: "La experiencia Harry Potter definitiva",
    price: 850,
    priceLabel: 'Des de',
    priceLabelEs: 'Desde',
    image: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
    features: ['Tematització completa', 'DJ professional 4h', 'Il·luminació màgica', 'So 4000W'],
    featuresEs: ['Tematización completa', 'DJ profesional 4h', 'Iluminación mágica', 'Sonido 4000W'],
    badge: '✨ Exclusiu',
    badgeEs: '✨ Exclusivo',
    href: '/tematica-mon-magic',
    color: 'from-amber-500 to-yellow-600',
    bgGlow: 'bg-amber-500/20',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    nameEs: 'Halloween',
    tagline: 'La nit més terrorífica',
    taglineEs: 'La noche más terrorífica',
    price: 800,
    priceLabel: 'Des de',
    priceLabelEs: 'Desde',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    features: ['Tematització completa', 'DJ professional 4h', 'Ambient dramàtic', 'Efectes especials'],
    featuresEs: ['Tematización completa', 'DJ profesional 4h', 'Ambiente dramático', 'Efectos especiales'],
    badge: '🎃',
    badgeEs: '🎃',
    href: '/tematica-halloween',
    color: 'from-orange-500 to-red-600',
    bgGlow: 'bg-orange-500/20',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function ExperienciesSection() {
  const t = useTranslations('sections.experiencies');
  const tCommon = useTranslations('common');
  const isEs = tCommon('language') === 'es';

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-zinc-900" />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-semibold tracking-wider uppercase mb-6">
            {t('badge')}
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
            {t('title')}{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {experiencies.map((exp, i) => {
            // Get the translation key for this experience
            const expKey = exp.id === 'mon-magic' ? 'monMagic' : 'halloween';

            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group relative"
              >
                <Link href={exp.href}>
                  <div className="relative bg-zinc-900/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-zinc-800 hover:border-amber-500/50 transition-all duration-500 shadow-2xl">
                    {/* Image */}
                    <div className="relative h-64 md:h-72 overflow-hidden">
                      <Image
                        src={exp.image}
                        alt={t(`${expKey}.name`)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

                      {/* Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`inline-block px-4 py-2 bg-gradient-to-r ${exp.color} rounded-full text-white text-sm font-bold shadow-lg`}>
                          {t(`${expKey}.badge`)}
                        </span>
                      </div>

                      {/* Price overlay */}
                      <div className="absolute bottom-4 left-4">
                        <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2">
                          <span className="text-zinc-400 text-xs">{t('from')}</span>
                          <span className="text-3xl font-black text-white ml-2">{exp.price}€</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {t(`${expKey}.name`)}
                      </h3>
                      <p className="text-amber-500 font-medium mb-4">
                        {t(`${expKey}.tagline`)}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2 mb-6">
                        {(t.raw(`${expKey}.features`) as string[]).map((feature: string, j: number) => (
                          <li key={j} className="flex items-center gap-3 text-zinc-300">
                            <span className="text-amber-500 flex-shrink-0"><Icons.Check /></span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className={`flex items-center justify-between p-4 -mx-6 md:-mx-8 -mb-6 md:-mb-8 bg-gradient-to-r ${exp.color} rounded-b-3xl`}>
                        <span className="text-white font-bold text-lg">
                          {t('viewExperience')}
                        </span>
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          className="text-white"
                        >
                          <Icons.Arrow />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Altres temàtiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-zinc-400 mb-3">
            {t('otherThemes')}
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-semibold transition-colors"
          >
            <span>{t('consultIdea')}</span>
            <Icons.Arrow />
          </Link>
        </motion.div>

        {/* Separador cap a Discomòbil */}
        <div className="mt-20 pt-12 border-t border-zinc-800">
          <p className="text-center text-zinc-500 text-sm">
            {t('separatorText')}
          </p>
          <p className="text-center text-zinc-400 mt-1">
            {t('separatorCta')}
          </p>
        </div>
      </div>
    </section>
  );
}
