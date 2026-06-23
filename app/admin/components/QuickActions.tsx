'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_SHARED_HELP, helpAttrs } from './adminHelpContent';

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
      const res = await fetchWithCsrf('/api/admin/emails/run-cron', {
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
    setSummary(null);
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
    <section className="admin-cr-panel admin-cr-quick-actions" {...helpAttrs(ADMIN_SHARED_HELP.quickActionsPanel)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase">Accions ràpides</p>
          <p className="text-sm mt-1">Operacions freqüents</p>
        </div>
        <Link href="/admin/emails" className="text-xs transition-colors" {...helpAttrs(ADMIN_SHARED_HELP.openAutomations)}>
          Obre correus automàtics →
        </Link>
      </div>

      <div className="admin-cr-action-grid">
        <Link href="/admin/inbox/compose" className="admin-cr-command-button" {...helpAttrs(ADMIN_SHARED_HELP.composeEmail)}>
          Nou email
        </Link>
        <Link href="/admin/leads" className="admin-cr-command-button" {...helpAttrs(ADMIN_SHARED_HELP.viewLeads)}>
          Veure entrades
        </Link>
        <button type="button" onClick={runCron} disabled={loading} className="admin-cr-command-button disabled:opacity-60" {...helpAttrs(ADMIN_SHARED_HELP.runPostEvent)}>
          {loading ? 'Executant...' : 'Executar post-event'}
        </button>
        <button type="button" onClick={runAll} disabled={loading} className="admin-cr-command-button disabled:opacity-60" {...helpAttrs(ADMIN_SHARED_HELP.runAll)}>
          {loading ? 'Executant...' : 'Executar-ho tot'}
        </button>
        <button type="button" onClick={runDailySummaryNow} disabled={loading} className="admin-cr-command-button disabled:opacity-60" {...helpAttrs(ADMIN_SHARED_HELP.runDailySummary)}>
          {loading ? 'Executant...' : 'Resum diari ara'}
        </button>
      </div>

      {summary && (
        <div className="admin-cr-command-result">
          Cron OK · Enviats {summary.sent} · Errors {summary.errors}
        </div>
      )}
      {runAllSummary && (
        <div className="admin-cr-command-result">
          Tot OK · Seqüències {runAllSummary.sequences.executed} (correu {runAllSummary.sequences.sentEmail}, WA {runAllSummary.sequences.sentWhatsapp}) ·
          {' '}Tasques 24h {runAllSummary.sla.createdTasks}
        </div>
      )}
      {dailySummary && (
        <div className="admin-cr-command-result">
          Resum enviat · Seqüències {dailySummary.sequences.executed} · Tasques 24h {dailySummary.sla.createdTasks} ·
          {' '}Resposta 24h {(dailySummary.kpi24h.responseRate * 100).toFixed(1)}%
        </div>
      )}
      {error && (
        <div className="admin-cr-command-result">
          {error}
        </div>
      )}
    </section>
  );
}
