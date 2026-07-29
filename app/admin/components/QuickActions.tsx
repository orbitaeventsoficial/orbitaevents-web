'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_SHARED_HELP, helpAttrs } from './adminHelpContent';

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
  const [runAllSummary, setRunAllSummary] = useState<RunAllSummary | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAll() {
    setLoading(true);
    setError(null);
    setRunAllSummary(null);
    setDailySummary(null);
    try {
      const res = await fetchWithCsrf('/api/admin/automation/run-all', {
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
    setRunAllSummary(null);
    setDailySummary(null);
    try {
      const res = await fetchWithCsrf('/api/admin/automation/daily-summary/run', {
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
    <section className="ap-card p-4 space-y-3" {...helpAttrs(ADMIN_SHARED_HELP.quickActionsPanel)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase">Accions ràpides</p>
          <p className="text-sm mt-1">Operacions freqüents</p>
        </div>
        <Link href="/admin/emails" className="text-xs transition-colors" {...helpAttrs(ADMIN_SHARED_HELP.openAutomations)}>
          Obre correus automàtics →
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/admin/inbox/compose" className="ap-btn ap-btn--secondary w-full" {...helpAttrs(ADMIN_SHARED_HELP.composeEmail)}>
          Nou email
        </Link>
        <Link href="/admin/leads" className="ap-btn ap-btn--secondary w-full" {...helpAttrs(ADMIN_SHARED_HELP.viewLeads)}>
          Veure entrades
        </Link>
        <Link
          href="/admin/post-event"
          className="ap-btn ap-btn--secondary w-full"
          {...helpAttrs(ADMIN_SHARED_HELP.runPostEvent)}
        >
          Revisar post-event
        </Link>
        <button type="button" onClick={runAll} disabled={loading} className="ap-btn ap-btn--secondary w-full" {...helpAttrs(ADMIN_SHARED_HELP.runAll)}>
          {loading ? 'Executant...' : 'Executar-ho tot'}
        </button>
        <button type="button" onClick={runDailySummaryNow} disabled={loading} className="ap-btn ap-btn--secondary w-full" {...helpAttrs(ADMIN_SHARED_HELP.runDailySummary)}>
          {loading ? 'Executant...' : 'Resum diari ara'}
        </button>
      </div>

      {runAllSummary && (
        <div className="ap-card p-2.5 text-xs text-[var(--t2)]">
          Tot OK · Seqüències {runAllSummary.sequences.executed} (correu {runAllSummary.sequences.sentEmail}, WA {runAllSummary.sequences.sentWhatsapp}) ·
          {' '}Tasques 24h {runAllSummary.sla.createdTasks}
        </div>
      )}
      {dailySummary && (
        <div className="ap-card p-2.5 text-xs text-[var(--t2)]">
          Resum enviat · Seqüències {dailySummary.sequences.executed} · Tasques 24h {dailySummary.sla.createdTasks} ·
          {' '}Resposta 24h {(dailySummary.kpi24h.responseRate * 100).toFixed(1)}%
        </div>
      )}
      {error && (
        <div className="ap-card p-2.5 text-xs text-[var(--t2)]">
          {error}
        </div>
      )}
    </section>
  );
}
