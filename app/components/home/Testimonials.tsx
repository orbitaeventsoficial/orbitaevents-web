'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Testimonials() {
  const t = useTranslations('testimonials');

  return (
    <section className="py-20 bg-black">
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
            className="text-white/60"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Testimoni principal */}
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur rounded-2xl overflow-hidden border border-white/10"
          >
            {/* Imatge */}
            <div className="relative h-48 md:h-56">
              <Image
                src="/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg"
                alt={t('author')}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            <div className="p-8">
              {/* Cita */}
              <blockquote className="text-lg md:text-xl text-white/90 italic mb-6 leading-relaxed">
                &quot;{t('quote')}&quot;
              </blockquote>

              {/* Autor */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-white font-semibold text-lg">
                    {t('author')}
                  </p>
                  <p className="text-white/50 text-sm">
                    {t('event')} • {t('date')}
                  </p>
                </div>

                <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                  ✓ {t('verified')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA per deixar opinió */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-white/50 mb-4">{t('cta')}</p>
          <Link
            href="/opiniones/nueva"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 text-amber-400 rounded-full hover:bg-amber-500/30 transition border border-amber-500/30"
          >
            ✨ {t('ctaButton')}
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
