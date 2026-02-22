'use client';

import { useEffect, useMemo, useState } from 'react';

type Testimonial = {
  id: string;
  text: string;
  rating: number;
  createdAt: string;
  isApproved: boolean;
  customer: {
    name: string;
    email: string;
  };
};

type StatusTab = 'pending' | 'approved';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ca-ES');
  } catch {
    return value;
  }
}

export default function AdminRessenyesPage() {
  const [pending, setPending] = useState<Testimonial[]>([]);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="">Carregant ressenyes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ressenyes</h1>
        <p className="text-sm">Aprova o amaga opinions rebudes del web.</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            activeTab === 'pending'
              ? ''
              : ''
          }`}
        >
          Pendents ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            activeTab === 'approved'
              ? ''
              : ''
          }`}
        >
          Aprovades ({approved.length})
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeList.length === 0 && (
          <div className="rounded-2xl border backdrop-blur-sm p-6">
            No hi ha ressenyes en aquest estat.
          </div>
        )}

        {activeList.map((t) => (
          <div key={t.id} className="rounded-2xl border backdrop-blur-sm p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-base font-semibold">{t.customer.name}</div>
                <div className="text-sm">{t.customer.email}</div>
                <div className="text-xs mt-1">{formatDate(t.createdAt)}</div>
              </div>
              <div className="font-bold text-sm">★ {t.rating.toFixed(1)}</div>
            </div>

            <p className="mt-4 whitespace-pre-wrap">&quot;{t.text}&quot;</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {t.isApproved ? (
                <button
                  type="button"
                  onClick={() => updateStatus(t.id, 'hide')}
                  className="px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  aria-busy={busyId === t.id}
                >
                  Amagar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updateStatus(t.id, 'approve')}
                  className="px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                  aria-busy={busyId === t.id}
                >
                  Aprovar
                </button>
              )}
              <button
                type="button"
                onClick={() => updateStatus(t.id, 'delete')}
                className="px-4 py-2 rounded-full border text-sm font-semibold transition-colors"
                aria-busy={busyId === t.id}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
