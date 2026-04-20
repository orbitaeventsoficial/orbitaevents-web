'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { PipelineSuggestion } from '@/lib/services/leadPipelineSuggestionsService';

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: 'border-rose-500/30 bg-rose-500/[0.06]',
  HIGH: 'border-amber-500/30 bg-amber-500/[0.04]',
  MEDIUM: 'border-cyan-500/20 bg-cyan-500/[0.03]',
  INFO: 'border-emerald-500/20 bg-emerald-500/[0.03]',
};

export default function PipelineSuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<PipelineSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads/suggestions');
      if (!res.ok) return;
      const json = await res.json();
      setSuggestions(json.suggestions || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="admin-card-glass rounded-xl border border-white/10 p-4 mb-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider opacity-60">Suggeriments del pipeline</p>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <Link
            key={s.type}
            href={s.href}
            className={`admin-stagger-item flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-white/[0.03] ${PRIORITY_STYLE[s.priority] || ''}`}
          >
            <span className="shrink-0 text-lg">{s.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{s.title}</p>
              <p className="mt-0.5 text-[11px] opacity-50 line-clamp-2">{s.detail}</p>
            </div>
            {s.count > 0 && (
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
                {s.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
