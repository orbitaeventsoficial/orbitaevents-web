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
 * 
 * FIXED:
 * - Removed unused PanInfo import
 * - Textos usando sistema de traducciones
 * - Rutas con locale
 */

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useMobile } from './MobileAppShell';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CARD 3D
// ═══════════════════════════════════════════════════════════════════════════

interface Service {
  id: string;
  emoji: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  priceKey: string;
  badgeKey: string;
  badgeColor: string;
  image: string;
  gradient: string;
  href: string;
  features: string[];
}

interface ServiceCardProps {
  service: Service;
  isActive: boolean;
  index: number;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}

function ServiceCard3D({ service, isActive, index, locale, t }: ServiceCardProps) {
  const reduceMotion = useReducedMotion();

  const title = t(`services.${service.id}.title`);
  const subtitle = t(`services.${service.id}.subtitle`);
  const price = t(`services.${service.id}.price`);
  const badge = service.badgeKey ? t(`services.${service.id}.badge`) : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="relative flex-shrink-0 w-[75vw] max-w-[300px] h-[420px]"
    >
      <motion.a
        href={`/${locale}${service.href}`}
        whileTap={{ scale: 0.97 }}
        className="block relative w-full h-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/15 shadow-lg"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, type: 'spring', damping: 20 }}
      >
        {/* Image with enhanced effects */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image
            src={service.image}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 pointer-events-none"
            sizes="60vw"
            quality={55}
            draggable={false}
          />

          {/* Enhanced gradient overlays */}
          <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-30`} />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-zinc-950/35 to-zinc-950/10" />

        </div>

        {/* Badge - Enhanced */}
        {badge && (
          <div className="absolute top-4 left-4 z-10">
            <div className={`relative px-3 py-1.5 rounded-full bg-gradient-to-r ${service.badgeColor} text-white text-xs font-black shadow-lg`}>
              <span className="relative">{badge}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          {/* Emoji */}
          <span className="text-5xl block mb-3">{service.emoji}</span>

          {/* Title */}
          <h3 className="text-2xl font-black text-white mb-1">
            {title}
          </h3>
          
          {/* Subtitle */}
          <p className="text-white/60 text-sm mb-3">
            {subtitle}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {service.features.map((featureKey, i) => (
              <span
                key={`${service.id}-feature-${i}`}
                className="px-2 py-1 bg-white/10 rounded-lg text-white/70 text-xs"
              >
                {t(`services.${service.id}.features.${i}`)}
              </span>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-bold text-lg">
              {price}
            </span>
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <span>{t('viewMore')}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Enhanced glow effect on active */}
        {isActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-3xl pointer-events-none z-0"
              initial={{ opacity: 0 }}
              animate={reduceMotion ? { opacity: 0.7 } : { opacity: [0.5, 1, 0.5] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
              style={{
                boxShadow: `0 0 80px 15px ${service.id === 'halloween' ? 'rgba(249, 115, 22, 0.5)' : service.id === 'monmagic' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(251, 191, 36, 0.5)'}`,
              }}
            />
            <motion.div
              className={`absolute -inset-6 rounded-3xl pointer-events-none bg-gradient-to-r ${service.id === 'halloween' ? 'from-orange-500 to-red-500' : service.id === 'monmagic' ? 'from-purple-500 to-pink-500' : 'from-amber-400 to-orange-500'} opacity-35 z-0`}
              animate={reduceMotion ? { opacity: 0.5 } : { rotate: [0, 360] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ filter: 'blur(28px)' }}
            />
          </>
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
  const { locale } = useMobile();
  const t = useTranslations('mobileServices');
  const reduceMotion = useReducedMotion();

  // Services data with translation keys
  const SERVICES: Service[] = useMemo(() => [
    {
      id: 'bodas',
      emoji: '💒',
      titleKey: 'bodas.title',
      subtitleKey: 'bodas.subtitle',
      descriptionKey: 'bodas.description',
      priceKey: 'bodas.price',
      badgeKey: '',
      badgeColor: '',
      image: '/img/portfolio/bodas/bodas-01.webp',
      gradient: 'from-pink-500/14 via-rose-500/6 to-transparent',
      href: '/servicios/bodas',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'halloween',
      emoji: '🎃',
      titleKey: 'halloween.title',
      subtitleKey: 'halloween.subtitle',
      descriptionKey: 'halloween.description',
      priceKey: 'halloween.price',
      badgeKey: 'halloween.badge',
      badgeColor: 'from-orange-500 to-red-500',
      image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
      gradient: 'from-orange-500/14 via-red-500/6 to-transparent',
      href: '/tematica-halloween',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'monmagic',
      emoji: '🪄',
      titleKey: 'monmagic.title',
      subtitleKey: 'monmagic.subtitle',
      descriptionKey: 'monmagic.description',
      priceKey: 'monmagic.price',
      badgeKey: 'monmagic.badge',
      badgeColor: 'from-amber-500 to-yellow-500',
      image: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
      gradient: 'from-amber-500/14 via-purple-500/6 to-transparent',
      href: '/tematica-mon-magic',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'fiestas',
      emoji: '🎉',
      titleKey: 'fiestas.title',
      subtitleKey: 'fiestas.subtitle',
      descriptionKey: 'fiestas.description',
      priceKey: 'fiestas.price',
      badgeKey: '',
      badgeColor: '',
      image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
      gradient: 'from-purple-500/14 via-violet-500/6 to-transparent',
      href: '/servicios/fiestas',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'empresas',
      emoji: '🏢',
      titleKey: 'empresas.title',
      subtitleKey: 'empresas.subtitle',
      descriptionKey: 'empresas.description',
      priceKey: 'empresas.price',
      badgeKey: '',
      badgeColor: '',
      image: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
      gradient: 'from-blue-500/14 via-cyan-500/6 to-transparent',
      href: '/servicios/empresas',
      features: ['feature1', 'feature2', 'feature3'],
    },
  ], []);

  // Refs to avoid re-binding scroll handlers
  useEffect(() => {
    setActiveIndex(0);
  }, []);

  return (
    <section id="services-section" className="py-12 overflow-hidden">
      {/* Section Header */}
      <div className="px-6 mb-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-amber-500 text-sm font-medium tracking-wider uppercase block"
        >
          {t('sectionLabel')}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-black text-white mt-2 mx-auto"
        >
          {t('sectionTitle')}
        </motion.h2>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden px-6 pb-4 hide-scrollbar snap-x snap-mandatory"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
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
              locale={locale}
              t={t}
            />
          </div>
        ))}
        
        {/* Spacer al final */}
        <div className="flex-shrink-0 w-6" />
      </div>

      {/* Pagination Dots - Touch targets min 44x44px per a11y */}
      <div className="flex justify-center gap-0 mt-4">
        {SERVICES.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              const container = scrollRef.current;
              if (container) {
                const cardWidth = container.offsetWidth * 0.75 + 16;
                container.scrollTo({
                  left: index * cardWidth,
                  behavior: 'smooth',
                });
              }
              setActiveIndex(index);
            }}
            className="p-3 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            aria-label={`Ir a servicio ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                index === activeIndex
                  ? 'w-8 bg-amber-500'
                  : 'w-2 bg-white/20'
              }`}
            />
          </motion.button>
        ))}
      </div>

      {/* Swipe hint */}
      <motion.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 1 }}
        className="text-center text-white/50 text-xs mt-4"
      >
        {t('swipeHint')}
      </motion.p>
    </section>
  );
}
