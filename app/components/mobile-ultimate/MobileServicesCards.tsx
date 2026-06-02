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
import { PUBLIC_HOME_MOBILE_CARDS } from '@/lib/publicHomeShowcase';
import type { PublicMobileServiceCardId } from '@/lib/constants/public-service-media';

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
      className="relative w-full h-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer"
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
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
        <span className="text-4xl block mb-2">{service.emoji}</span>

        <h3 className="mb-1 text-[1.7rem] font-black text-white leading-tight">{title}</h3>
        <p className="mb-3 text-sm leading-5 text-white/66">{subtitle}</p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {service.features.map((_, i) => (
            <span
              key={`${service.id}-f-${i}`}
              className="px-2.5 py-1 bg-white/[0.12] backdrop-blur-sm border border-white/[0.08] rounded-lg text-white/85 text-xs font-medium"
            >
              {t(`services.${service.id}.features.${i}`)}
            </span>
          ))}
        </div>

        {/* Price + arrow */}
        <div className="flex items-center justify-between">
          <span className="text-amber-300 font-black text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{price}</span>
          <span className="flex items-center gap-1.5 text-white/60 text-sm font-medium">
            {t('viewMore')}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Carousel ────────────────────────────────────────────────────────────

const FALLBACK_SERVICE_IMAGES: Record<PublicMobileServiceCardId, string> = {
  bodas: '/img/portfolio/bodas/bodas-01.avif',
  halloween: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
  monmagic: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-hero.avif',
  fiestas: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
  empresas: '/img/portfolio/eventos-empresa/eventos-empresa-02.avif',
};

export default function MobileServicesCards({
  serviceCardImages,
}: {
  serviceCardImages?: Record<PublicMobileServiceCardId, string>;
}) {
  const { locale, haptic } = useMobile();
  const t = useTranslations('mobileServices');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const resolvedImages = useMemo(
    () => ({ ...FALLBACK_SERVICE_IMAGES, ...serviceCardImages }),
    [serviceCardImages]
  );

  const SERVICES: Service[] = useMemo(() => (
    PUBLIC_HOME_MOBILE_CARDS.map((service) => ({
      ...service,
      image: resolvedImages[service.id],
      features: [...service.features],
    }))
  ), [resolvedImages]);  // Track active card via scroll position
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
        const gap = 12; // gap-3
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
    <section id="services-section" className="relative overflow-hidden py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-6 px-6 text-center"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
          {t('sectionLabel')}
        </span>
        <h2 className="text-3xl font-black text-white">
          {t('sectionTitle')}
        </h2>
      </motion.div>

      {/* Horizontal snap carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-6 pb-2"
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
            className="snap-center h-[360px] w-[84vw] max-w-[360px] flex-shrink-0"
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

