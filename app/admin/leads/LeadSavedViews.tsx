'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      const res = await fetch('/api/admin/leads/views', {
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
      const res = await fetch(`/api/admin/leads/views?id=${encodeURIComponent(id)}`, {
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
    <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-400">Vistes guardades</p>
          <p className="text-xs text-slate-500">Guarda filtres habituals</p>
        </div>
        <button
          type="button"
          onClick={loadViews}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          🔄 Refrescar
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom de la vista"
          className="flex-1 rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={saveView}
          disabled={!name.trim() || !currentQuery || loading}
          className="rounded-xl bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
        >
          Desar
        </button>
      </div>

      {error && (
        <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {loading && views.length === 0 && (
          <p className="text-xs text-slate-400">Carregant...</p>
        )}
        {!loading && views.length === 0 && (
          <p className="text-xs text-slate-500">Encara no hi ha vistes.</p>
        )}
        {views.map((view) => (
          <div key={view.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-xs text-slate-200">
            <Link href={`/admin/leads?${view.query}`} className="truncate hover:text-cyan-200">
              {view.name}
            </Link>
            <button
              type="button"
              onClick={() => deleteView(view.id)}
              className="text-slate-500 hover:text-rose-300"
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

