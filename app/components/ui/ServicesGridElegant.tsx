'use client';

import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// Solo tres puertas principales: Bodas / Fiestas / Empresas
const SERVICE_KEYS = ['casaments', 'festes', 'empreses'] as const;

// Imagenes de fondo por servicio (portfolio)
const SERVICE_IMAGES: Record<string, string> = {
  casaments: '/img/portfolio/bodas/bodas-01.avif',
  festes: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
  empreses: '/img/portfolio/eventos-empresa/eventos-empresa-01.avif',
};

// Estilos por servicio
const SERVICE_STYLES: Record<string, { overlay: string; accent: string; hoverGlow: string }> = {
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

// Hrefs por servicio
const SERVICE_HREFS: Record<string, string> = {
  casaments: '/servicios/bodas',
  festes: '/servicios/fiestas',
  empreses: '/servicios/empresas',
};

export default function ServicesGridElegant() {
  const t = useTranslations('servicesGrid');

  return (
    <section className="py-6 md:py-10 bg-gradient-to-b from-black to-zinc-950">
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
                <Link href={href} className="block touch-manipulation">
                  <div
                    className={`
                      relative h-full min-h-[320px] md:min-h-[280px] rounded-2xl overflow-hidden
                      border border-white/10
                      hover:border-white/30 active:border-white/40
                      transition-all duration-300
                      hover:shadow-xl active:scale-[0.98] ${styles.hoverGlow}
                      cursor-pointer
                    `}
                  >
                    {/* Imagen de fondo */}
                    <Image
                      src={image}
                      alt={t(`items.${key}.title`)}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 90vw"
                      quality={70}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Overlay gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${styles.overlay}`} />

                    {/* Badge si existe */}
                    {badge && badge !== `items.${key}.badge` && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                          {badge}
                        </span>
                      </div>
                    )}

                    {/* Contenido */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-10">
                      <h3 className="text-xl md:text-xl font-bold text-white mb-2">
                        {t(`items.${key}.title`)}
                      </h3>
                      <p className="text-white/80 text-sm md:text-sm mb-4 line-clamp-2 leading-relaxed">
                        {t(`items.${key}.description`)}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {features.slice(0, 3).map((feature, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white/90 text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Precio */}
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-base ${styles.accent}`}>
                          {t(`items.${key}.price`)}
                        </span>
                        <span className="text-white/60 text-sm font-medium group-hover:text-white transition-colors flex items-center gap-1">
                          {t('viewMore')}
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA otras tematicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
            {t('notFound')}<br />
            <span className="text-orange-400">{t('contact')}</span>
          </h3>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-8 py-5 md:py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-full text-black font-bold transition-all hover:scale-105 active:scale-95 min-h-[56px] touch-manipulation"
          >
            {t('ctaButton')}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        {/* CTA móvil eliminado - ya existe BottomNav + FloatingCTAs globales */}
      </div>
    </section>
  );
}
