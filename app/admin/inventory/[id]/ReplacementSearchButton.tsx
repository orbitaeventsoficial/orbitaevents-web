'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatCurrencyExact } from '@/lib/constants';
import { PREFERRED_REPLACEMENT_SOURCES } from '@/lib/constants/inventory';

interface Candidate {
  title: string;
  price: number | null;
  priceLabel: string | null;
  source: string | null;
  link: string | null;
  thumbnail: string | null;
}

const isPreferred = (source: string | null) =>
  PREFERRED_REPLACEMENT_SOURCES.some((s) => (source ?? '').toLowerCase().includes(s));

export default function ReplacementSearchButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cheapest, setCheapest] = useState<number | null>(null);
  const [savingLink, setSavingLink] = useState<string | null>(null);

  async function runSearch() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/inventory/${itemId}/replacement-search`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error de cerca');
      setCandidates(data.candidates ?? []);
      setCheapest(data.cheapestPrice ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de cerca');
    } finally {
      setLoading(false);
    }
  }

  async function handleUseAsReplacement(link: string | null) {
    if (!link) return;
    setSavingLink(link);
    try {
      const res = await fetchWithCsrf(`/api/admin/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseUrl: link }),
      });
      if (!res.ok) throw new Error('Error desant');
      router.refresh();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desant');
    } finally {
      setSavingLink(null);
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={runSearch} className="ap-btn ap-btn--xs" disabled={loading}>
        {loading ? 'Cercant…' : '🔍 Buscar reposició'}
      </button>

      {open && (
        <div className="space-y-2">
          {error && <p className="text-xs admin-tone-text-danger">{error}</p>}
          {!loading && !error && candidates.length === 0 && (
            <p className="text-xs text-[var(--t3)]">Sense candidats.</p>
          )}
          {candidates.map((c, i) => {
            const preferred = isPreferred(c.source);
            const isCheapest = c.price != null && c.price === cheapest;
            return (
              <div key={i} className="ap-card flex items-center gap-3 p-3">
                {c.thumbnail && (
                  <Image src={c.thumbnail} alt="" width={48} height={48} unoptimized className="h-12 w-12 shrink-0 rounded-[var(--o-r-sm-2)] object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {preferred && (
                      <span className="ap-badge ap-badge--success">DJ Mania 🥇</span>
                    )}
                    {isCheapest && (
                      <span className="inline-flex items-center rounded-full border admin-tone-border-cyan admin-tone-bg-cyan px-2 py-0.5 text-2xs font-semibold admin-tone-text-cyan">Més barat</span>
                    )}
                    <span className="truncate text-xs text-[var(--t2)]">{c.source ?? '?'}</span>
                  </div>
                  <p className="truncate text-xs text-[var(--t)]">{c.title}</p>
                  <p className="text-sm font-semibold text-[var(--t)]">{c.price != null ? formatCurrencyExact(c.price) : (c.priceLabel ?? '—')}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {c.link && (
                    <a href={c.link} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--xs">Comprar ↗</a>
                  )}
                  {c.link && (
                    <button type="button" onClick={() => handleUseAsReplacement(c.link)} className="ap-btn ap-btn--xs ap-btn--primary" disabled={savingLink === c.link}>
                      {savingLink === c.link ? 'Desant…' : 'Usar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
