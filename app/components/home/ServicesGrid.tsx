'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const services = [
  {
    id: 'fiestas',
    title: 'Festes Privades',
    titleEs: 'Fiestas Privadas',
    desc: 'Aniversaris, festes a casa, comunions, festes majors. Discomòbil completa on vulguis.',
    descEs: 'Cumpleaños, fiestas en casa, comuniones, fiestas mayores. Discomóvil completa donde quieras.',
    icon: '🎉',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
    priceFrom: 400,
    highlight: 'El més demanat'
  },
  {
    id: 'bodas',
    title: 'Bodes',
    titleEs: 'Bodas',
    desc: 'Des de la cerimònia fins a l\'últim ball. So, llums i coordinació perfecta.',
    descEs: 'Desde la ceremonia hasta el último baile. Sonido, luces y coordinación perfecta.',
    icon: '💍',
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
    priceFrom: 650,
    highlight: null
  },
  {
    id: 'empresas',
    title: 'Empreses',
    titleEs: 'Empresas',
    desc: 'Dinars d\'empresa, inauguracions, convencions. Professionalitat garantida.',
    descEs: 'Cenas de empresa, inauguraciones, convenciones. Profesionalidad garantizada.',
    icon: '💼',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
    priceFrom: 500,
    highlight: null
  }
];

interface ServicesGridProps {
  locale?: 'ca' | 'es';
}

export function ServicesGrid({ locale = 'ca' }: ServicesGridProps) {
  const isEs = locale === 'es';
  
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
            {isEs ? '¿Qué necesitas?' : 'Què necessites?'}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60"
          >
            {isEs 
              ? 'Elige el tipo de evento y te ayudamos a crearlo'
              : 'Tria el tipus d\'event i t\'ajudem a crear-lo'
            }
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
                    alt={isEs ? service.titleEs : service.title}
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
                      {service.highlight}
                    </span>
                  )}
                </div>
                
                {/* Contingut */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {isEs ? service.titleEs : service.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {isEs ? service.descEs : service.desc}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-semibold">
                      {isEs ? 'Desde' : 'Des de'} {service.priceFrom}€
                    </span>
                    <span className="text-white/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all">
                      {isEs ? 'Ver más' : 'Veure més'} →
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
