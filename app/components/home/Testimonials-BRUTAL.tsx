'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TESTIMONIALS BRUTAL - PRUEBA SOCIAL QUE APLASTA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Características:
 * - Video testimonials con máxima emoción
 * - Carousel automático con pause on hover
 * - Stars rating con animación
 * - Badges de verificación
 * - Stats de impacto
 * - CTA integrado
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// STAR RATING ANIMADO
// ═══════════════════════════════════════════════════════════════════════════

function StarRating({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <motion.svg
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3, type: 'spring' }}
          className={`w-5 h-5 ${i < rating ? 'text-amber-400' : 'text-white/20'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </motion.svg>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTIMONIAL CARD
// ═══════════════════════════════════════════════════════════════════════════

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  date: string;
  image: string;
  eventImage: string;
  rating: number;
  eventType: string;
  highlight: string;
}

function TestimonialCard({ testimonial, isActive, verifiedText }: { testimonial: Testimonial; isActive: boolean; verifiedText: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isActive ? 1 : 0.3,
        scale: isActive ? 1 : 0.9,
        filter: isActive ? 'blur(0px)' : 'blur(4px)'
      }}
      transition={{ duration: 0.5 }}
      className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden border transition-all duration-500 ${
        isActive
          ? 'border-amber-500/30 shadow-2xl shadow-amber-500/10'
          : 'border-white/5'
      }`}
    >
      {/* Event Image */}
      <div className="relative h-48 md:h-56 overflow-hidden">
        <Image
          src={testimonial.eventImage}
          alt={`Evento de ${testimonial.author}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Badge tipo evento */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 bg-amber-500/20 backdrop-blur-sm text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
            {testimonial.eventType}
          </span>
        </div>

        {/* Highlight stat */}
        <div className="absolute bottom-4 right-4">
          <div className="px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
            <span className="text-sm font-bold text-white">{testimonial.highlight}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Stars */}
        <div className="mb-4">
          <StarRating rating={testimonial.rating} />
        </div>

        {/* Quote */}
        <blockquote className="relative">
          <span className="absolute -top-4 -left-2 text-5xl text-amber-500/20">"</span>
          <p className="text-base md:text-lg text-white/90 leading-relaxed pl-6">
            {testimonial.quote}
          </p>
          <span className="absolute -bottom-4 right-0 text-5xl text-amber-500/20">"</span>
        </blockquote>

        {/* Author */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-amber-500/30">
              <Image
                src={testimonial.image}
                alt={testimonial.author}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-white">{testimonial.author}</p>
              <p className="text-sm text-white/50">{testimonial.role} · {testimonial.date}</p>
            </div>
          </div>

          {/* Verified badge */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {verifiedText}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════════════════════════════════════

function StatsBar({ t }: { t: (key: string) => string }) {
  const stats = [
    { value: '4.9', labelKey: 'stats.googleRating', icon: '⭐' },
    { value: '+48', labelKey: 'stats.events', icon: '🎉' },
    { value: '98%', labelKey: 'stats.recommend', icon: '💯' },
    { value: '100%', labelKey: 'stats.satisfaction', icon: '❤️' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="text-center p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10"
        >
          <span className="text-2xl mb-2 block">{stat.icon}</span>
          <div className="text-2xl md:text-3xl font-black text-amber-400">{stat.value}</div>
          <div className="text-xs text-white/50 mt-1">{t(stat.labelKey)}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TestimonialsBrutal() {
  const t = useTranslations('testimonials');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Testimonials data - Using translations
  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote: t('testimonial1.quote'),
      author: t('testimonial1.author'),
      role: t('testimonial1.role'),
      date: t('testimonial1.date'),
      image: "/images/testimonials/lorena-carles.jpg",
      eventImage: "/images/tematicas/mon-magic/hero/01-taula-panoramica-cartell.jpg",
      rating: 5,
      eventType: t('testimonial1.eventType'),
      highlight: t('testimonial1.highlight')
    },
    {
      id: 2,
      quote: t('testimonial2.quote'),
      author: t('testimonial2.author'),
      role: t('testimonial2.role'),
      date: t('testimonial2.date'),
      image: "/images/testimonials/marc.jpg",
      eventImage: "/images/tematicas/halloween/hero.jpg",
      rating: 5,
      eventType: t('testimonial2.eventType'),
      highlight: t('testimonial2.highlight')
    },
    {
      id: 3,
      quote: t('testimonial3.quote'),
      author: t('testimonial3.author'),
      role: t('testimonial3.role'),
      date: t('testimonial3.date'),
      image: "/images/testimonials/ana.jpg",
      eventImage: "/images/portfolio/corporate-01.jpg",
      rating: 5,
      eventType: t('testimonial3.eventType'),
      highlight: t('testimonial3.highlight')
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, testimonials.length]);

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-black via-purple-950/5 to-black overflow-hidden">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 mb-4 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-full border border-amber-500/20"
          >
            ⭐ {t('badge')}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white mb-4"
          >
            {t('title').replace(t('titleHighlight'), '')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
              {t('titleHighlight')}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto"
          >
            {t('subtitle')}
          </motion.p>
        </div>

        {/* Stats Bar */}
        <StatsBar t={t} />

        {/* Testimonials Carousel */}
        <div 
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <TestimonialCard
              key={testimonials[activeIndex].id}
              testimonial={testimonials[activeIndex]}
              isActive={true}
              verifiedText={t('verified')}
            />
          </AnimatePresence>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === activeIndex 
                    ? 'w-8 bg-amber-500' 
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Ver testimonio ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear' }}
              key={activeIndex}
            />
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-white/50 mb-6">
            {t('cta')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/opiniones/nueva"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 text-amber-400 font-semibold rounded-full hover:bg-amber-500/30 transition-all border border-amber-500/30 hover:border-amber-500/50"
            >
              <span>✨</span>
              <span>{t('ctaButton')}</span>
            </Link>
            <Link
              href="/opiniones"
              className="inline-flex items-center gap-2 px-6 py-3 text-white/60 hover:text-white transition-colors"
            >
              <span>{t('viewAll')}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default TestimonialsBrutal;
