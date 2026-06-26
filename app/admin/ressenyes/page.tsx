'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { AdminPage, AdminKpiRow, AdminKpi } from '../components/AdminPage';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatDateTime } from '@/lib/constants';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { log } from '@/lib/logger';

type Testimonial = {
  id: string;
  text: string;
  rating: number;
  createdAt: string;
  isApproved: boolean;
  eventType?: string;
  canvasImageUrl?: string | null;
  discountCode?: { code: string; discountPercent: number } | null;
  customer: {
    name: string;
    email: string;
  };
};

type StatusTab = 'pending' | 'approved';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} de 5 estrelles`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, rating - star + 1));
        return (
          <span
            key={star}
            className={`text-sm ${fill >= 1 ? 'admin-tone-text-warning' : fill > 0 ? 'admin-tone-text-warning' : 'text-white/10'}`}
          >
            ★
          </span>
        );
      })}
      <span className="ml-1.5 text-xs font-semibold text-white/50">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function AdminRessenyesPage() {
  const [pending, setPending] = useState<Testimonial[]>([]);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('pending');
  const shouldReduceMotion = useReducedMotion();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [canvasPreview, setCanvasPreview] = useState<{ id: string; url: string } | null>(null);
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();

  const activeList = useMemo(
    () => (activeTab === 'pending' ? pending : approved),
    [activeTab, pending, approved]
  );

  const avgRating = useMemo(() => {
    const all = [...pending, ...approved];
    if (all.length === 0) return 0;
    return all.reduce((sum, t) => sum + t.rating, 0) / all.length;
  }, [pending, approved]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetchWithCsrf('/api/admin/testimonials?status=pending', { cache: 'no-store' }),
        fetchWithCsrf('/api/admin/testimonials?status=approved', { cache: 'no-store' }),
      ]);

      if (!pendingRes.ok || !approvedRes.ok) {
        throw new Error('No s\'han pogut carregar totes les ressenyes');
      }

      const [pendingData, approvedData] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
      ]);

      setPending(pendingData.testimonials || []);
      setApproved(approvedData.testimonials || []);
    } catch (error) {
      log.error('[AdminRessenyes] Error carregant ressenyes', error);
      toast.error('Error carregant ressenyes');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyHash = () => {
      if (window.location.hash === '#pendents') setActiveTab('pending');
      else if (window.location.hash === '#aprovades') setActiveTab('approved');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const updateStatus = async (id: string, action: 'approve' | 'hide' | 'delete') => {
    if (action === 'delete') {
      const confirmed = await confirm({
        title: 'Eliminar ressenya',
        message: 'Segur que vols eliminar aquest testimoni? Aquesta acció no es pot desfer.',
        variant: 'danger',
        confirmLabel: 'Eliminar',
      });
      if (!confirmed) return;
    }
    setBusyId(id);

    // Optimistic update
    const item = [...pending, ...approved].find((t) => t.id === id);
    if (action === 'approve' && item) {
      setPending((prev) => prev.filter((t) => t.id !== id));
      setApproved((prev) => [{ ...item, isApproved: true }, ...prev]);
    } else if (action === 'hide' && item) {
      setApproved((prev) => prev.filter((t) => t.id !== id));
      setPending((prev) => [{ ...item, isApproved: false }, ...prev]);
    } else if (action === 'delete') {
      setPending((prev) => prev.filter((t) => t.id !== id));
      setApproved((prev) => prev.filter((t) => t.id !== id));
    }

    try {
      const res = await fetchWithCsrf('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        const labels = { approve: 'Ressenya aprovada', hide: 'Ressenya amagada', delete: 'Ressenya eliminada' };
        toast.success(labels[action]);
      } else {
        toast.error("No s'ha pogut actualitzar la ressenya");
        await load(); // Revert on error
      }
    } catch (err) {
      console.error('Error actualitzant ressenya', err);
      toast.error("Error de connexio");
      await load(); // Revert on error
    } finally {
      setBusyId(null);
    }
  };

  const buildCanvasParams = (t: Testimonial, preset: string) => {
    const params = new URLSearchParams({
      name: t.customer.name,
      text: t.text,
      rating: String(t.rating),
      preset,
    });
    if (t.eventType) params.set('eventType', t.eventType);
    if (t.discountCode) {
      params.set('code', t.discountCode.code);
      params.set('discount', String(t.discountCode.discountPercent));
    }
    return `/api/canvas/testimonial?${params.toString()}`;
  };

  const generateCanvas = (t: Testimonial, preset: string = 'story') => {
    setCanvasPreview({ id: t.id, url: buildCanvasParams(t, preset) });
  };

  const downloadCanvas = (t: Testimonial, preset: string = 'story') => {
    const url = buildCanvasParams(t, preset);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbita-ressenya-${t.customer.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
    toast.success('Imatge descarregada');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="">Carregant ressenyes...</div>
      </div>
    );
  }

  return (
    <AdminPage
      title="Ressenyes"
      subtitle="Aprova o amaga opinions rebudes del web."
      kpis={
        <AdminKpiRow>
          <AdminKpi label="Pendents" value={pending.length} tone={pending.length > 0 ? 'warning' : 'success'} />
          <AdminKpi label="Aprovades" value={approved.length} tone="success" />
          <AdminKpi label="Total" value={pending.length + approved.length} />
          <AdminKpi
            label="Nota mitjana"
            value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : '-'}
            tone={avgRating >= 4 ? 'success' : avgRating >= 3 ? 'warning' : 'danger'}
          />
        </AdminKpiRow>
      }
    >

      <div id="pendents" aria-hidden="true" />
      <div id="aprovades" aria-hidden="true" />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`admin-reviews-tab px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            activeTab === 'pending'
              ? 'admin-reviews-tab--active'
              : 'admin-reviews-tab--idle'
          }`}
        >
          Pendents ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`admin-reviews-tab px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            activeTab === 'approved'
              ? 'admin-reviews-tab--active'
              : 'admin-reviews-tab--idle'
          }`}
        >
          Aprovades ({approved.length})
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          className="grid grid-cols-1 gap-4"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
        >
        {activeList.length === 0 && (
          <div className="rounded-2xl border admin-card-glass p-6 text-center text-white/40">
            {activeTab === 'pending'
              ? 'Cap ressenya pendent. Tot al dia!'
              : 'Cap ressenya aprovada encara.'}
          </div>
        )}

        {activeList.map((t) => (
          <div key={t.id} className="rounded-2xl border admin-card-glass p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                    {t.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.customer.name}</div>
                    <div className="text-xs text-white/40">{t.customer.email}</div>
                  </div>
                </div>
                <div className="text-xs text-white/30 mt-1.5 ml-10">
                  {formatDateTime(t.createdAt)}
                  {t.eventType && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                      {t.eventType}
                    </span>
                  )}
                </div>
              </div>
              <StarRating rating={t.rating} />
            </div>

            <blockquote className="mt-4 pl-4 border-l-2 text-white/70 italic whitespace-pre-wrap leading-relaxed">
              {t.text}
            </blockquote>

            {t.discountCode && (
              <div className="mt-3 text-xs text-white/30 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded border font-mono">
                  {t.discountCode.code}
                </span>
                <span>-{t.discountCode.discountPercent}%</span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {t.isApproved ? (
                <button
                  type="button"
                  onClick={() => updateStatus(t.id, 'hide')}
                  className="admin-reviews-action admin-reviews-action--neutral px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  aria-busy={busyId === t.id}
                  disabled={busyId === t.id}
                >
                  Amagar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateStatus(t.id, 'approve')}
                  className="admin-reviews-action admin-reviews-action--ok px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  aria-busy={busyId === t.id}
                  disabled={busyId === t.id}
                >
                  Aprovar
                </button>
              )}
              <button
                type="button"
                onClick={() => updateStatus(t.id, 'delete')}
                className="admin-reviews-action admin-reviews-action--danger px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                aria-busy={busyId === t.id}
                disabled={busyId === t.id}
              >
                Eliminar
              </button>
              {t.isApproved && (
                <>
                  <button
                    type="button"
                    onClick={() => generateCanvas(t, 'story')}
                    className="px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  >
                    Canvas Story
                  </button>
                  <button
                    type="button"
                    onClick={() => generateCanvas(t, 'instagram')}
                    className="px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  >
                    Canvas Post
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCanvas(t, 'story')}
                    className="px-4 py-2 rounded-full border border-white/10 text-sm font-semibold transition-colors hover:bg-white/5"
                  >
                    Descarregar
                  </button>
                </>
              )}
            </div>

            {/* Canvas preview */}
            {canvasPreview?.id === t.id && (
              <div className="mt-4 rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Previsualització Canvas</p>
                  <button
                    type="button"
                    onClick={() => setCanvasPreview(null)}
                    className="text-xs hover:underline"
                  >
                    Tancar
                  </button>
                </div>
                <Image
                  src={canvasPreview.url}
                  alt={`Canvas de ${t.customer.name}`}
                  width={1080}
                  height={1080}
                  unoptimized
                  className="max-h-[400px] h-auto w-auto rounded-xl mx-auto"
                />
              </div>
            )}
          </div>
        ))}
        </motion.div>
      </AnimatePresence>
      <ConfirmDialog {...dialogProps} />
    </AdminPage>
  );
}

