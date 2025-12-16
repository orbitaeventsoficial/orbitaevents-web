// app/components/home/ServiciosGrid.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - SERVICIOS GRID PREMIUM v1.0
// ═══════════════════════════════════════════════════════════════════════════
//
// Grid de servicios que VENDE:
// - Cards con hover cinematográfico
// - Precios visibles
// - Badges de popularidad
// - Iconos animados
// - CTA en cada card
// - Mobile optimizado
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Servicio {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  price: string;
  popular?: boolean;
  badge?: string;
  features: string[];
  color: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS
// ═══════════════════════════════════════════════════════════════════════════

const SERVICIOS: Servicio[] = [
  {
    id: 'bodas',
    emoji: '💍',
    title: 'Casaments',
    subtitle: 'El dia més especial, perfecte',
    description: 'Cerimònia, còctel i festa. DJ + so + llums + coordinació total.',
    image: '/img/portfolio/bodas/bodas-01.webp',
    href: '/servicios/bodas',
    price: 'Des de 650€',
    popular: false,
    features: ['DJ Professional', 'So + Llums', 'Coordinació', 'Backup 100%'],
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'fiestas',
    emoji: '🎉',
    title: 'Festes',
    subtitle: 'La festa que no oblidaran',
    description: 'Aniversaris, comunions, celebracions. Discomòbil completa on vulguis.',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    href: '/servicios/fiestas',
    price: 'Des de 400€',
    popular: true,
    badge: '🔥 El més demanat',
    features: ['Discomòbil', 'Llums LED', 'Efectes', 'Tot inclòs'],
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'empresas',
    emoji: '💼',
    title: 'Empreses',
    subtitle: 'Events corporatius d\'impacte',
    description: 'Team building, sopars d\'empresa, inauguracions. Professionalitat garantida.',
    image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    href: '/servicios/empresas',
    price: 'Des de 500€',
    features: ['Audiovisual', 'Micro sense fil', 'Branding', 'Factura'],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'tematicas',
    emoji: '🎃',
    title: 'Temàtiques',
    subtitle: 'Experiències immersives',
    description: 'Halloween, Món Màgic, i qualsevol temàtica que imaginis.',
    image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    href: '/tematica-halloween',
    price: 'Des de 600€',
    badge: '✨ Exclusiu',
    features: ['Decoració', 'Efectes FX', 'Ambientació', 'Animació'],
    color: 'from-purple-500 to-violet-600',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Arrow: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Service Card
// ═══════════════════════════════════════════════════════════════════════════

function ServiceCard({ servicio, index }: { servicio: Servicio; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <Link href={servicio.href} className="block">
        <div className="relative bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500">
          {/* Popular/Badge */}
          {servicio.badge && (
            <div className="absolute top-4 left-4 z-20">
              <span className={`inline-block px-3 py-1.5 bg-gradient-to-r ${servicio.color} rounded-full text-white text-xs font-bold shadow-lg`}>
                {servicio.badge}
              </span>
            </div>
          )}

          {/* Image */}
          <div className="relative h-56 overflow-hidden">
            <Image
              src={servicio.image}
              alt={servicio.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
            
            {/* Emoji overlay */}
            <motion.div
              animate={{ scale: isHovered ? 1.2 : 1, y: isHovered ? -10 : 0 }}
              className="absolute bottom-4 right-4 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-xl"
            >
              {servicio.emoji}
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Price */}
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-bold bg-gradient-to-r ${servicio.color} bg-clip-text text-transparent`}>
                {servicio.price}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-1">{servicio.title}</h3>
            <p className="text-white/60 text-sm mb-4">{servicio.subtitle}</p>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-6">
              {servicio.features.map((feature, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-lg text-xs text-white/70"
                >
                  <span className="text-emerald-400"><Icons.Check /></span>
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className={`flex items-center justify-between p-4 -mx-6 -mb-6 bg-gradient-to-r ${servicio.color} bg-opacity-10 border-t border-white/5`}>
              <span className="text-white font-semibold">Veure més</span>
              <motion.div
                animate={{ x: isHovered ? 5 : 0 }}
                className="text-white"
              >
                <Icons.Arrow />
              </motion.div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function ServiciosGrid() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
            🎯 El que necessites
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Què <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">necessites?</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Tria el tipus d'event i t'ajudem a crear-lo. Cada pack inclou tot el que necessites.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICIOS.map((servicio, index) => (
            <ServiceCard key={servicio.id} servicio={servicio} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-white/60 mb-4">
            No veus el que busques?
          </p>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all"
          >
            <span>Consulta'ns sense compromís</span>
            <Icons.Arrow />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
