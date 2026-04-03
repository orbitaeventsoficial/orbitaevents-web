'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fetchWithCsrf } from '@/lib/csrf';

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
    <section
      className="rounded-2xl border admin-card-glass p-4"
      data-help-title="Accions ràpides"
      data-help-desc="Des d'aquí pots executar accions freqüents sense canviar de secció: escriure, revisar entrades o llançar automatismes puntuals."
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase">Accions ràpides</p>
          <p className="text-sm mt-1">Operacions freqüents</p>
        </div>
        <Link
          href="/admin/emails"
          className="text-xs transition-colors"
          data-help-title="Obrir correus automàtics"
          data-help-desc="T'envia a la secció on controles automatismes, plantilles i seguiment dels correus del sistema."
        >
          Obre correus automàtics →
        </Link>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/inbox/compose"
          className="rounded-xl border px-3 py-2 text-xs"
          data-help-title="Nou email"
          data-help-desc="Obre el redactor per enviar un correu manual des de la safata administrativa."
        >
          ✉️ Nou email
        </Link>
        <Link
          href="/admin/leads"
          className="rounded-xl border px-3 py-2 text-xs"
          data-help-title="Veure entrades"
          data-help-desc="Et porta al tauler comercial per revisar consultes i oportunitats en curs."
        >
          👥 Veure entrades
        </Link>
        <button
          type="button"
          onClick={runCron}
          disabled={loading}
          data-help-title="Executar post-event"
          data-help-desc="Llança manualment el flux automàtic de correus post-esdeveniment si no vols esperar el cron programat."
          className="rounded-xl border px-3 py-2 text-xs disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '⏱️ Executar post-event'}
        </button>
        <button
          type="button"
          onClick={runAll}
          disabled={loading}
          data-help-title="Executar-ho tot"
          data-help-desc="Dispara els principals automatismes de seguiment i SLA en una sola acció."
          className="rounded-xl border px-3 py-2 text-xs disabled:opacity-60"
        >
          {loading ? '⏳ Executant...' : '🚀 Executar-ho tot (1 clic)'}
        </button>
        <button
          type="button"
          onClick={runDailySummaryNow}
          disabled={loading}
          data-help-title="Resum diari ara"
          data-help-desc="Força l'enviament del resum diari amb mètriques i activitat sense esperar l'execució programada."
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
