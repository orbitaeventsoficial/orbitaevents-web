'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE TESTIMONIALS REELS - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Testimonios en formato Stories/Reels con:
 * - Autoplay con timer
 * - Swipe entre testimonios
 * - Tap para pausar/avanzar
 * - Fotos/avatares reales
 * - Rating stars animadas
 * - Verificación badges
 * 
 * FIXED:
 * - Textos usando sistema de traducciones
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useMobile } from './MobileAppShell';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Testimonial {
  id: number;
  nameKey: string;
  eventKey: string;
  dateKey: string;
  avatar: string;
  rating: number;
  quoteKey: string;
  verified: string;
  bgColor: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════════

function ProgressBar({
  total,
  current,
  isPaused,
  onComplete
}: {
  total: number;
  current: number;
  isPaused: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const onCompleteRef = useRef(onComplete);
  const DURATION = 5000; // 5 segundos por testimonio
  const INTERVAL = 50;

  // Actualizar ref cuando cambia onComplete
  onCompleteRef.current = onComplete;

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
        const increment = (100 / DURATION) * INTERVAL;
        if (p >= 100) {
          onCompleteRef.current();
          return 0;
        }
        return p + increment;
      });
    }, INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, current]);

  return (
    <div className="flex gap-1.5 px-4 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={`progress-bar-${i}`}
          className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-amber-400 rounded-full"
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
// TESTIMONIAL CARD
// ═══════════════════════════════════════════════════════════════════════════

function TestimonialCard({
  testimonial,
  direction,
  t,
}: {
  testimonial: Testimonial;
  direction: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  const name = t(`testimonials.${testimonial.id}.name`);
  const event = t(`testimonials.${testimonial.id}.event`);
  const date = t(`testimonials.${testimonial.id}.date`);
  const quote = t(`testimonials.${testimonial.id}.quote`);

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
      className="absolute inset-0"
    >
      {/* Enhanced background with multiple layers */}
      <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.bgColor}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-zinc-950/40" />

      {/* Animated shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center items-center text-center px-8 py-12">
        {/* Avatar - Enhanced */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 0.1 }}
          className="relative mb-6"
        >
          {/* Pulsating glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 blur-xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-1 shadow-2xl">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center overflow-hidden">
              {/* Placeholder avatar with gradient text */}
              <span className="text-4xl font-black bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">
                {name.charAt(0)}
              </span>
            </div>
          </div>

          {/* Verified badge - Enhanced */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', damping: 10 }}
            className="absolute -bottom-1 -right-1"
          >
            <div className="relative px-2.5 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-[10px] font-black text-white flex items-center gap-1 shadow-xl">
              {/* Glow */}
              <motion.div
                className="absolute inset-0 rounded-full bg-green-500 blur-md opacity-60"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <svg className="w-3 h-3 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="relative z-10">{testimonial.verified}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Stars */}
        <motion.div 
          className="flex gap-1 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.svg
              key={`rating-star-${i}`}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
              className="w-6 h-6 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </motion.svg>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-medium text-white leading-relaxed mb-6 max-w-sm"
        >
          &ldquo;{quote}&rdquo;
        </motion.blockquote>

        {/* Author info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white font-bold text-lg">{name}</p>
          <p className="text-white/60 text-sm">{event}</p>
          <p className="text-white/60 text-xs mt-1">{date}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileTestimonialsReels() {
  const [[currentIndex, direction], setPage] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { haptic } = useMobile();
  const t = useTranslations('mobileTestimonials');

  // Testimonials data
  const TESTIMONIALS: Testimonial[] = useMemo(() => [
    {
      id: 1,
      nameKey: '1.name',
      eventKey: '1.event',
      dateKey: '1.date',
      avatar: '/img/testimonials/avatar-01.webp',
      rating: 5,
      quoteKey: '1.quote',
      verified: 'Verificado',
      bgColor: 'from-amber-500/20 to-orange-500/10',
    },
    {
      id: 2,
      nameKey: '2.name',
      eventKey: '2.event',
      dateKey: '2.date',
      avatar: '/img/testimonials/avatar-02.webp',
      rating: 5,
      quoteKey: '2.quote',
      verified: 'Google',
      bgColor: 'from-orange-500/20 to-red-500/10',
    },
    {
      id: 3,
      nameKey: '3.name',
      eventKey: '3.event',
      dateKey: '3.date',
      avatar: '/img/testimonials/avatar-03.webp',
      rating: 5,
      quoteKey: '3.quote',
      verified: 'Verificado',
      bgColor: 'from-purple-500/20 to-amber-500/10',
    },
    {
      id: 4,
      nameKey: '4.name',
      eventKey: '4.event',
      dateKey: '4.date',
      avatar: '/img/testimonials/avatar-04.webp',
      rating: 5,
      quoteKey: '4.quote',
      verified: 'Google',
      bgColor: 'from-blue-500/20 to-cyan-500/10',
    },
  ], []);

  const paginate = useCallback((newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < TESTIMONIALS.length) {
      setPage([newIndex, newDirection]);
    } else if (newIndex >= TESTIMONIALS.length) {
      setPage([0, 1]);
    } else if (newIndex < 0) {
      setPage([TESTIMONIALS.length - 1, -1]);
    }
  }, [currentIndex, TESTIMONIALS.length]);

  const handleProgressComplete = useCallback(() => {
    paginate(1);
  }, [paginate]);

  // Tap areas
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const x = clientX - rect.left;
    const third = rect.width / 3;

    haptic('light');

    if (x < third) {
      paginate(-1);
    } else if (x > third * 2) {
      paginate(1);
    }
  };

  // Drag handling
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) {
      haptic('light');
      paginate(1);
    } else if (info.offset.x > 50) {
      haptic('light');
      paginate(-1);
    }
  };

  return (
    <section className="py-12">
      {/* Header */}
      <div className="px-6 mb-6">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-amber-500 text-sm font-medium tracking-wider uppercase"
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

      {/* Reels Container */}
      <div
        ref={containerRef}
        className="relative mx-4 h-[400px] rounded-3xl overflow-hidden bg-zinc-900 border border-white/10"
        onClick={handleTap}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <ProgressBar
            total={TESTIMONIALS.length}
            current={currentIndex}
            isPaused={isPaused}
            onComplete={handleProgressComplete}
          />
        </div>

        {/* Testimonials */}
        <motion.div
          className="relative w-full h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <TestimonialCard
              key={currentIndex}
              testimonial={TESTIMONIALS[currentIndex]}
              direction={direction}
              t={t}
            />
          </AnimatePresence>
        </motion.div>

        {/* Pause indicator */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
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

        {/* Navigation dots */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {TESTIMONIALS.map((testimonial, i) => (
            <button
              key={`testimonial-dot-${testimonial.id}`}
              onClick={(e) => {
                e.stopPropagation();
                haptic('light');
                setPage([i, i > currentIndex ? 1 : -1]);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? 'bg-amber-500 w-6' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex justify-center gap-8 mt-8 px-6"
      >
        <div className="text-center">
          <p className="text-3xl font-black text-amber-400">{t('stats.rating')}</p>
          <p className="text-white/50 text-xs">{t('stats.ratingLabel')}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-amber-400">{t('stats.events')}</p>
          <p className="text-white/50 text-xs">{t('stats.eventsLabel')}</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-amber-400">{t('stats.recommended')}</p>
          <p className="text-white/50 text-xs">{t('stats.recommendedLabel')}</p>
        </div>
      </motion.div>
    </section>
  );
}
