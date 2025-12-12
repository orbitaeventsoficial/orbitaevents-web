'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

const themes = [
  { id: 'magic', icon: '🪄', color: 'from-purple-500 to-blue-500' },
  { id: 'halloween', icon: '🎃', color: 'from-orange-500 to-red-600' },
  { id: 'disco', icon: '🪩', color: 'from-pink-500 to-purple-500' },
  { id: 'tropical', icon: '🌴', color: 'from-green-400 to-teal-500' },
  { id: 'custom', icon: '🎨', color: 'from-amber-400 to-orange-500' },
];

export function ThemingSection() {
  const t = useTranslations('themingSection');

  // Get features as array
  const features = [
    t('featured.features.0'),
    t('featured.features.1'),
    t('featured.features.2'),
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-black via-purple-950/20 to-black overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Encapçalament */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium mb-4 border border-amber-500/30"
          >
            ✨ {t('badge')}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            {t('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Temes disponibles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {themes.map((theme) => (
            <motion.div
              key={theme.id}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`px-5 py-2.5 bg-gradient-to-r ${theme.color} rounded-full cursor-pointer shadow-lg`}
            >
              <span className="text-white font-medium text-sm">
                {theme.icon} {t(`themes.${theme.id}`)}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Card destacada - Món Màgic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-colors"
        >
          <div className="grid md:grid-cols-2">
            {/* Imatge */}
            <div className="relative h-64 md:h-auto min-h-[300px]">
              <Image
                src="/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg"
                alt={t('featured.title')}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50 md:bg-gradient-to-t md:from-black/50 md:to-transparent" />
            </div>

            {/* Contingut */}
            <div className="p-8 flex flex-col justify-center">
              <span className="text-5xl mb-4">🪄</span>
              <h3 className="text-2xl font-bold text-white mb-4">
                {t('featured.title')}
              </h3>
              <p className="text-white/70 mb-6">
                {t('featured.desc')}
              </p>
              <ul className="space-y-2 mb-6">
                {features.map((feature, i) => (
                  <li key={i} className="text-white/60 flex items-center gap-2">
                    <span className="text-amber-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/tematica-mon-magic"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-full hover:scale-105 transition-transform w-fit"
              >
                {t('featured.cta')} →
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Testimoni real */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <blockquote className="text-xl text-white/80 italic max-w-2xl mx-auto mb-3">
            &ldquo;{t('testimonial.quote')}&rdquo;
          </blockquote>
          <p className="text-amber-400 font-medium">
            — {t('testimonial.author')}
          </p>
          <p className="text-white/40 text-sm mt-4">
            💡 {t('addTo')}
          </p>
        </motion.div>

      </div>
    </section>
  );
}
