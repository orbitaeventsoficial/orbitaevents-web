'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminPage } from '../components/AdminPage';
import { formatDateTime } from '@/lib/constants';

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


export default function AdminRessenyesPage() {
  const [pending, setPending] = useState<Testimonial[]>([]);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [canvasPreview, setCanvasPreview] = useState<{ id: string; url: string } | null>(null);

  const activeList = useMemo(
    () => (activeTab === 'pending' ? pending : approved),
    [activeTab, pending, approved]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch('/api/admin/testimonials?status=pending', { cache: 'no-store' }),
        fetch('/api/admin/testimonials?status=approved', { cache: 'no-store' }),
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPending(data.testimonials || []);
      }
      if (approvedRes.ok) {
        const data = await approvedRes.json();
        setApproved(data.testimonials || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, action: 'approve' | 'hide' | 'delete') => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setBusyId(null);
    }
  };

  const generateCanvas = (t: Testimonial, preset: string = 'story') => {
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
    const url = `/api/canvas/testimonial?${params.toString()}`;
    setCanvasPreview({ id: t.id, url });
  };

  const downloadCanvas = (t: Testimonial, preset: string = 'story') => {
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
    const url = `/api/canvas/testimonial?${params.toString()}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbita-ressenya-${t.customer.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
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
    >

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
          <div className="rounded-2xl border admin-card-glass p-6">
            No hi ha ressenyes en aquest estat.
          </div>
        )}

        {activeList.map((t) => (
          <div key={t.id} className="rounded-2xl border admin-card-glass p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-base font-semibold">{t.customer.name}</div>
                <div className="text-sm">{t.customer.email}</div>
                <div className="text-xs mt-1">{formatDateTime(t.createdAt)}</div>
              </div>
              <div className="font-bold text-sm">★ {t.rating.toFixed(1)}</div>
            </div>

            <p className="mt-4 whitespace-pre-wrap">&quot;{t.text}&quot;</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {t.isApproved ? (
                <button
                  type="button"
                  onClick={() => updateStatus(t.id, 'hide')}
                  className="admin-reviews-action admin-reviews-action--neutral px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  aria-busy={busyId === t.id}
                >
                  Amagar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateStatus(t.id, 'approve')}
                  className="admin-reviews-action admin-reviews-action--ok px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  aria-busy={busyId === t.id}
                >
                  Aprovar
                </button>
              )}
              <button
                type="button"
                onClick={() => updateStatus(t.id, 'delete')}
                className="admin-reviews-action admin-reviews-action--danger px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                aria-busy={busyId === t.id}
              >
                Eliminar
              </button>
              {t.isApproved && (
                <>
                  <button
                    type="button"
                    onClick={() => generateCanvas(t, 'story')}
                    className="px-4 py-2 rounded-full border border-amber-500/30 text-amber-300 text-sm font-semibold transition-colors hover:bg-amber-500/10"
                  >
                    Canvas Story
                  </button>
                  <button
                    type="button"
                    onClick={() => generateCanvas(t, 'instagram')}
                    className="px-4 py-2 rounded-full border border-amber-500/30 text-amber-300 text-sm font-semibold transition-colors hover:bg-amber-500/10"
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
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-amber-300">Previsualització Canvas</p>
                  <button
                    type="button"
                    onClick={() => setCanvasPreview(null)}
                    className="text-xs hover:underline"
                  >
                    Tancar
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={canvasPreview.url}
                  alt={`Canvas de ${t.customer.name}`}
                  className="max-h-[400px] rounded-xl mx-auto"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminPage>
  );
}
