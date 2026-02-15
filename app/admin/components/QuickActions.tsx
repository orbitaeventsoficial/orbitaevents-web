'use client';

import { useState } from 'react';
import Link from 'next/link';

type CronSummary = {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

type RunAllSummary = {
  sequences: {
    executed: number;
    sentEmail: number;
    sentWhatsapp: number;
    errors: number;
  };
  sla: {
    createdTasks: number;
    escalatedPriority: number;
  };
};

type DailySummary = {
  sequences: { executed: number; sentEmail: number; sentWhatsapp: number };
  sla: { createdTasks: number };
  kpi24h: { commSent: number; commResponded: number; responseRate: number };
};

export default function QuickActions() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<CronSummary | null>(null);
  const [runAllSummary, setRunAllSummary] = useState<RunAllSummary | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCron() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setRunAllSummary(null);
    setDailySummary(null);
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

  async function runAll() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setRunAllSummary(null);
    setDailySummary(null);
    try {
      const res = await fetch('/api/admin/automation/run-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error executant automatitzacions');
      }
      setRunAllSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error executant automatitzacions');
    } finally {
      setLoading(false);
    }
  }

  async function runDailySummaryNow() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setRunAllSummary(null);
    setDailySummary(null);
    try {
      const res = await fetch('/api/admin/automation/daily-summary/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error executant resum diari');
      }
      setDailySummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error executant resum diari');
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
          Obre correus automàtics →
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
          👥 Veure entrades
        </Link>
        <button
          type="button"
          onClick={runCron}
          disabled={loading}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '⏱️ Executar post-event'}
        </button>
        <button
          type="button"
          onClick={runAll}
          disabled={loading}
          className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '🚀 Executar-ho tot (1 clic)'}
        </button>
        <button
          type="button"
          onClick={runDailySummaryNow}
          disabled={loading}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '📊 Resum diari ara'}
        </button>
      </div>

      {summary && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          Cron OK · Enviats {summary.sent} · Errors {summary.errors}
        </div>
      )}
      {runAllSummary && (
        <div className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200">
          Tot OK · Seqüències {runAllSummary.sequences.executed} (correu {runAllSummary.sequences.sentEmail}, WA {runAllSummary.sequences.sentWhatsapp}) ·
          {' '}Tasques SLA {runAllSummary.sla.createdTasks}
        </div>
      )}
      {dailySummary && (
        <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
          Resum enviat · Seqüències {dailySummary.sequences.executed} · SLA {dailySummary.sla.createdTasks} ·
          {' '}Resposta 24h {(dailySummary.kpi24h.responseRate * 100).toFixed(1)}%
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
