// app/components/home/DiscomovilSection.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - DISCOMÒBIL SECTION v1.1 - i18n complet
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// DADES DISCOMÒBIL (només configuració, textos via traduccions)
// ═══════════════════════════════════════════════════════════════════════════

const discomovilPacksConfig = [
  {
    id: 'festes',
    emoji: '🎉',
    priceFrom: 200,
    priceTo: 450,
    href: '/servicios/fiestas',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    color: 'from-pink-500 to-rose-600',
    popular: true,
    badge: '🔥',
  },
  {
    id: 'bodes',
    emoji: '💍',
    priceFrom: 450,
    priceTo: 800,
    href: '/servicios/bodas',
    image: '/img/portfolio/bodas/bodas-01.webp',
    color: 'from-rose-500 to-pink-600',
    popular: false,
    badge: null,
  },
  {
    id: 'corporatiu',
    emoji: '💼',
    priceFrom: 450,
    priceTo: null,
    href: '/servicios/empresas',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    color: 'from-blue-500 to-indigo-600',
    popular: false,
    badge: null,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Arrow: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Speaker: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function DiscomovilSection() {
  const t = useTranslations('homeSections.discomovil');
  const equipment = t.raw('equipment') as string[];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 text-sm font-medium mb-6">
            {t('badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            {t('title1')}{' '}
            <span className="text-zinc-400">{t('title2')}</span>
          </h2>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {discomovilPacksConfig.map((pack, i) => {
            const packData = t.raw(`packs.${pack.id}`) as { name: string; subtitle: string; features: string[] };

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Link href={pack.href}>
                  <div className="relative bg-zinc-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-300 h-full">
                    {/* Badge */}
                    {pack.badge && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-block px-2 py-1 bg-amber-500 rounded-full text-xs font-bold text-black">
                          {pack.badge} {t('popular')}
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={pack.image}
                        alt={packData.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

                      {/* Emoji */}
                      <div className="absolute bottom-3 right-3 w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center text-2xl">
                        {pack.emoji}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Price */}
                      <div className="mb-2">
                        <span className="text-zinc-500 text-xs">
                          {t('from')}
                        </span>
                        <span className="text-2xl font-bold text-white ml-2">
                          {pack.priceFrom}€
                          {pack.priceTo && (
                            <span className="text-zinc-500 text-sm font-normal">
                              {' '}- {pack.priceTo}€
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-1">
                        {packData.name}
                      </h3>
                      <p className="text-zinc-500 text-sm mb-3">
                        {packData.subtitle}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {packData.features.map((f, j) => (
                          <span key={j} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                            <span className="text-emerald-500"><Icons.Check /></span>
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between text-zinc-400 group-hover:text-white transition-colors">
                        <span className="text-sm font-medium">
                          {t('viewMore')}
                        </span>
                        <Icons.Arrow />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Equip inclòs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                <Icons.Speaker />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('equipTitle')}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {equipment.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="text-emerald-500 flex-shrink-0"><Icons.Check /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Hora extra */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-zinc-500 text-sm">
            {t('extraHour')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
