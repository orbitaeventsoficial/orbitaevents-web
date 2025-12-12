'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const services = [
  {
    id: 'fiestas',
    titleKey: 'fiestas.title',
    descKey: 'fiestas.description',
    icon: '🎉',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
    priceFrom: 400,
    highlight: true
  },
  {
    id: 'bodas',
    titleKey: 'bodas.title',
    descKey: 'bodas.description',
    icon: '💍',
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
    priceFrom: 650,
    highlight: false
  },
  {
    id: 'empresas',
    titleKey: 'empresas.title',
    descKey: 'empresas.description',
    icon: '💼',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
    priceFrom: 500,
    highlight: false
  }
];

export function ServicesGrid() {
  const t = useTranslations('services');

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

        {/* Grid de serveis */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={service.href}
                className="group block h-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
              >
                {/* Imatge */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={t(service.titleKey)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Icona */}
                  <span className="absolute bottom-4 left-4 text-4xl">
                    {service.icon}
                  </span>

                  {/* Badge si és destacat */}
                  {service.highlight && (
                    <span className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                      {t('popular')}
                    </span>
                  )}
                </div>

                {/* Contingut */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {t(service.titleKey)}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {t(service.descKey)}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">
                      {t('from')} {service.priceFrom}€
                    </span>
                    <span className="text-white/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                      {t('viewMore')} →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
