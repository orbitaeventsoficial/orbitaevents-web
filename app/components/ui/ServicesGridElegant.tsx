'use client';

import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// Solo tres puertas principales: Bodas / Fiestas / Empresas
const SERVICE_KEYS = ['casaments', 'festes', 'empreses'] as const;

// Imagenes de fondo por servicio (portfolio)
const SERVICE_IMAGES: Record<string, string> = {
  casaments: '/img/portfolio/bodas/bodas-01.webp',
  festes: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
  empreses: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
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

                      {/* Precio */}
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${styles.accent}`}>
                          {t(`items.${key}.price`)}
                        </span>
                        <span className="text-white/50 text-sm group-hover:text-white transition-colors">
                          {t('viewMore')} -&gt;
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-full text-black font-bold transition-all hover:scale-105"
          >
            {t('ctaButton')}
            <span>-&gt;</span>
          </Link>
        </motion.div>

        {/* CTA pegajoso movil */}
        <div className="md:hidden fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-lg p-3 shadow-lg shadow-orange-500/10 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{t('mobileCta.ready')}</p>
              <p className="text-white/60 text-xs">{t('mobileCta.response')}</p>
            </div>
            <div className="flex gap-2">
              <a
                href="https://wa.me/34699121023?text=Hola!%20Quiero%20informacion%20para%20mi%20evento."
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#25D366] text-white text-xs font-semibold rounded-xl"
              >
                {t('mobileCta.whatsapp')}
              </a>
              <Link
                href="/configurador"
                className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-xl"
              >
                {t('mobileCta.prices')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
