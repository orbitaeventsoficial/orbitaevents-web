'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE SERVICES CARDS - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Carrusel horizontal de servicios con:
 * - Cards 3D con efecto de profundidad
 * - Snap scroll suave
 * - Parallax en imágenes
 * - Glow effects
 * - Badges animados
 * - Swipe indicators
 */

import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { useMobile } from './MobileAppShell';

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

const SERVICES = [
  {
    id: 'halloween',
    emoji: '🎃',
    title: 'Halloween',
    subtitle: 'Nits de terror',
    description: 'Decoració completa, DJ temàtic, efectes FX',
    price: 'Des de 600€',
    badge: '🔥 Temporada 2025',
    badgeColor: 'from-orange-500 to-red-500',
    image: '/img/portfolio/tematicas/halloween-01.webp',
    gradient: 'from-orange-500/20 via-red-500/10 to-transparent',
    href: '/tematica-halloween',
    features: ['Fantasmes gegants', 'Caldero màgic', 'Fum baix'],
  },
  {
    id: 'monmagic',
    emoji: '🪄',
    title: 'Món Màgic',
    subtitle: 'Escola de màgia',
    description: 'Sobres amb lacre, veles flotants, ambientació',
    price: 'Des de 600€',
    badge: '✨ Experiència única',
    badgeColor: 'from-amber-500 to-yellow-500',
    image: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
    gradient: 'from-amber-500/20 via-purple-500/10 to-transparent',
    href: '/tematica-mon-magic',
    features: ['Lacre artesanal', 'Veles flotants', 'Decoració'],
  },
  {
    id: 'bodas',
    emoji: '💒',
    title: 'Casaments',
    subtitle: 'El teu dia perfecte',
    description: 'DJ professional, so, llums, coordinació',
    price: 'Des de 650€',
    badge: '',
    badgeColor: '',
    image: '/img/portfolio/bodas/bodas-01.webp',
    gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
    href: '/servicios/bodas',
    features: ['DJ Pro', 'So 4000W', 'Backup 100%'],
  },
  {
    id: 'fiestas',
    emoji: '🎉',
    title: 'Festes',
    subtitle: 'Aniversaris i més',
    description: 'Discomòbil complet amb tot inclòs',
    price: 'Des de 400€',
    badge: '',
    badgeColor: '',
    image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
    href: '/servicios/fiestas',
    features: ['Llums LED', 'Efectes', 'Tot inclòs'],
  },
  {
    id: 'empresas',
    emoji: '🏢',
    title: 'Empreses',
    subtitle: 'Events corporatius',
    description: 'Audiovisual, branding, factura',
    price: 'Des de 500€',
    badge: '',
    badgeColor: '',
    image: '/img/portfolio/empresas/empresas-01.webp',
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    href: '/servicios/empresas',
    features: ['Micro sense fil', 'Branding', 'Factura'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CARD 3D
// ═══════════════════════════════════════════════════════════════════════════

interface ServiceCardProps {
  service: typeof SERVICES[0];
  isActive: boolean;
  index: number;
}

function ServiceCard3D({ service, isActive, index }: ServiceCardProps) {
  const { haptic } = useMobile();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  
  const springConfig = { damping: 20, stiffness: 300 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
      }}
      className="relative flex-shrink-0 w-[85vw] max-w-[340px] h-[420px] perspective-1000"
    >
      <motion.a
        href={service.href}
        whileTap={{ scale: 0.98 }}
        onTapStart={() => haptic('light')}
        className="block relative w-full h-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
      >
        {/* Image with parallax */}
        <div className="absolute inset-0">
          <Image
            src={service.image}
            alt={service.title}
            fill
            className="object-cover"
            sizes="340px"
          />
          
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        {/* Badge */}
        {service.badge && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${service.badgeColor} text-white text-xs font-bold shadow-lg`}>
              {service.badge}
            </div>
          </motion.div>
        )}

        {/* Content */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-6"
          style={{ transform: 'translateZ(20px)' }}
        >
          {/* Emoji */}
          <motion.span 
            className="text-5xl block mb-3"
            animate={isActive ? { 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.5 }}
          >
            {service.emoji}
          </motion.span>

          {/* Title */}
          <h3 className="text-2xl font-black text-white mb-1">
            {service.title}
          </h3>
          
          {/* Subtitle */}
          <p className="text-white/60 text-sm mb-3">
            {service.subtitle}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {service.features.map((feature, i) => (
              <span 
                key={i}
                className="px-2 py-1 bg-white/10 rounded-lg text-white/70 text-xs"
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-bold text-lg">
              {service.price}
            </span>
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <span>Veure</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Glow effect on active */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              boxShadow: `0 0 60px 10px ${service.id === 'halloween' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
            }}
          />
        )}
      </motion.a>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileServicesCards() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { haptic } = useMobile();

  // Detectar card activa basándose en scroll position
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.85 + 16; // width + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
        haptic('light');
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, haptic]);

  return (
    <section className="py-12 overflow-hidden">
      {/* Section Header */}
      <div className="px-6 mb-6">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-amber-500 text-sm font-medium tracking-wider uppercase"
        >
          Els nostres serveis
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-black text-white mt-2"
        >
          Què necessites?
        </motion.h2>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-6 pb-4 hide-scrollbar snap-x snap-mandatory"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {SERVICES.map((service, index) => (
          <div 
            key={service.id} 
            className="snap-center"
            style={{ scrollSnapAlign: 'center' }}
          >
            <ServiceCard3D
              service={service}
              isActive={index === activeIndex}
              index={index}
            />
          </div>
        ))}
        
        {/* Spacer al final */}
        <div className="flex-shrink-0 w-6" />
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {SERVICES.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              haptic('light');
              const container = scrollRef.current;
              if (container) {
                const cardWidth = container.offsetWidth * 0.85 + 16;
                container.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth',
                });
              }
            }}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex 
                ? 'w-8 bg-amber-500' 
                : 'w-2 bg-white/20'
            }`}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Swipe hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center text-white/30 text-xs mt-4"
      >
        ← Swipe per veure més →
      </motion.p>
    </section>
  );
}
