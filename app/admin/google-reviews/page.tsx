'use client';

/**
 * ADMIN - RESSENYES DE GOOGLE
 * Només mostra ressenyes sincronitzades de Google (5 estrelles)
 * Només lectura: no permet editar ni afegir testimonis
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { log } from '@/lib/logger';

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
  user_ratings_total?: number;
  reviews: GoogleReview[];
}

export default function GoogleReviewsAdminPage() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const response = await fetch('/api/google-reviews');
      const reviewsData: ReviewsData = await response.json();
      setData(reviewsData);
    } catch (error) {
      log.error('Error carregant ressenyes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function syncReviews() {
    setSyncing(true);
    try {
      await loadReviews();
    } finally {
      setSyncing(false);
    }
  }

  const fiveStarReviews = useMemo(
    () => data?.reviews.filter((review) => review.rating === 5) || [],
    [data]
  );
  const totalReviews = data?.user_ratings_total || data?.reviews.length || 0;
  const lastUpdate = data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString('ca-ES') : 'Mai';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-white">Carregant ressenyes...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Ressenyes de Google
        </h1>
        <p className="text-white/60">
          Només es mostren ressenyes de 5 estrelles sincronitzades des de Google Business
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">Valoració mitjana</div>
          <div className="text-3xl font-bold text-amber-400">{data?.rating.toFixed(1) || '0.0'}</div>
          <div className="text-xs text-white/40 mt-1">⭐⭐⭐⭐⭐</div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">Total ressenyes</div>
          <div className="text-3xl font-bold text-blue-400">{totalReviews}</div>
          <div className="text-xs text-white/40 mt-1">En Google Business</div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">5 estrelles</div>
          <div className="text-3xl font-bold text-emerald-400">{fiveStarReviews.length}</div>
          <div className="text-xs text-white/40 mt-1">Mostrades al web</div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">Última sincronització</div>
          <div className="text-sm font-semibold text-purple-400">{lastUpdate}</div>
          <button
            onClick={syncReviews}
            disabled={syncing}
            className="mt-2 text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            {syncing ? 'Actualitzant...' : 'Refrescar'}
          </button>
        </motion.div>
      </div>

      {/* Reviews List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          Ressenyes de 5 estrelles ({fiveStarReviews.length})
        </h2>

        {fiveStarReviews.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <p className="mb-4">Encara no hi ha ressenyes de 5 estrelles</p>
            <button
              onClick={syncReviews}
              className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-white font-medium transition-colors"
            >
              Refrescar ressenyes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fiveStarReviews.map((review, index) => (
              <motion.div
                key={index}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0 } : { delay: index * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-slate-950/60/[0.07] transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {review.author_name.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{review.author_name}</h3>
                      <span className="text-xs text-white/50">{review.relative_time_description}</span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>

                    <p className="text-white/80 text-sm leading-relaxed">{review.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="font-semibold text-blue-400 mb-2">ℹ️ Informació</h3>
        <ul className="text-sm text-white/70 space-y-1">
          <li>• Les ressenyes se sincronitzen automàticament durant el build de Railway</li>
          <li>• Només es mostren ressenyes de 5 estrelles al web</li>
          <li>• La sincronització usa SerpAPI configurat a les variables d’entorn</li>
          <li>• No es poden editar ni eliminar ressenyes (són de Google Business)</li>
        </ul>
        <a
          href="https://g.page/r/CXcgbvANsXSzEBE/review"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-white font-medium transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Veure pàgina de Google Business
        </a>
      </div>
    </div>
  );
}

