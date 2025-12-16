'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICES GRID ELEGANT
// Cards netes, sense emojis cridaners, hover subtil
// ═══════════════════════════════════════════════════════════════════════════

const services = [
  {
    id: 'casaments',
    title: 'Casaments',
    description: 'El dia més especial mereix ser perfecte',
    price: 'Des de 650€',
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
    features: ['DJ Professional', 'So + Llums', 'Coordinació', 'Backup 100%'],
  },
  {
    id: 'festes',
    title: 'Festes Privades',
    description: 'La festa que recordaran sempre',
    price: 'Des de 400€',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
    features: ['Discomòbil', 'Llums LED', 'Efectes', 'Tot inclòs'],
    popular: true,
  },
  {
    id: 'empreses',
    title: 'Empreses',
    description: 'Events corporatius d\'impacte',
    price: 'Des de 500€',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
    features: ['Audiovisual', 'Micro sense fil', 'Branding', 'Factura'],
  },
  {
    id: 'tematiques',
    title: 'Experiències Temàtiques',
    description: 'Harry Potter, Halloween i més',
    price: 'Des de 600€',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    href: '/experiencies',
    features: ['Decoració', 'Efectes FX', 'Ambientació', 'Animació'],
    exclusive: true,
  },
];

export default function ServicesGridElegant() {
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
            Els nostres serveis
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-semibold text-white mb-4"
          >
            Què necessites?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#888888] text-lg max-w-xl mx-auto"
          >
            Tria el tipus d'event i t'ajudem a crear-lo exactament com l'imagines.
          </motion.p>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={service.href} className="group block h-full">
                <div className="relative h-full bg-[#111111] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[#C9A962]/30 transition-all duration-500">
                  
                  {/* Badge */}
                  {service.popular && (
                    <div className="absolute top-4 left-4 z-10 bg-[#C9A962] text-[#0A0A0A] text-xs font-semibold px-3 py-1 rounded-full">
                      Més demanat
                    </div>
                  )}
                  {service.exclusive && (
                    <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20">
                      Exclusiu
                    </div>
                  )}
                  
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Price tag */}
                    <div className="text-[#C9A962] text-sm font-medium mb-2">
                      {service.price}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#C9A962] transition-colors">
                      {service.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-[#888888] text-sm mb-4">
                      {service.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.features.map((feature) => (
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
                      <span>Veure més</span>
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
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-[#666666] mb-4">No trobes el que busques?</p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 text-white hover:text-[#C9A962] transition-colors"
          >
            <span>Consulta'ns sense compromís</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
