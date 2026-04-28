'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { AdminPage, AdminKpiRow, AdminKpi } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { useToast } from '../components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatDateTime } from '@/lib/constants';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { log } from '@/lib/logger';
import { pluralize } from '@/lib/utils/pluralize';

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
            className={`text-sm ${fill >= 1 ? 'text-amber-400' : fill > 0 ? 'text-amber-400/50' : 'text-white/10'}`}
          >
            â˜…
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
    } catch {
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

  const strip = useMemo(() => {
    if (loading) return null;

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const total = pending.length + approved.length;
    const stalePending = pending.filter((t) => now - new Date(t.createdAt).getTime() > SEVEN_DAYS).length;
    const lowRatingPending = pending.filter((t) => t.rating < 4).length;
    const lowRatingApproved = approved.filter((t) => t.rating < 4).length;

    const systemItems: string[] = [];
    if (total > 0) {
      systemItems.push(
        `${total} ressenyes rebudes · ${approved.length} aprovades · ${pending.length} pendents`,
      );
      systemItems.push(`Nota mitjana: ${avgRating.toFixed(1)}★`);
    } else {
      systemItems.push('Encara no hi ha ressenyes rebudes');
    }

    const manualItems: string[] = [];
    if (pending.length > 0) {
      manualItems.push(
        `${pending.length} ${pluralize(pending.length, 'ressenya pendent', 'ressenyes pendents')} de moderació`,
      );
    }
    if (stalePending > 0) {
      manualItems.push(
        `${stalePending} ${pluralize(stalePending, 'pendent', 'pendents')} de fa >7 dies`,
      );
    }
    if (lowRatingPending > 0) {
      manualItems.push(
        `${lowRatingPending} ${pluralize(lowRatingPending, 'pendent amb <4★', 'pendents amb <4★')}`,
      );
    }
    if (lowRatingApproved > 0) {
      manualItems.push(
        `${lowRatingApproved} ${pluralize(lowRatingApproved, 'aprovada amb <4★ visible', 'aprovades amb <4★ visibles')} al web`,
      );
    }

    const systemTone: 'info' | 'warning' | 'success' =
      total === 0 ? 'info' : avgRating >= 4 ? 'success' : avgRating >= 3 ? 'warning' : 'warning';

    const manualTone: 'info' | 'warning' | 'success' =
      stalePending > 0 || lowRatingApproved > 0
        ? 'warning'
        : manualItems.length > 0
          ? 'info'
          : 'success';

    const nextStep =
      total === 0
        ? {
            eyebrow: 'Següent pas · Demanar',
            title: 'Encara no hi ha ressenyes',
            detail:
              'Quan un client completa un event, l\'enquesta post-event demana ressenya pública. Revisa que l\'automatisme estigui actiu.',
            href: '/admin/post-event/surveys',
            ctaLabel: 'Obrir enquestes',
          }
        : pending.length > 0
          ? {
              eyebrow: 'Següent pas · Moderar',
              title: `Moderar ${pending.length} ${pluralize(pending.length, 'ressenya pendent', 'ressenyes pendents')}`,
              detail:
                stalePending > 0
                  ? `${stalePending} ${pluralize(stalePending, 'porta', 'porten')} >7 dies esperant. Aprova o amaga per no bloquejar el testimoniatge al web.`
                  : 'Aprova o amaga cada testimoniatge per poder-lo fer servir com a canvas i social proof al web.',
              href: '#pendents',
              ctaLabel: 'Obrir pendents',
              secondaryAction:
                approved.length > 0 ? { href: '#aprovades', label: 'Veure aprovades' } : undefined,
            }
          : lowRatingApproved > 0
            ? {
                eyebrow: 'Següent pas · Reviu',
                title: `${lowRatingApproved} ${pluralize(lowRatingApproved, 'aprovada amb <4★', 'aprovades amb <4★')} al web`,
                detail:
                  'Considera amagar ressenyes baixes per mantenir la mitjana pública. No elimina la ressenya — només la treu del canal públic.',
                href: '#aprovades',
                ctaLabel: 'Revisar aprovades',
              }
            : {
                eyebrow: 'Següent pas',
                title: 'Moderació al dia',
                detail: `${approved.length} ${pluralize(approved.length, 'ressenya aprovada visible', 'ressenyes aprovades visibles')}. Aprofita per generar canvas Story/Instagram i distribuir social proof.`,
                href: '#aprovades',
                ctaLabel: 'Veure aprovades',
              };

    return {
      system: {
        eyebrow: 'Automàtic · Catàleg',
        title:
          total === 0
            ? 'Sense ressenyes encara'
            : pending.length > 0
              ? 'Moderació pendent'
              : 'Catàleg de social proof',
        tone: systemTone,
        items: systemItems,
        emptyText: 'Sense ressenyes al catàleg.',
      },
      manual: {
        eyebrow: 'Manual · Backlog',
        title:
          manualItems.length === 0
            ? 'Cap senyal manual'
            : `${manualItems.length} ${pluralize(manualItems.length, 'senyal per revisar', 'senyals per revisar')}`,
        tone: manualTone,
        items: manualItems,
        emptyText: 'Sense pendents ni ressenyes baixes visibles.',
      },
      nextStep,
    };
  }, [loading, pending, approved, avgRating]);

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
            value={avgRating > 0 ? `${avgRating.toFixed(1)} â˜…` : 'â€”'}
            tone={avgRating >= 4 ? 'success' : avgRating >= 3 ? 'warning' : 'danger'}
          />
        </AdminKpiRow>
      }
    >
      {strip && (
        <OwnerControlStrip
          system={strip.system}
          manual={strip.manual}
          nextStep={strip.nextStep}
        />
      )}

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

      <div className="grid grid-cols-1 gap-4">
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
      </div>
      <ConfirmDialog {...dialogProps} />
    </AdminPage>
  );
}

