'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SITE_CONFIG } from '@/app/config/site-config';
import { getEventLabel } from '@/lib/constants';
import { log } from '@/lib/logger';
import GoogleGIcon from '@/app/components/public/GoogleGIcon';
import { fetchPublicGoogleReviews } from '@/lib/api/googleReviewsClient';

interface Review {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url?: string;
  source: 'google' | 'database' | 'manual' | 'json';
  eventType?: string;
}

interface ReviewsData {
  rating: number;
  user_ratings_total: number;
  reviews: Review[];
  googleReviewsUrl: string;
}

/**
 * Component de Ressenyes per la web pública
 * Mostra ressenyes reals de Google i de la base de dades
 */
export default function ReviewsSection({ 
  locale = 'ca',
  maxReviews = 6,
  showGoogleButton = true,
  className = '',
}: {
  locale?: string;
  maxReviews?: number;
  showGoogleButton?: boolean;
  className?: string;
}) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const reviewsData = await fetchPublicGoogleReviews();
      setData(reviewsData);
    } catch (error) {
      log.error('Failed to load reviews', error);
    } finally {
      setLoading(false);
    }
  };

  // No mostrar res si no hi ha ressenyes
  if (loading) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="h-4 w-32 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.reviews.length === 0) {
    // Mostrar CTA per demanar ressenyes
    return (
      <section className={`py-16 bg-gradient-to-b from-black to-black ${className}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            🌟 La Teva Opinió Importa
          </h2>
          <p className="text-white/40 mb-8 max-w-xl mx-auto">
            Si has gaudit dels nostres serveis, ens encantaria que compartissis la teva experiència
          </p>
          <a
            href={SITE_CONFIG.reviews.googleBusinessUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-amber-500 text-black font-semibold rounded-full hover:bg-amber-400 transition-all"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            </svg>
            Deixa la Teva Opinió a Google
          </a>
        </div>
      </section>
    );
  }

  const reviews = data.reviews.slice(0, maxReviews);
  const googleUrl = data.googleReviewsUrl || SITE_CONFIG.reviews.googleBusinessUrl;

  return (
    <section className={`py-16 md:py-24 bg-gradient-to-b from-black to-black overflow-hidden ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ⭐ El Que Diuen Els Nostres Clients
          </h2>
          
          {/* Rating Summary */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-2xl ${star <= Math.round(data.rating) ? 'text-amber-400' : 'text-white/20'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-2xl font-bold text-white">{data.rating.toFixed(1)}</span>
            <span className="text-white/40">
              ({data.user_ratings_total} {data.user_ratings_total === 1 ? 'opinió' : 'opinions'})
            </span>
          </div>
          
          {/* Google Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm text-white/70">
            <GoogleGIcon className="w-4 h-4" />
            Ressenyes verificades
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-amber-500/30 transition-all duration-300 group"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 text-4xl text-amber-500/20 group-hover:text-amber-500/40 transition-colors">
                "
              </div>
              
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                {/* Avatar */}
                {review.profile_photo_url ? (
                  <Image
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                    {review.author_name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{review.author_name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= review.rating ? 'text-amber-400' : 'text-white/20'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-white/30">{review.relative_time_description}</span>
                  </div>
                </div>
              </div>
              
              {/* Event Type Badge */}
              {review.eventType && getEventLabel(review.eventType) !== review.eventType && (
                <div className="mb-3">
                  <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                    {getEventLabel(review.eventType)}
                  </span>
                </div>
              )}
              
              {/* Text */}
              <p className="text-white/70 text-sm leading-relaxed line-clamp-4">
                {review.text}
              </p>
              
              {/* Source Badge */}
              <div className="mt-4 flex items-center gap-2">
                {review.source === 'google' && (
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    </svg>
                    Google
                  </span>
                )}
                {review.source === 'database' && (
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    ✓ Verificat
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {showGoogleButton && googleUrl && (
          <div className="text-center mt-12">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-full hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              Deixa la Teva Opinió
            </a>
            <p className="mt-4 text-sm text-white/30">
              La teva opinió ens ajuda a millorar i a ajudar altres clients
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Component compacte per mostrar rating a headers/footers
 */
export function ReviewsBadge({ className = '' }: { className?: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);

  useEffect(() => {
    fetchPublicGoogleReviews()
      .then(setData)
      .catch(err => log.error('Failed to fetch reviews for badge', err));
  }, []);

  if (!data || data.reviews.length === 0) return null;

  return (
    <a
      href={data.googleReviewsUrl || SITE_CONFIG.reviews.googleBusinessUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors ${className}`}
    >
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xs ${star <= Math.round(data.rating) ? 'text-amber-400' : 'text-white/30'}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-medium text-white">{data.rating.toFixed(1)}</span>
      <span className="text-xs text-white/40">({data.user_ratings_total})</span>
    </a>
  );
}

/**
 * Component inline per mostrar a cards de serveis
 */
export function ReviewsInline({ className = '' }: { className?: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);

  useEffect(() => {
    fetchPublicGoogleReviews()
      .then(setData)
      .catch(err => log.error('Failed to fetch reviews for inline display', err));
  }, []);

  if (!data || data.reviews.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= Math.round(data.rating) ? 'text-amber-400' : 'text-white/70'}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold">{data.rating.toFixed(1)}</span>
      <span className="text-xs text-white/30">• {data.user_ratings_total} opinions</span>
    </div>
  );
}
