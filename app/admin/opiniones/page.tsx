'use client';

/**
 * ADMIN PANEL - GESTIÓ D'OPINIONS
 * ================================
 * Panel per aprovar/rebutjar/destacar opinions
 * Actualitzat per nou esquema Supabase amb status
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id?: string;
  name: string | null;
  email: string;
  phone?: string | null;
  city?: string | null;
  instagram?: string | null;
}

interface Testimonial {
  id: string;
  title?: string | null;
  comment: string;
  rating: number;
  eventType?: string | null;
  eventDate?: string | null;
  photoUrl?: string | null;
  consentPhotoPublication: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'featured';
  discountCode?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  customer: Customer;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  featured: number;
  avgRating: number;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  boda: 'Boda',
  cumpleaños: 'Cumpleaños',
  corporativo: 'Corporativo',
  comunion: 'Comunión',
  bautizo: 'Bautizo',
  fiesta: 'Fiesta Privada',
  festival: 'Festival',
  otro: 'Otro',
};

export default function AdminOpinionesPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Auth is handled by middleware with browser Basic Auth prompt
  // No client-side credentials needed

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/testimonials?filter=${filter}&stats=true`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autoritzat. Comprova les credencials.');
        }
        throw new Error('Error carregant opinions');
      }

      const data = await response.json();
      setTestimonials(data.data || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconegut');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'toggle_featured') => {
    setActionLoading(id);

    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, action }),
      });

      if (!response.ok) {
        throw new Error('Error executant acció');
      }

      await fetchTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Estàs segur que vols eliminar aquesta opinió?')) return;

    setActionLoading(id);

    try {
      const response = await fetch(`/api/admin/testimonials?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error eliminant');
      }

      await fetchTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={star <= rating ? 'text-purple-400' : 'text-zinc-700'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: '✓ Aprovada' };
      case 'featured':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '⭐ Destacada' };
      case 'rejected':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: '✗ Rebutjada' };
      default:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '⏳ Pendent' };
    }
  };

  const isApproved = (status: string) => status === 'approved' || status === 'featured';
  const isFeatured = (status: string) => status === 'featured';
  const isPending = (status: string) => status === 'pending';

  return (
    <div className="min-h-screen bg-stone-100 text-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Gestió d&apos;Opinions
            </h1>
            <p className="text-gray-500 mt-1">Aprova, rebutja i destaca les opinions dels clients</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex gap-4 flex-wrap">
              <div className="bg-stone-50 border border-zinc-800 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                <p className="text-xs text-yellow-500/70">Pendents</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                <p className="text-xs text-green-500/70">Aprovades</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.featured || 0}</p>
                <p className="text-xs text-purple-500/70">Destacades</p>
              </div>
              <div className="bg-stone-50 border border-zinc-800 rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{stats.avgRating?.toFixed(1) || '0.0'}</p>
                <p className="text-xs text-gray-500">Mitjana ★</p>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-stone-100 text-gray-400 hover:bg-zinc-700'
            }`}
          >
            Pendents
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-stone-100 text-gray-400 hover:bg-zinc-700'
            }`}
          >
            Totes
          </button>
          <button
            onClick={() => fetchTestimonials()}
            className="px-4 py-2 rounded-lg bg-stone-100 text-gray-400 hover:bg-zinc-700 transition-all ml-auto"
          >
            Refrescar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Empty State */}
        {!loading && testimonials.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {filter === 'pending' ? 'No hi ha opinions pendents' : 'No hi ha opinions'}
            </p>
          </div>
        )}

        {/* Testimonials List */}
        <AnimatePresence>
          <div className="space-y-4">
            {testimonials.map(t => {
              const statusBadge = getStatusBadge(t.status);

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`bg-stone-50 border rounded-2xl p-6 ${
                    isFeatured(t.status)
                      ? 'border-purple-500/50'
                      : isApproved(t.status)
                      ? 'border-green-500/30'
                      : t.status === 'rejected'
                      ? 'border-red-500/30'
                      : 'border-yellow-500/30'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Content */}
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-slate-800">
                              {t.customer.name || 'Client anònim'}
                            </h3>
                            {renderStars(t.rating)}
                          </div>
                          <p className="text-gray-500 text-sm">
                            {t.customer.email}
                            {t.customer.phone && ` · ${t.customer.phone}`}
                            {t.customer.city && ` · ${t.customer.city}`}
                          </p>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Event info */}
                      {(t.eventType || t.eventDate) && (
                        <div className="flex gap-3 mb-3 text-sm">
                          {t.eventType && (
                            <span className="text-gray-400">
                              {EVENT_TYPE_LABELS[t.eventType] || t.eventType}
                            </span>
                          )}
                          {t.eventDate && (
                            <span className="text-gray-500">
                              {new Date(t.eventDate).toLocaleDateString('ca-ES')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Title */}
                      {t.title && (
                        <p className="text-purple-400 font-medium mb-2">{t.title}</p>
                      )}

                      {/* Comment */}
                      <p className="text-gray-300 leading-relaxed mb-4">&quot;{t.comment}&quot;</p>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        {t.discountCode && (
                          <span className="bg-stone-100 px-2 py-1 rounded">
                            {t.discountCode}
                          </span>
                        )}
                        {t.customer.instagram && (
                          <span>@{t.customer.instagram}</span>
                        )}
                        <span>
                          {new Date(t.createdAt).toLocaleDateString('ca-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {t.consentPhotoPublication && (
                          <span className="text-green-400">Permet publicar nom</span>
                        )}
                      </div>

                      {/* Rejection reason */}
                      {t.status === 'rejected' && t.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                          <p className="text-red-400 text-sm">Motiu: {t.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 lg:w-32">
                      {isPending(t.status) && (
                        <>
                          <button
                            onClick={() => handleAction(t.id, 'approve')}
                            disabled={actionLoading === t.id}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 text-sm"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleAction(t.id, 'reject')}
                            disabled={actionLoading === t.id}
                            className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 text-sm"
                          >
                            Rebutjar
                          </button>
                        </>
                      )}
                      {isApproved(t.status) && (
                        <button
                          onClick={() => handleAction(t.id, 'toggle_featured')}
                          disabled={actionLoading === t.id}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 text-sm ${
                            isFeatured(t.status)
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/40'
                          }`}
                        >
                          {isFeatured(t.status) ? 'Destacada' : 'Destacar'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={actionLoading === t.id}
                        className="flex-1 bg-stone-100 hover:bg-zinc-700 text-gray-400 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
