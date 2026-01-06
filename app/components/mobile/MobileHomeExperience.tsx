'use client';

/**
 * MobileHomeExperience.tsx
 *
 * Home inmersivo tipo Instagram Stories para móvil
 * - Secciones fullscreen con swipe horizontal
 * - Video de fondo autoplay
 * - Parallax y animaciones brutales
 * - Gestos táctiles avanzados
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Story {
  id: string;
  title: string;
  subtitle: string;
  bgType: 'video' | 'image' | 'gradient';
  bgSrc?: string;
  gradient?: string;
  cta?: {
    text: string;
    href: string;
  };
  badge?: string;
  icon?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE STORIES
// ═══════════════════════════════════════════════════════════════════════════

const stories: Story[] = [
  {
    id: 'hero',
    title: 'Creem experiències',
    subtitle: 'que no oblidaràs mai',
    bgType: 'gradient',
    gradient: 'from-zinc-950 via-amber-950/20 to-zinc-950',
    badge: '★ 5.0/5 · +200 events',
    cta: { text: 'Descobrir', href: '#servicios' },
  },
  {
    id: 'bodas',
    title: 'Casaments',
    subtitle: 'DJ + So + Llums des de 550€',
    bgType: 'image',
    bgSrc: '/img/portfolio/bodas/bodas-01.webp',
    icon: '💒',
    cta: { text: 'Veure més', href: '/servicios/bodas' },
  },
  {
    id: 'fiestas',
    title: 'Festes Privades',
    subtitle: 'Aniversaris, comunions, graduacions',
    bgType: 'image',
    bgSrc: '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    icon: '🎉',
    cta: { text: 'Veure més', href: '/servicios/fiestas' },
  },
  {
    id: 'tematicas',
    title: 'Festes Temàtiques',
    subtitle: 'Halloween, Harry Potter, anys 80...',
    bgType: 'image',
    bgSrc: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.jpg',
    icon: '🎭',
    cta: { text: 'Explorar', href: '/tematica-halloween' },
  },
  {
    id: 'empresas',
    title: 'Events Corporatius',
    subtitle: 'Team building, presentacions, galas',
    bgType: 'image',
    bgSrc: '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
    icon: '🏢',
    cta: { text: 'Sol·licitar', href: '/servicios/empresas' },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PROGRESS BAR (tipo Stories)
// ═══════════════════════════════════════════════════════════════════════════

function StoryProgressBar({
  total,
  current,
  isPaused,
  onComplete,
}: {
  total: number;
  current: number;
  isPaused: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setProgress(0);
  }, [current]);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          onComplete();
          return 0;
        }
        return p + 0.5; // ~5 segundos por story
      });
    }, 25);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, onComplete, current]);

  return (
    <div className="flex gap-1.5 px-4 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={false}
            animate={{
              width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE STORY CARD
// ═══════════════════════════════════════════════════════════════════════════

function StoryCard({
  story,
  isActive,
  direction,
}: {
  story: Story;
  isActive: boolean;
  direction: number;
}) {
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      zIndex: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      zIndex: 0,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Background */}
      {story.bgType === 'image' && story.bgSrc && (
        <div className="absolute inset-0">
          <Image
            src={story.bgSrc}
            alt={story.title}
            fill
            className="object-cover"
            priority={isActive}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>
      )}

      {story.bgType === 'gradient' && (
        <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient}`}>
          {/* Animated orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-end p-6 pb-32">
        {/* Badge */}
        {story.badge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs text-white/80 w-fit"
          >
            {story.badge}
          </motion.div>
        )}

        {/* Icon */}
        {story.icon && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="text-5xl mb-4"
          >
            {story.icon}
          </motion.span>
        )}

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-4xl font-bold text-white mb-2 leading-tight"
        >
          {story.title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-lg text-white/70 mb-6"
        >
          {story.subtitle}
        </motion.p>

        {/* CTA */}
        {story.cta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Link
              href={story.cta.href}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-all active:scale-95"
            >
              {story.cta.text}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileHomeExperience() {
  const [[currentIndex, direction], setPage] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values para drag
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  // Cambiar story
  const paginate = useCallback((newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < stories.length) {
      setPage([newIndex, newDirection]);
    } else if (newIndex >= stories.length) {
      // Al final, volver al inicio o navegar
      setPage([0, 1]);
    }
  }, [currentIndex]);

  // Auto-advance cuando progress completa
  const handleProgressComplete = useCallback(() => {
    paginate(1);
  }, [paginate]);

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Handle drag
  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold) {
        triggerHaptic();
        paginate(1);
      } else if (info.offset.x > threshold) {
        triggerHaptic();
        paginate(-1);
      }
    },
    [paginate, triggerHaptic]
  );

  // Handle tap areas (izquierda/derecha de la pantalla)
  const handleTap = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const third = rect.width / 3;

      if (x < third) {
        // Tap izquierda - anterior
        triggerHaptic();
        paginate(-1);
      } else if (x > third * 2) {
        // Tap derecha - siguiente
        triggerHaptic();
        paginate(1);
      }
      // Tap centro - no hace nada (para ver contenido)
    },
    [paginate, triggerHaptic]
  );

  // Pausar en hold
  const handleTouchStart = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-zinc-950 overflow-hidden select-none lg:hidden"
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top">
        <StoryProgressBar
          total={stories.length}
          current={currentIndex}
          isPaused={isPaused}
          onComplete={handleProgressComplete}
        />
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 right-0 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-xs font-bold text-black">Ò</span>
          </div>
          <span className="text-white font-semibold text-sm">Òrbita Events</span>
        </div>
        <Link
          href="/contacto"
          className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs text-white font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          Contactar
        </Link>
      </div>

      {/* Stories */}
      <motion.div
        className="absolute inset-0"
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <StoryCard
            key={currentIndex}
            story={stories[currentIndex]}
            isActive={true}
            direction={direction}
          />
        </AnimatePresence>
      </motion.div>

      {/* Navigation dots */}
      <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center gap-2">
        {stories.map((_, i) => (
          <motion.button
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-amber-500 w-6' : 'bg-white/30'
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              setPage([i, i > currentIndex ? 1 : -1]);
            }}
          />
        ))}
      </div>

      {/* Swipe hint (solo primera vez) */}
      <motion.div
        className="absolute bottom-36 left-0 right-0 z-20 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="flex items-center gap-2 text-white/40 text-xs"
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: 3 }}
        >
          <span>Swipe</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Pause indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
