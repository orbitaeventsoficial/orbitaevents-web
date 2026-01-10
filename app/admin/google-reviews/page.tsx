'use client';

/**
 * ADMIN - GOOGLE REVIEWS
 * Solo muestra reseñas sincronizadas de Google (5 estrellas)
 * Read-only - No permite editar ni añadir testimonios
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
}

interface ReviewsData {
  lastUpdated: string;
  rating: number;
  total: number;
  reviews: GoogleReview[];
}

export default function GoogleReviewsAdminPage() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const response = await fetch('/data/google-reviews.json');
      const reviewsData: ReviewsData = await response.json();
      setData(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function syncReviews() {
    setSyncing(true);
    try {
      // Llamar al endpoint que ejecuta el script de sincronización
      await fetch('/api/admin/sync-google-reviews', { method: 'POST' });
      await loadReviews();
    } catch (error) {
      console.error('Error syncing reviews:', error);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Cargando reseñas...</div>
      </div>
    );
  }

  const fiveStarReviews = data?.reviews.filter(r => r.rating === 5) || [];
  const lastUpdate = data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString('ca-ES') : 'Never';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Reseñas de Google
        </h1>
        <p className="text-white/60">
          Solo se muestran reseñas de 5 estrellas sincronizadas desde Google Business
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">Rating Promedio</div>
          <div className="text-3xl font-bold text-amber-400">{data?.rating.toFixed(1) || '0.0'}</div>
          <div className="text-xs text-white/40 mt-1">⭐⭐⭐⭐⭐</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">Total Reseñas</div>
          <div className="text-3xl font-bold text-blue-400">{data?.total || 0}</div>
          <div className="text-xs text-white/40 mt-1">En Google Business</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">5 Estrellas</div>
          <div className="text-3xl font-bold text-emerald-400">{fiveStarReviews.length}</div>
          <div className="text-xs text-white/40 mt-1">Mostrándose en web</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="text-sm text-white/60 mb-1">Última Sync</div>
          <div className="text-sm font-semibold text-purple-400">{lastUpdate}</div>
          <button
            onClick={syncReviews}
            disabled={syncing}
            className="mt-2 text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-white transition-colors disabled:opacity-50"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </button>
        </motion.div>
      </div>

      {/* Reviews List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          Reseñas de 5 Estrellas ({fiveStarReviews.length})
        </h2>

        {fiveStarReviews.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <p className="mb-4">No hay reseñas de 5 estrellas todavía</p>
            <button
              onClick={syncReviews}
              className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-white font-medium transition-colors"
            >
              Sincronizar desde Google
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fiveStarReviews.map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors"
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
        <h3 className="font-semibold text-blue-400 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-white/70 space-y-1">
          <li>• Las reseñas se sincronizan automáticamente durante el build de Vercel</li>
          <li>• Solo se muestran reseñas de 5 estrellas en la web</li>
          <li>• La sincronización usa SerpAPI configurado en las variables de entorno</li>
          <li>• No es posible editar ni eliminar reseñas (son de Google Business)</li>
        </ul>
      </div>
    </div>
  );
}
