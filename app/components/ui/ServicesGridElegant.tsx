'use client';

import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════
// SERVICES GRID - Versió amb temàtiques separades
// Halloween i Món Màgic com a cards independents
// ═══════════════════════════════════════════════════════════════

const SERVICE_KEYS = ['halloween', 'monMagic', 'casaments', 'festes', 'empreses'] as const;

// Icones i colors per servei
const SERVICE_STYLES: Record<string, { gradient: string; iconBg: string; hoverGlow: string }> = {
  halloween: {
    gradient: 'from-orange-500/20 to-orange-900/20',
    iconBg: 'bg-orange-500/20',
    hoverGlow: 'hover:shadow-orange-500/20',
  },
  monMagic: {
    gradient: 'from-amber-500/20 to-amber-900/20',
    iconBg: 'bg-amber-500/20',
    hoverGlow: 'hover:shadow-amber-500/20',
  },
  casaments: {
    gradient: 'from-pink-500/20 to-pink-900/20',
    iconBg: 'bg-pink-500/20',
    hoverGlow: 'hover:shadow-pink-500/20',
  },
  festes: {
    gradient: 'from-purple-500/20 to-purple-900/20',
    iconBg: 'bg-purple-500/20',
    hoverGlow: 'hover:shadow-purple-500/20',
  },
  empreses: {
    gradient: 'from-blue-500/20 to-blue-900/20',
    iconBg: 'bg-blue-500/20',
    hoverGlow: 'hover:shadow-blue-500/20',
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
                      relative h-full p-6 rounded-2xl
                      bg-gradient-to-br ${styles.gradient}
                      border border-white/10
                      hover:border-white/20
                      transition-all duration-300
                      hover:shadow-xl ${styles.hoverGlow}
                      cursor-pointer
                    `}
                  >
                    {/* Badge si existeix */}
                    {badge && badge !== `items.${key}.badge` && (
                      <div className="absolute -top-3 left-4">
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                          {badge}
                        </span>
                      </div>
                    )}

                    {/* Contingut */}
                    <div className="pt-2">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {t(`items.${key}.title`)}
                      </h3>
                      <p className="text-white/60 text-sm mb-4">
                        {t(`items.${key}.description`)}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {features.slice(0, 4).map((feature, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white/5 rounded text-white/70 text-xs"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Preu */}
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold">
                          {t(`items.${key}.price`)}
                        </span>
                        <span className="text-white/40 text-sm group-hover:text-orange-400 transition-colors">
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
          className="text-center mt-12"
        >
          <p className="text-white/50 mb-4">{t('notFound')}</p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-colors"
          >
            {t('contact')}
            <span>💬</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
