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
    <section className="rounded-2xl border backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase">Accions ràpides</p>
          <p className="text-sm mt-1">Operacions freqüents</p>
        </div>
        <Link href="/admin/emails" className="text-xs">
          Obre correus automàtics →
        </Link>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/inbox/compose"
          className="rounded-xl border px-3 py-2 text-xs"
        >
          ✉️ Nou email
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-xl border px-3 py-2 text-xs"
        >
          👥 Veure entrades
        </Link>
        <button
          type="button"
          onClick={runCron}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-xs disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '⏱️ Executar post-event'}
        </button>
        <button
          type="button"
          onClick={runAll}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-xs disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '🚀 Executar-ho tot (1 clic)'}
        </button>
        <button
          type="button"
          onClick={runDailySummaryNow}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-xs disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '📊 Resum diari ara'}
        </button>
      </div>

      {summary && (
        <div className="mt-3 rounded-xl border px-3 py-2 text-xs">
          Cron OK · Enviats {summary.sent} · Errors {summary.errors}
        </div>
      )}
      {runAllSummary && (
        <div className="mt-3 rounded-xl border px-3 py-2 text-xs">
          Tot OK · Seqüències {runAllSummary.sequences.executed} (correu {runAllSummary.sequences.sentEmail}, WA {runAllSummary.sequences.sentWhatsapp}) ·
          {' '}Tasques 24h {runAllSummary.sla.createdTasks}
        </div>
      )}
      {dailySummary && (
        <div className="mt-3 rounded-xl border px-3 py-2 text-xs">
          Resum enviat · Seqüències {dailySummary.sequences.executed} · Tasques 24h {dailySummary.sla.createdTasks} ·
          {' '}Resposta 24h {(dailySummary.kpi24h.responseRate * 100).toFixed(1)}%
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-xl border px-3 py-2 text-xs">
          {error}
        </div>
      )}
    </section>
  );
}
