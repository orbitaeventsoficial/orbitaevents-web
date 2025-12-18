'use client';

import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// ═══════════════════════════════════════════════════════════════
// SERVICES GRID - Versió amb temàtiques separades
// Halloween i Món Màgic com a cards independents
// Amb imatges de fons del portfolio
// ═══════════════════════════════════════════════════════════════

const SERVICE_KEYS = ['halloween', 'monMagic', 'casaments', 'festes', 'empreses'] as const;

// Imatges de fons per servei (del portfolio)
const SERVICE_IMAGES: Record<string, string> = {
  halloween: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
  monMagic: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
  casaments: '/img/portfolio/bodas/bodas-01.webp',
  festes: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
  empreses: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
};

// Colors i estils per servei
const SERVICE_STYLES: Record<string, { overlay: string; accent: string; hoverGlow: string }> = {
  halloween: {
    overlay: 'from-orange-950/80 via-black/70 to-black/90',
    accent: 'text-orange-400',
    hoverGlow: 'hover:shadow-orange-500/30',
  },
  monMagic: {
    overlay: 'from-amber-950/80 via-black/70 to-black/90',
    accent: 'text-amber-400',
    hoverGlow: 'hover:shadow-amber-500/30',
  },
  casaments: {
    overlay: 'from-pink-950/80 via-black/70 to-black/90',
    accent: 'text-pink-400',
    hoverGlow: 'hover:shadow-pink-500/30',
  },
  festes: {
    overlay: 'from-purple-950/80 via-black/70 to-black/90',
    accent: 'text-purple-400',
    hoverGlow: 'hover:shadow-purple-500/30',
  },
  empreses: {
    overlay: 'from-blue-950/80 via-black/70 to-black/90',
    accent: 'text-blue-400',
    hoverGlow: 'hover:shadow-blue-500/30',
  },
};

// Hrefs per cada servei
const SERVICE_HREFS: Record<string, string> = {
  halloween: '/tematica-halloween',
  monMagic: '/tematica-mon-magic',
  casaments: '/servicios/bodas',
  festes: '/servicios/fiestas',
  empreses: '/servicios/empresas',
};

export default function ServicesGridElegant() {
  const t = useTranslations('servicesGrid');

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-black to-zinc-950">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-orange-400 text-sm font-medium tracking-wider uppercase">
            {t('subtitle')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            {t('title')}
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        {/* Grid de serveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {SERVICE_KEYS.map((key, index) => {
            const styles = SERVICE_STYLES[key];
            const href = SERVICE_HREFS[key];
            const image = SERVICE_IMAGES[key];
            const badge = t(`items.${key}.badge`);
            const features = t.raw(`items.${key}.features`) as string[];

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative group
                  ${index < 2 ? 'lg:col-span-1 md:col-span-1' : ''}
                `}
              >
                <Link href={href}>
                  <div
                    className={`
                      relative h-full min-h-[280px] rounded-2xl overflow-hidden
                      border border-white/10
                      hover:border-white/30
                      transition-all duration-300
                      hover:shadow-xl ${styles.hoverGlow}
                      cursor-pointer
                    `}
                  >
                    {/* Imatge de fons */}
                    <Image
                      src={image}
                      alt={t(`items.${key}.title`)}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Overlay gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${styles.overlay}`} />

                    {/* Badge si existeix */}
                    {badge && badge !== `items.${key}.badge` && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                          {badge}
                        </span>
                      </div>
                    )}

                    {/* Contingut */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t(`items.${key}.title`)}
                      </h3>
                      <p className="text-white/70 text-sm mb-4 line-clamp-2">
                        {t(`items.${key}.description`)}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {features.slice(0, 3).map((feature, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-white/80 text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Preu */}
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${styles.accent}`}>
                          {t(`items.${key}.price`)}
                        </span>
                        <span className="text-white/50 text-sm group-hover:text-white transition-colors">
                          {t('viewMore')} →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA altres temàtiques */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {t('notFound')}
          </h3>
          <p className="text-white/60 mb-6">{t('contact')}</p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-full text-black font-bold transition-all hover:scale-105"
          >
            {t('ctaButton')}
            <span>💬</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
