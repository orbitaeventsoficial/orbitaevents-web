// app/[locale]/opiniones/client.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { SITE_CONFIG } from '@/app/config/site-config';
import { log } from '@/lib/logger';
import TestimonialForm from '@/app/components/reviews/TestimonialForm';
import GoogleGIcon from '@/app/components/public/GoogleGIcon';
import StarIcon from '@/app/components/public/StarIcon';
import { fetchPublicGoogleReviews, type GoogleReview } from '@/lib/api/googleReviewsClient';
import { fetchPublicStats } from '@/lib/api/publicStatsClient';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface WebTestimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  photoUrl?: string;
  eventType?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICONOS
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  Star: ({ filled, size = 20 }: { filled: boolean; size?: number }) => (
    <StarIcon
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
    />
  ),
  Google: () => <GoogleGIcon width={20} height={20} />,
  Quote: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.1">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════════

function RatingStars({ rating, size = 20 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          <Icons.Star filled={star <= rating} size={size} />
        </span>
      ))}
    </div>
  );
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-colors"
    >
      <div className="absolute top-4 right-4 opacity-10">
        <Icons.Quote />
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0">
          {review.profile_photo_url ? (
            <Image
              src={review.profile_photo_url}
              alt={review.author_name}
              fill
              sizes="48px"
              quality={60}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
              {review.author_name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{review.author_name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} size={14} />
            <span className="text-white/50 text-sm">{review.relative_time_description}</span>
          </div>
        </div>

        {review.source === 'google' || review.source === 'json' ? (
          <Icons.Google />
        ) : null}
      </div>

      <p className="text-white/80 text-sm leading-relaxed line-clamp-4">
        &quot;{review.text}&quot;
      </p>
    </motion.div>
  );
}

function WebTestimonialCard({
  testimonial,
  verifiedLabel,
}: {
  testimonial: WebTestimonial;
  verifiedLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0 ring-2 ring-amber-500/30">
          {testimonial.photoUrl ? (
            <Image
              src={testimonial.photoUrl}
              alt={testimonial.name}
              fill
              sizes="48px"
              quality={60}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
              {testimonial.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{testimonial.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={testimonial.rating} size={14} />
            {testimonial.eventType && (
              <span className="text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded-full">
                {testimonial.eventType}
              </span>
            )}
          </div>
        </div>

          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
          {verifiedLabel}
          </span>
        </div>

      <p className="text-white/90 leading-relaxed">
        &quot;{testimonial.text}&quot;
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function OpinionesClient() {
  const t = useTranslations('opinionsPage.ui');
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [webTestimonials, setWebTestimonials] = useState<WebTestimonial[]>([]);
  const [averageRating, setAverageRating] = useState(5);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        let googleCount = 0;
        let googleSource: string | null = null;
        let webCount = 0;
        let hasGoogleReviews = false;
        let hasGoogleRating = false;
        // Load Google reviews
        try {
          const googleData = await fetchPublicGoogleReviews();
          const parsedGoogleReviews = googleData.reviews || [];
          setGoogleReviews(parsedGoogleReviews);
          setAverageRating(googleData.rating || 5);
          hasGoogleReviews = parsedGoogleReviews.length > 0;
          hasGoogleRating = typeof googleData.rating === 'number';
          googleCount = googleData.user_ratings_total || 0;
          googleSource = googleData.source || null;
        } catch {
          // Fallback to web testimonials and stats below.
        }

        try {
          const statsData = await fetchPublicStats();
          const statsValues = statsData.stats;
          googleCount = Math.max(googleCount, statsValues?.googleReviewsCount || 0);
          if (!hasGoogleReviews && !hasGoogleRating && typeof statsValues?.averageRating === 'number') {
            setAverageRating(statsValues.averageRating);
          }
        } catch {
          // mantenir estat de Google reviews / valors per defecte
        }

        // Load web testimonials
        const testimonialsRes = await fetch('/api/testimonials?limit=20');
        if (testimonialsRes.ok) {
          const testimonialsData = await testimonialsRes.json();
          setWebTestimonials(testimonialsData.testimonials || []);
          webCount = (testimonialsData.testimonials || []).length;
        }

        if (!googleSource) {
          setTotalReviews(webCount);
        } else if (googleSource === 'google' || googleSource === 'json') {
          setTotalReviews(googleCount + webCount);
        } else {
          setTotalReviews(googleCount);
        }
      } catch (error) {
        log.error('Error loading reviews', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black relative">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold mb-6">
              {t('heroBadge')}
            </span>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              {t('heroTitlePrefix')}{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {t('heroTitleAccent')}
              </span>
            </h1>

            <div className="flex items-center justify-center gap-4 mb-8">
              <RatingStars rating={5} size={28} />
              <span className="text-white text-3xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-white/60 text-lg">
                · {totalReviews > 0 ? `${totalReviews}+ ${t('reviewsWord')}` : t('reviewsWord')}
              </span>
            </div>

            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {totalReviews > 0 ? t('introWithCount', { count: totalReviews }) : t('introNoCount')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA to leave review */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 md:p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">{t('knownTitle')}</h2>
            <p className="text-white/70 mb-6">
              {t('knownDescription').split('25%')[0]}
              <span className="text-amber-400 font-bold">25%</span>
              {t('knownDescription').split('25%')[1] || ''}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              {t('knownButton')}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-xl w-full my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 flex items-center justify-center text-lg transition-colors"
              >
                ×
              </button>
              <TestimonialForm />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Web Testimonials */}
      {webTestimonials.length > 0 && (
        <section className="py-16 border-t border-white/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-white mb-2">{t('webOpinionsTitle')}</h2>
              <p className="text-white/60">{t('webOpinionsSubtitle')}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {webTestimonials.map((testimonial) => (
                <WebTestimonialCard key={testimonial.id} testimonial={testimonial} verifiedLabel={t('verifiedBadge')} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Google Reviews */}
      {googleReviews.length > 0 && (
        <section className="py-16 border-t border-white/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Icons.Google />
                <h2 className="text-2xl font-bold text-white">{t('googleTitle')}</h2>
              </div>
              <p className="text-white/60">{t('googleSubtitle')}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {googleReviews.slice(0, 9).map((review, index) => (
                <GoogleReviewCard key={index} review={review} />
              ))}
            </div>

            <div className="text-center mt-8">
              <a
                href={SITE_CONFIG.reviews.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-colors"
              >
                <Icons.Google />
                  <span>{t('googleCta')}</span>
                </a>
              </div>
            </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && googleReviews.length === 0 && webTestimonials.length === 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white/60 text-lg">
              {t('emptyState')}
            </p>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('finalTitlePrefix')}{' '}
              <span className="text-amber-400">{t('finalTitleAccent')}</span>?
            </h2>
            <p className="text-white/70 mb-8 max-w-xl mx-auto">
              {totalReviews > 0 ? t('finalWithCount', { count: totalReviews }) : t('finalNoCount')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/configurador"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                {t('configureEvent')}
              </Link>
              <Link
                href="/contacto"
                className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all"
              >
                {t('contact')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
