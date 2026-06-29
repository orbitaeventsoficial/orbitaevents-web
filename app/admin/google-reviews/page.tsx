'use client';

/**
 * ADMIN - RESSENYES DE GOOGLE
 * Només mostra ressenyes sincronitzades de Google (5 estrelles)
 * Només lectura: no permet editar ni afegir testimonis
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { log } from '@/lib/logger';
import { AdminPage } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import { formatDateTimeFull } from '@/lib/constants';
import { SITE_CONFIG } from '@/app/config/site-config';
import GoogleGIcon from '@/app/components/public/GoogleGIcon';
import { fetchPublicGoogleReviews, type GoogleReview } from '@/lib/api/googleReviewsClient';
import { fetchWithCsrf } from '@/lib/csrf';

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const toast = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews(init?: RequestInit) {
    try {
      setLoadError(null);
      const reviewsData = (await fetchPublicGoogleReviews(init)) as ReviewsData;
      setData(reviewsData);
      return true;
    } catch (error) {
      const message = "No s'han pogut carregar les ressenyes ara mateix.";
      setLoadError(message);
      log.error('Error carregant ressenyes:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function syncReviews() {
    setSyncing(true);
    try {
      const response = await fetchWithCsrf('/api/admin/google-reviews/sync', { method: 'POST' });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; synced?: number } | null;

      if (!response.ok || !result?.ok) {
        toast.error(result?.error || "No s'han pogut sincronitzar les ressenyes");
        return;
      }

      const reloaded = await loadReviews({ cache: 'no-store' });
      toast[reloaded ? 'success' : 'error'](
        reloaded
          ? `Ressenyes sincronitzades (${result.synced ?? 0})`
          : "Sincronitzades, però no s'han pogut recarregar"
      );
    } finally {
      setSyncing(false);
    }
  }

  const fiveStarReviews = useMemo(
    () => data?.reviews.filter((review) => review.rating === 5) || [],
    [data]
  );
  const totalReviews = data?.user_ratings_total || data?.reviews.length || 0;
  const lastUpdate = data?.lastUpdated ? formatDateTimeFull(data.lastUpdated) : 'Mai';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-[var(--t)]">Carregant ressenyes...</div>
      </div>
    );
  }

  return (
    <AdminPage
      title="Ressenyes Google"
      subtitle="Només es mostren ressenyes de 5 estrelles sincronitzades des de Google Business"
    >

      {loadError && (
        <div className="rounded-xl border admin-tone-border-danger admin-tone-bg-danger px-4 py-3 text-sm admin-tone-text-danger">
          {loadError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-2xl p-6"
        >
          <div className="text-sm text-[var(--t2)] mb-1">Valoració mitjana</div>
          <div className="text-3xl font-bold">{data?.rating.toFixed(1) || '0.0'}</div>
          <div className="mt-1 text-xs admin-tone-text-slate">⭐⭐⭐⭐⭐</div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.1 }}
          className="border rounded-2xl p-6"
        >
          <div className="text-sm text-[var(--t2)] mb-1">Total ressenyes</div>
          <div className="text-3xl font-bold">{totalReviews}</div>
          <div className="mt-1 text-xs admin-tone-text-slate">En Google Business</div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.2 }}
          className="border rounded-2xl p-6"
        >
          <div className="text-sm text-[var(--t2)] mb-1">5 estrelles</div>
          <div className="text-3xl font-bold">{fiveStarReviews.length}</div>
          <div className="mt-1 text-xs admin-tone-text-slate">Mostrades al web</div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.3 }}
          className="border rounded-2xl p-6"
        >
          <div className="text-sm text-[var(--t2)] mb-1">Última sincronització</div>
          <div className="text-sm font-semibold">{lastUpdate}</div>
          <button
            onClick={syncReviews}
            disabled={syncing}
            className="ap-btn ap-btn--xs mt-2"
          >
            {syncing ? 'Actualitzant...' : 'Refrescar'}
          </button>
        </motion.div>
      </div>

      {/* Reviews List */}
      <div className="ap-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-[var(--t)] mb-6">
          Ressenyes de 5 estrelles ({fiveStarReviews.length})
        </h2>

        {fiveStarReviews.length === 0 ? (
          <div className="py-12 text-center admin-tone-text-slate">
            <p className="mb-4">Encara no hi ha ressenyes de 5 estrelles</p>
            <button
              onClick={syncReviews}
              className="ap-btn ap-btn--primary"
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
                className="ap-card rounded-xl p-6 transition-colors hover:admin-tone-bg-neutral"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[var(--raised)] flex items-center justify-center text-[var(--t)] font-bold flex-shrink-0">
                    {review.author_name.charAt(0)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-[var(--t)]">{review.author_name}</h3>
                      <span className="text-xs admin-tone-text-neutral">{review.relative_time_description}</span>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>

                    <p className="text-[var(--t2)] text-sm leading-relaxed">{review.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 border rounded-xl p-6">
        <h3 className="font-semibold mb-2">ℹ️ Informació</h3>
        <ul className="text-sm text-[var(--t2)] space-y-1">
          <li>• Les ressenyes se sincronitzen amb el cron i també es poden refrescar manualment des d'aquesta pantalla</li>
          <li>• Només es mostren ressenyes de 5 estrelles al web</li>
          <li>• La sincronització usa SerpAPI configurat a les variables d’entorn</li>
          <li>• No es poden editar ni eliminar ressenyes (són de Google Business)</li>
        </ul>
        <a
          href={SITE_CONFIG.reviews.googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ap-btn ap-btn--primary mt-4"
        >
          <GoogleGIcon width={16} height={16} />
          Veure pàgina de Google Business
        </a>
      </div>
    </AdminPage>
  );
}
