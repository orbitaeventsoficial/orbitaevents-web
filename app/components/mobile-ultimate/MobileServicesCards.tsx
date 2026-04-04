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
import type { PublicMobileServiceCardId } from '@/lib/constants/public-service-media';

// ── Interactive marquee hook ────────────────────────────────────────────────

const MARQUEE_AUTO_SPEED = 0.35;
const MARQUEE_MAX_SPEED = 4;

function useMarquee(itemCount: number) {
  const stripRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const speedRef = useRef(MARQUEE_AUTO_SPEED);
  const inputRef = useRef<'none' | 'touch' | 'mouse'>('none');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || itemCount === 0) return;
    const strip = stripRef.current;
    if (!strip) return;

    let animId: number;

    const getHalfWidth = () => {
      const children = strip.children;
      const half = Math.floor(children.length / 2);
      let w = 0;
      for (let i = 0; i < half; i++) {
        w += (children[i] as HTMLElement).offsetWidth + 12;
      }
      return w;
    };

    const animate = () => {
      const halfW = getHalfWidth();
      if (halfW > 0) {
        offsetRef.current -= speedRef.current;
        if (offsetRef.current < -halfW) offsetRef.current += halfW;
        if (offsetRef.current > 0) offsetRef.current -= halfW;
        strip.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }
      animId = requestAnimationFrame(animate);
    };

    const handlePointer = (clientX: number) => {
      const rect = strip.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const normalized = (clientX - centerX) / (rect.width / 2);
      speedRef.current = normalized * MARQUEE_MAX_SPEED;
    };

    const handleMouseMove = (e: MouseEvent) => {
      inputRef.current = 'mouse';
      handlePointer(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      inputRef.current = 'touch';
      if (e.touches[0]) handlePointer(e.touches[0].clientX);
    };
    const handleLeave = () => {
      inputRef.current = 'none';
      speedRef.current = MARQUEE_AUTO_SPEED;
    };

    // Gyroscope — only active when no direct touch/mouse input
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (inputRef.current !== 'none') return;
      const gamma = e.gamma ?? 0;
      const clamped = Math.max(-30, Math.min(30, gamma));
      speedRef.current = (clamped / 30) * MARQUEE_MAX_SPEED;
    };

    const parent = strip.parentElement;
    parent?.addEventListener('mousemove', handleMouseMove);
    parent?.addEventListener('touchmove', handleTouchMove, { passive: true });
    parent?.addEventListener('mouseleave', handleLeave);
    parent?.addEventListener('touchend', handleLeave);
    window.addEventListener('deviceorientation', handleOrientation);

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      parent?.removeEventListener('mousemove', handleMouseMove);
      parent?.removeEventListener('touchmove', handleTouchMove);
      parent?.removeEventListener('mouseleave', handleLeave);
      parent?.removeEventListener('touchend', handleLeave);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [itemCount, reduceMotion]);

  return stripRef;
}

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
  monmagic: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif',
  fiestas: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
  empresas: '/img/portfolio/eventos-empresa/eventos-empresa-02.avif',
};

export default function MobileServicesCards({
  serviceCardImages,
}: {
  serviceCardImages?: Record<PublicMobileServiceCardId, string>;
}) {
  const { locale } = useMobile();
  const t = useTranslations('mobileServices');

  const resolvedImages = useMemo(
    () => ({ ...FALLBACK_SERVICE_IMAGES, ...serviceCardImages }),
    [serviceCardImages]
  );

  const SERVICES: Service[] = useMemo(() => [
    {
      id: 'bodas',
      emoji: '💒',
      image: resolvedImages.bodas,
      gradient: 'from-pink-500/14 via-rose-500/6 to-transparent',
      badgeKey: '',
      badgeColor: '',
      href: '/servicios/bodas',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'halloween',
      emoji: '🎃',
      image: resolvedImages.halloween,
      gradient: 'from-orange-500/14 via-red-500/6 to-transparent',
      badgeKey: 'halloween.badge',
      badgeColor: 'from-orange-500 to-red-500',
      href: '/tematica-halloween',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'monmagic',
      emoji: '🪄',
      image: resolvedImages.monmagic,
      gradient: 'from-amber-500/14 via-purple-500/6 to-transparent',
      badgeKey: 'monmagic.badge',
      badgeColor: 'from-amber-500 to-yellow-500',
      href: '/tematica-mon-magic',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'fiestas',
      emoji: '🎉',
      image: resolvedImages.fiestas,
      gradient: 'from-purple-500/14 via-violet-500/6 to-transparent',
      badgeKey: '',
      badgeColor: '',
      href: '/servicios/fiestas',
      features: ['feature1', 'feature2', 'feature3'],
    },
    {
      id: 'empresas',
      emoji: '🏢',
      image: resolvedImages.empresas,
      gradient: 'from-blue-500/14 via-cyan-500/6 to-transparent',
      badgeKey: '',
      badgeColor: '',
      href: '/servicios/empresas',
      features: ['feature1', 'feature2', 'feature3'],
    },
  ], [resolvedImages]);

  // Duplicate for seamless loop
  const loopServices = useMemo(() => [...SERVICES, ...SERVICES], [SERVICES]);
  const stripRef = useMarquee(SERVICES.length);

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

      {/* Interactive marquee carousel */}
      <div className="relative overflow-hidden">
        <div
          ref={stripRef}
          className="flex gap-3 will-change-transform"
        >
          {loopServices.map((service, index) => (
            <div
              key={`${service.id}-${index}`}
              className="h-[360px] w-[84vw] max-w-[360px] flex-shrink-0"
            >
              <ServiceCard
                service={service}
                isActive={false}
                locale={locale}
                t={t}
              />
            </div>
          ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#030303] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#030303] to-transparent z-10" />
      </div>
    </section>
  );
}






