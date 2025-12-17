'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES GRID ELEGANT v2.1 - i18n complert
// ═══════════════════════════════════════════════════════════════════════════

const serviceIds = ['tematiques', 'casaments', 'festes', 'empreses'] as const;

const serviceConfig = {
  tematiques: {
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    href: '/experiencies',
    highlight: true,
  },
  casaments: {
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
    highlight: false,
  },
  festes: {
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
    highlight: false,
  },
  empreses: {
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
    highlight: false,
  },
};

export default function ServicesGridElegant() {
  const t = useTranslations('services');
  const tGrid = useTranslations('services.grid');

  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[#C9A962] text-sm font-medium tracking-[0.2em] uppercase mb-4"
          >
            {tGrid('subtitle')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-semibold text-white mb-4"
          >
            {tGrid('title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#888888] text-lg max-w-xl mx-auto"
          >
            {tGrid('description')}
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceIds.map((id, index) => {
            const config = serviceConfig[id];
            const title = tGrid(`${id}.title`);
            const description = tGrid(`${id}.description`);
            const price = tGrid(`${id}.price`);
            const features = tGrid.raw(`${id}.features`) as string[];
            const badge = id === 'tematiques' ? tGrid(`${id}.badge`) : null;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={config.href} className="group block h-full">
                  <div className={`
                    relative h-full bg-[#111111] rounded-2xl overflow-hidden
                    border transition-all duration-500
                    ${config.highlight
                      ? 'border-[#C9A962]/50 hover:border-[#C9A962] ring-1 ring-[#C9A962]/20'
                      : 'border-white/[0.06] hover:border-[#C9A962]/30'
                    }
                  `}>

                    {/* Badge */}
                    {badge && (
                      <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-[#0A0A0A] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {badge}
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={config.image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Price tag */}
                      <div className="text-[#C9A962] text-sm font-medium mb-2">
                        {price}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#C9A962] transition-colors">
                        {title}
                      </h3>

                      {/* Description */}
                      <p className="text-[#888888] text-sm mb-4">
                        {description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {features.map((feature) => (
                          <span
                            key={feature}
                            className="text-xs text-[#666666] bg-white/[0.03] px-2 py-1 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center text-sm text-[#C9A962] font-medium group-hover:gap-3 gap-2 transition-all">
                        <span>{t('viewMore')}</span>
                        <svg
                          className="w-4 h-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-[#666666] mb-4">{t('notFound')}</p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 text-white hover:text-[#C9A962] transition-colors"
          >
            <span>{t('contact')}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
