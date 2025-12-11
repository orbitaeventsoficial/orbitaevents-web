'use client';

// ═══════════════════════════════════════════════════════════════════════════
// TESTIMONIALS BRUTAL REAL - OPINIONS 100% REALS DE BD
// ═══════════════════════════════════════════════════════════════════════════
// 
// Connectat a /api/public/testimonials
// - Només mostra opinions aprovades (isApproved: true)
// - Respecta privacitat (showName, showPhoto)
// - Mostra stats reals (total, mitjana, 5 estrelles)
// - Promou sistema de gamificació (fins 25% descompte)
//
// Versió: 3.0 DEFINITIVA - Desembre 2025
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTestimonials, usePublicStats } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TestimonialPublic {
  id: string;
  text: string;
  rating: number;
  eventType: string | null;
  eventDate: string | null;
  authorName: string;
  authorPhoto: string | null;
  showPhoto: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  
  return (
    <div className={`flex gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? 'text-amber-400' : 'text-white/20'}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: TestimonialPublic }) {
  const t = useTranslations('testimonials');
  
  // Format date
  const formattedDate = testimonial.eventDate 
    ? new Date(testimonial.eventDate).toLocaleDateString('ca-ES', { 
        month: 'long', 
        year: 'numeric' 
      })
    : null;

  // Event type emoji
  const eventEmojis: Record<string, string> = {
    'WEDDING': '💍',
    'BODA': '💍',
    'CORPORATE': '💼',
    'EMPRESA': '💼',
    'PARTY': '🎉',
    'FESTA': '🎉',
    'BIRTHDAY': '🎂',
    'ANIVERSARI': '🎂',
  };
  
  const eventEmoji = testimonial.eventType 
    ? eventEmojis[testimonial.eventType.toUpperCase()] || '🎊'
    : '🎊';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-500">
          {testimonial.showPhoto && testimonial.authorPhoto ? (
            <Image
              src={testimonial.authorPhoto}
              alt={testimonial.authorName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {eventEmoji}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate">
            {testimonial.authorName}
          </h4>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>{eventEmoji}</span>
            {testimonial.eventType && (
              <span>{t(`eventTypes.${testimonial.eventType.toLowerCase()}`) || testimonial.eventType}</span>
            )}
            {formattedDate && (
              <>
                <span>•</span>
                <span>{formattedDate}</span>
              </>
            )}
          </div>
          <StarRating rating={testimonial.rating} size="sm" />
        </div>
        
        {/* Verified badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {t('verified') || 'Verificat'}
          </span>
        </div>
      </div>
      
      {/* Quote */}
      <blockquote className="text-white/80 leading-relaxed">
        <span className="text-amber-400 text-2xl font-serif">"</span>
        {testimonial.text}
        <span className="text-amber-400 text-2xl font-serif">"</span>
      </blockquote>
    </motion.div>
  );
}

function StatsBar() {
  const t = useTranslations('testimonials');
  const { stats, isLoading } = usePublicStats();
  const { data: testimonialsData } = useTestimonials(100);

  const statsItems = [
    {
      value: stats.googleRating ? `${stats.googleRating}` : '--',
      label: t('stats.googleRating') || 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      value: isLoading ? '--' : `${stats.totalEvents}+`,
      label: t('stats.events') || 'Events',
      icon: <span className="text-xl">🎉</span>,
    },
    {
      value: isLoading ? '--' : stats.averageRating.toFixed(1),
      label: t('stats.rating') || 'Valoració',
      icon: <span className="text-amber-400 text-xl">★</span>,
    },
    {
      value: testimonialsData.stats.total || '--',
      label: t('stats.reviews') || 'Opinions',
      icon: <span className="text-xl">💬</span>,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {statsItems.map((stat, index) => (
        <div
          key={index}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center"
        >
          <div className="flex justify-center mb-2">{stat.icon}</div>
          <div className="text-2xl font-black text-white">{stat.value}</div>
          <div className="text-xs text-white/60 uppercase tracking-wider">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const t = useTranslations('testimonials');
  
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🎤</div>
      <h3 className="text-2xl font-bold text-white mb-2">
        {t('emptyState.title') || 'Sigues el primer!'}
      </h3>
      <p className="text-white/60 mb-6 max-w-md mx-auto">
        {t('emptyState.description') || "Encara no tenim opinions publicades. Contracta'ns i deixa la primera!"}
      </p>
      <Link
        href="/contacto"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
      >
        {t('emptyState.cta') || 'Sol·licita pressupost'}
        <span>→</span>
      </Link>
    </div>
  );
}

function GamificationBanner() {
  const t = useTranslations('testimonials');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 bg-gradient-to-r from-purple-900/40 to-amber-900/40 border border-purple-500/30 rounded-2xl p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl">
            🎁
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-black text-white mb-2">
            {t('gamification.title') || 'Deixa la teva opinió i guanya fins a 25% de descompte!'}
          </h3>
          <p className="text-white/70 mb-4">
            {t('gamification.description') || "Valora'ns i acumula descomptes pel teu proper event. Més detalls = més beneficis!"}
          </p>
          
          {/* Rewards breakdown */}
          <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm">
            <span className="bg-white/10 px-3 py-1 rounded-full text-white/80">
              📝 Opinió: <span className="text-amber-400 font-bold">5%</span>
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full text-white/80">
              📸 + Foto: <span className="text-amber-400 font-bold">+5%</span>
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full text-white/80">
              🎥 + Vídeo: <span className="text-amber-400 font-bold">+10%</span>
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full text-white/80">
              ⭐ + Google: <span className="text-amber-400 font-bold">+5%</span>
            </span>
          </div>
        </div>
        
        {/* CTA */}
        <div className="flex-shrink-0">
          <Link
            href="/opiniones"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all whitespace-nowrap"
          >
            {t('gamification.cta') || "Deixa opinió"}
            <span>→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TestimonialsBrutalReal() {
  const t = useTranslations('testimonials');
  const { data, isLoading, error } = useTestimonials(10);
  const [currentPage, setCurrentPage] = useState(0);
  const testimonialsPerPage = 3;
  
  const totalPages = Math.ceil(data.testimonials.length / testimonialsPerPage);
  const currentTestimonials = data.testimonials.slice(
    currentPage * testimonialsPerPage,
    (currentPage + 1) * testimonialsPerPage
  );

  // Auto-rotate
  useEffect(() => {
    if (totalPages <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [totalPages]);

  return (
    <section className="py-20 bg-gradient-to-b from-black to-purple-950/20" id="opinions">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-amber-500/10 text-amber-400 text-sm font-medium rounded-full border border-amber-500/20">
              ⭐ {t('badge') || 'Opinions verificades'}
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-white mb-4"
          >
            {t('title') || 'El que diuen els nostres'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              {t('titleHighlight') || 'clients'}
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto"
          >
            {t('subtitle') || 'Opinions reals de clients reals. Sense trampa ni cartó.'}
          </motion.p>
        </div>

        {/* Stats Bar */}
        <StatsBar />

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-32" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/10 rounded" />
                  <div className="h-3 bg-white/10 rounded" />
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400">{t('error') || 'Error carregant opinions'}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data.testimonials.length === 0 && (
          <EmptyState />
        )}

        {/* Testimonials Grid */}
        {!isLoading && !error && data.testimonials.length > 0 && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-3 gap-6"
              >
                {currentTestimonials.map((testimonial) => (
                  <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i === currentPage
                        ? 'bg-amber-400 w-8'
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Gamification Banner */}
        <GamificationBanner />
      </div>
    </section>
  );
}
