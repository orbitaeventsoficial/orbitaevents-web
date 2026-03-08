'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';

type SavedView = {
  id: string;
  name: string;
  query: string;
  createdAt: string;
};

export default function LeadSavedViews({ currentQuery }: { currentQuery: string }) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadViews() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/leads/views', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error carregant vistes');
      }
      setViews(data.views || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error carregant vistes');
    } finally {
      setLoading(false);
    }
  }

  async function saveView() {
    if (!name.trim() || !currentQuery) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/leads/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, query: currentQuery }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error guardant vista');
      }
      setName('');
      setViews((prev) => [data.view, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardant vista');
    } finally {
      setLoading(false);
    }
  }

  async function deleteView(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/views?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error esborrant vista');
      }
      setViews((prev) => prev.filter((view) => view.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error esborrant vista');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadViews();
  }, []);

  return (
    <section className="rounded-2xl border admin-card-glass p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase">Vistes guardades</p>
          <p className="text-xs">Guarda filtres habituals</p>
        </div>
        <button
          type="button"
          onClick={loadViews}
          className="text-xs"
        >
          🔄 Refrescar
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom de la vista"
          className="flex-1 rounded-xl border px-3 py-2 text-xs focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
        />
        <button
          type="button"
          onClick={saveView}
          disabled={!name.trim() || !currentQuery || loading}
          className="rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-50"
        >
          Desar
        </button>
      </div>

      {error && (
        <div className="mt-2 rounded-xl border px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {loading && views.length === 0 && (
          <p className="text-xs">Carregant...</p>
        )}
        {!loading && views.length === 0 && (
          <p className="text-xs">Encara no hi ha vistes.</p>
        )}
        {views.map((view) => (
          <div key={view.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs">
            <Link href={`/admin/leads?${view.query}`} className="truncate">
              {view.name}
            </Link>
            <button
              type="button"
              onClick={() => deleteView(view.id)}
              className=""
              aria-label={`Eliminar ${view.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

