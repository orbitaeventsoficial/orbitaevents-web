'use client';

/**
 * MOBILE SERVICES CARDS - Òrbita Events
 * Carrusel horitzontal snap-scroll de serveis
 * UX nativa d'app: swipe entre cards, dots de progrés, tap per navegar
 */

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useMobile } from './MobileAppShell';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';

// ── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  emoji: string;
  image: string;
  gradient: string;
  badgeKey: string;
  badgeColor: string;
  href: string;
  features: string[];
}

// ── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  isActive,
  locale,
  t,
}: {
  service: Service;
  isActive: boolean;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const title = t(`services.${service.id}.title`);
  const subtitle = t(`services.${service.id}.subtitle`);
  const price = t(`services.${service.id}.price`);
  const badge = service.badgeKey ? t(`services.${service.id}.badge`, { year: currentYear }) : '';

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(service.href)}
      className="relative w-full h-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/15 shadow-lg cursor-pointer"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={service.image}
          alt={title}
          fill
          className="object-cover"
          sizes="85vw"
          quality={70}
          draggable={false}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-20`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      </div>

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 left-4 z-10">
          <div className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${service.badgeColor} text-white text-xs font-black shadow-lg`}>
            {badge}
          </div>
        </div>
      )}

      {/* Active glow ring */}
      {isActive && !reduceMotion && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: 'inset 0 0 0 2px rgba(251,191,36,0.3)',
          }}
        />
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <span className="text-4xl block mb-2">{service.emoji}</span>

        <h3 className="text-2xl font-black text-white mb-1">{title}</h3>
        <p className="text-white/60 text-sm mb-3">{subtitle}</p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {service.features.map((_, i) => (
            <span
              key={`${service.id}-f-${i}`}
              className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 text-xs"
            >
              {t(`services.${service.id}.features.${i}`)}
            </span>
          ))}
        </div>

        {/* Price + arrow */}
        <div className="flex items-center justify-between">
          <span className="text-amber-400 font-bold text-lg">{price}</span>
          <span className="flex items-center gap-1 text-white/50 text-sm">
            {t('viewMore')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Carousel ────────────────────────────────────────────────────────────

export default function MobileServicesCards() {
  const { locale, haptic } = useMobile();
  const t = useTranslations('mobileServices');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const SERVICES: Service[] = useMemo(() => [
    {
      id: 'bodas',
      emoji: '💒',
      image: '/img/portfolio/bodas/bodas-01.avif',
      gradient: 'from-pink-500/14 via-rose-500/6 to-transparent',
      badgeKey: '',
      badgeColor: '',
      href: '/servicios/bodas',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'halloween',
      emoji: '🎃',
      image: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
      gradient: 'from-orange-500/14 via-red-500/6 to-transparent',
      badgeKey: 'halloween.badge',
      badgeColor: 'from-orange-500 to-red-500',
      href: '/tematica-halloween',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'monmagic',
      emoji: '🪄',
      image: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-hero.avif',
      gradient: 'from-amber-500/14 via-purple-500/6 to-transparent',
      badgeKey: 'monmagic.badge',
      badgeColor: 'from-amber-500 to-yellow-500',
      href: '/tematica-mon-magic',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'fiestas',
      emoji: '🎉',
      image: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
      gradient: 'from-purple-500/14 via-violet-500/6 to-transparent',
      badgeKey: '',
      badgeColor: '',
      href: '/servicios/fiestas',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'empresas',
      emoji: '🏢',
      image: '/img/portfolio/eventos-empresa/eventos-empresa-02.avif',
      gradient: 'from-blue-500/14 via-cyan-500/6 to-transparent',
      badgeKey: '',
      badgeColor: '',
      href: '/servicios/empresas',
      features: ['feature1', 'feature2', 'feature3'],
    },
  ], []);

  // Track active card via scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollLeft = el.scrollLeft;
        const cardWidth = el.firstElementChild
          ? (el.firstElementChild as HTMLElement).offsetWidth
          : 1;
        const gap = 16; // gap-4
        const idx = Math.round(scrollLeft / (cardWidth + gap));
        setActiveIndex(Math.min(idx, SERVICES.length - 1));
        ticking = false;
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [SERVICES.length]);

  const scrollToCard = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      const scrollLeft = card.offsetLeft - (el.offsetWidth - card.offsetWidth) / 2;
      el.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      haptic('light');
    }
  }, [haptic]);

  return (
    <section id="services-section" className="py-10 overflow-hidden relative">
      {/* Header */}
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
          className="text-3xl font-black text-white mt-2"
        >
          {t('sectionTitle')}
        </motion.h2>
      </div>

      {/* Horizontal snap carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        {SERVICES.map((service, index) => (
          <div
            key={service.id}
            className="snap-center flex-shrink-0 w-[82vw] max-w-[380px] h-[400px]"
          >
            <ServiceCard
              service={service}
              isActive={activeIndex === index}
              locale={locale}
              t={t}
            />
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-5">
        {SERVICES.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToCard(index)}
            className={`h-[3px] rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'w-7 bg-amber-400'
                : 'w-2 bg-white/20'
            }`}
            aria-label={`Servei ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
