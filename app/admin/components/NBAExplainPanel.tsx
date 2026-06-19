'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { NextBestAction } from '@/lib/services/nextBestActionService';

type NBAExplainData = {
  explanation: string;
  actions: NextBestAction[];
  generatedAt: string;
};

const URGENCY_CHIP: Record<string, string> = {
  CRITICAL: 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger',
  HIGH: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  MEDIUM: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
  LOW: 'border-white/20 bg-white/5 text-white/55',
};

export default function NBAExplainPanel() {
  const [data, setData] = useState<NBAExplainData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/ai/nba-explain', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: NBAExplainData | null) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && !data?.explanation) return null;

  if (loading) {
    return (
      <div className="ap-card p-4 animate-pulse">
        <div className="mb-3 h-2.5 w-32 rounded bg-white/10" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-4/5 rounded bg-white/[0.06]" />
          <div className="h-3 w-3/5 rounded bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[var(--o-r-md)] border border-[var(--hair-gold)] bg-[var(--panel)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-[family-name:var(--mono)] text-xs font-bold uppercase tracking-[0.16em] text-[var(--gold)]">
          Anàlisi IA · Prioritats d&apos;avui
        </span>
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" />
      </div>
      <p className="text-sm leading-relaxed text-white/85">{data!.explanation}</p>
      {data!.actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {data!.actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 ${URGENCY_CHIP[action.urgency] ?? URGENCY_CHIP.LOW}`}
            >
              <span>{action.icon}</span>
              <span className="max-w-[18ch] truncate">{action.title}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
