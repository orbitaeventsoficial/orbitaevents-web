'use client';

import { useState } from 'react';
import Link from 'next/link';

type CronSummary = {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

export default function QuickActions() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<CronSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCron() {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch('/api/admin/emails/run-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error executant cron');
      }
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error executant cron');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-slate-400">Accions ràpides</p>
          <p className="text-sm text-slate-200 mt-1">Operacions freqüents</p>
        </div>
        <Link href="/admin/emails" className="text-xs text-cyan-300 hover:text-cyan-200">
          Obre Emails Auto →
        </Link>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/inbox/compose"
          className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200"
        >
          ✉️ Nou email
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/40 hover:text-cyan-200"
        >
          👥 Veure leads
        </Link>
        <button
          type="button"
          onClick={runCron}
          disabled={loading}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '⏱️ Executar post-event'}
        </button>
      </div>

      {summary && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          Cron OK · Enviats {summary.sent} · Errors {summary.errors}
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}
    </section>
  );
}
