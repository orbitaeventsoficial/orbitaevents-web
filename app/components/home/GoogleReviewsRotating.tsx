// app/components/home/GoogleReviewsRotating.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS - GOOGLE REVIEWS 5★ ROTATIVAS
// ═══════════════════════════════════════════════════════════════════════════
//
// Muestra reseñas reales de Google sin sesgo por rating
// - Carousel automático rotativo
// - Datos dinámicos desde google-reviews.json
// - Sin testimonios estáticos
//
// ═══════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { log } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/app/config/site-config';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
}

interface ReviewsData {
  lastUpdated?: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Star: ({ filled }: { filled: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Quote: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" opacity="0.08">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  ),
  Google: () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Rating Stars
// ═══════════════════════════════════════════════════════════════════════════

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icons.Star key={star} filled={star <= rating} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Review Card
// ═══════════════════════════════════════════════════════════════════════════

function ReviewCard({ review }: { review: GoogleReview }) {
  const { author_name, text, rating, relative_time_description, profile_photo_url } = review;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985, y: 8 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-gradient-to-br from-white/8 to-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-amber-500/10 max-w-4xl mx-auto"
    >
      {/* Quote icon */}
      <div className="absolute top-8 right-8">
        <Icons.Quote />
      </div>

      {/* Header */}
      <div className="flex items-start gap-5 mb-6">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 ring-2 ring-amber-500/20">
          {profile_photo_url ? (
            <Image
              src={profile_photo_url}
              alt={author_name}
              fill
              sizes="64px"
              quality={60}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
              {author_name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-xl mb-2">{author_name}</h4>
          <div className="flex items-center gap-3 mb-2">
            <RatingStars rating={rating} />
          </div>
          <div className="flex items-center gap-2">
            <Icons.Google />
            <span className="text-sm text-white/60">{relative_time_description}</span>
          </div>
        </div>
      </div>

      {/* Text */}
      <blockquote className="text-white/90 text-lg leading-relaxed">
        "{text}"
      </blockquote>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function GoogleReviewsRotating({ showFooterCta = true }: { showFooterCta?: boolean }) {
  const t = useTranslations('googleReviews');
  const locale = useLocale();
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [averageRating, setAverageRating] = useState(5);
  const [totalReviews, setTotalReviews] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);

  // Cargar reseñas desde l'API (agrega GBP + Places + DB + JSON estàtic)
  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch('/api/google-reviews');
        const data: ReviewsData = await response.json();

        setReviews(data.reviews);
        setAverageRating(data.rating);
        setTotalReviews(data.user_ratings_total);
        setLastUpdated(data.lastUpdated);
      } catch (error) {
        log.error('Error loading reviews', error);
      }
    }

    loadReviews();
  }, []);

  // Auto-rotate reviews cada 8 segundos
  useEffect(() => {
    if (!isAutoPlaying || reviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [reviews.length, isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const formattedLastUpdated = (() => {
    if (!lastUpdated) return null;
    const parsed = new Date(lastUpdated);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
    }).format(parsed);
  })();

  if (reviews.length === 0) {
    // Fallback: CTA elegant per aconseguir la primera ressenya
    return (
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.05),transparent_70%)]" />
        <div className="relative container mx-auto px-4 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-6">
              {[1,2,3,4,5].map((i) => (
                <svg key={i} className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {t('sectionTitle')}{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {t('sectionTitleHighlight')}
              </span>
            </h2>
            <p className="text-white/60 text-lg mb-8">
              {t('fallback.description')}
            </p>
            {totalReviews > 0 && (
              <p className="text-white/80 text-base mb-6">
                ⭐ {averageRating.toFixed(1)} · {totalReviews} ressenyes a Google
              </p>
            )}
            {formattedLastUpdated && (
              <p className="text-white/60 text-sm mb-4">
                {t('meta.lastUpdate', { date: formattedLastUpdated })}
              </p>
            )}
            <a
              href={SITE_CONFIG.reviews.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-zinc-900 font-bold rounded-2xl hover:bg-amber-300 transition-colors shadow-lg"
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{t('fallback.cta')}</span>
            </a>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-12 md:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.06),transparent_70%)]" />

      <div className="relative container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold mb-6">
            ⭐ {t('badge.opinions')}
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
            {t('sectionTitle')}{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {t('sectionTitleHighlight')}
            </span>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-6">
            <RatingStars rating={Math.round(averageRating)} />
            <span className="text-white text-2xl font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-white/60">· {totalReviews} ressenyes a Google</span>
          </div>
          <p className="text-white/50 text-sm mt-3">
            {formattedLastUpdated
              ? t('meta.lastUpdateAndVisible', {
                  date: formattedLastUpdated,
                  visible: reviews.length,
                  total: totalReviews,
                })
              : t('meta.visibleOnly', { visible: reviews.length, total: totalReviews })}
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <ReviewCard key={currentIndex} review={reviews[currentIndex]} />
          </AnimatePresence>

          {/* Navigation */}
          {reviews.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={handlePrev}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                aria-label="Anterior"
              >
                <Icons.ChevronLeft />
              </button>

              <div className="flex gap-2">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-amber-400'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Anar a la ressenya ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                aria-label="Siguiente"
              >
                <Icons.ChevronRight />
              </button>
            </div>
          )}
        </div>

        {showFooterCta && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <a
              href={SITE_CONFIG.reviews.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-semibold transition-colors"
            >
              <Icons.Google />
              <span>{t('leaveReviewLink')}</span>
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
}
