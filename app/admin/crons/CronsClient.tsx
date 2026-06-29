'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../components/ToastProvider';
import { formatDateTimeFull } from '@/lib/constants';
import { ADMIN_CRON_HEALTH_CONFIG } from '@/lib/constants/admin';

interface CronInfo {
  id: string;
  label: string;
  frequency: string;
  lastRun: string | null;
  lastStatus: string | null;
  lastSummary: Record<string, unknown> | null;
  lastMessage: string | null;
  health: 'ok' | 'warning' | 'error' | 'unknown';
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ara mateix';
  if (minutes < 60) return `Fa ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Fa ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Fa ${days}d`;
}

function formatSummary(summary: Record<string, unknown> | null): string[] {
  if (!summary) return [];
  return Object.entries(summary).map(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
    return `${label}: ${value}`;
  });
}

export default function CronsClient() {
  const toast = useToast();
  const [crons, setCrons] = useState<CronInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCrons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crons');
      if (!res.ok) throw new Error('Error carregant crons');
      const data = await res.json();
      setCrons(data.crons || []);
    } catch (err) {
      console.error('Error carregant llista de crons', err);
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCrons();
  }, [fetchCrons]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm" role="status">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregant estat dels crons...
      </div>
    );
  }

  const healthCounts = {
    ok: crons.filter((c) => c.health === 'ok').length,
    warning: crons.filter((c) => c.health === 'warning').length,
    error: crons.filter((c) => c.health === 'error').length,
    unknown: crons.filter((c) => c.health === 'unknown').length,
  };

  return (
    <div className="space-y-4">

      {/* Resum */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-xs sm:text-xs uppercase tracking-wide text-[var(--t3)]">Correctes</div>
          <div className="text-2xl sm:text-3xl font-bold">{healthCounts.ok}</div>
        </div>
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-xs sm:text-xs uppercase tracking-wide text-[var(--t3)]">Retardats</div>
          <div className="text-2xl sm:text-3xl font-bold">{healthCounts.warning}</div>
        </div>
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-xs sm:text-xs uppercase tracking-wide text-[var(--t3)]">Errors</div>
          <div className="text-2xl sm:text-3xl font-bold">{healthCounts.error}</div>
        </div>
        <div className="rounded-2xl border p-3 sm:p-4">
          <div className="text-xs sm:text-xs uppercase tracking-wide text-[var(--t3)]">Mai executat</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--t3)]">{healthCounts.unknown}</div>
        </div>
      </div>

      {/* Llista de crons */}
      <div className="space-y-2">
        {crons.map((cron) => {
          const config = ADMIN_CRON_HEALTH_CONFIG[cron.health];
          const isExpanded = expandedId === cron.id;
          const summaryLines = formatSummary(cron.lastSummary);

          return (
            <button
              key={cron.id}
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : cron.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${config.bg}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-3 w-3 rounded-full flex-shrink-0 ${config.dot}`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {cron.label}
                    </div>
                    <div className="text-xs text-[var(--t3)]">
                      {cron.frequency}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-medium">
                      {config.label}
                    </div>
                    <div className="text-xs text-[var(--t3)]">
                      {cron.lastRun ? formatTimeAgo(cron.lastRun) : 'Mai'}
                    </div>
                  </div>
                  <span className={`text-[var(--t3)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[var(--line)] text-sm space-y-2" onClick={(e) => e.stopPropagation()}>
                  {cron.lastRun && (
                    <div className="flex gap-2">
                      <span className="text-[var(--t3)] w-24 flex-shrink-0">Últim run:</span>
                      <span>{formatDateTimeFull(cron.lastRun)}</span>
                    </div>
                  )}
                  {cron.lastStatus && (
                    <div className="flex gap-2">
                      <span className="text-[var(--t3)] w-24 flex-shrink-0">Estat:</span>
                      <span className={cron.lastStatus === 'ok' ? 'admin-tone-text-success' : 'admin-tone-text-danger'}>
                        {cron.lastStatus.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {cron.lastMessage && (
                    <div className="flex gap-2">
                      <span className="text-[var(--t3)] w-24 flex-shrink-0">Missatge:</span>
                      <span className="">{cron.lastMessage}</span>
                    </div>
                  )}
                  {summaryLines.length > 0 && (
                    <div>
                      <span className="text-[var(--t3)] text-xs">Resum:</span>
                      <div className="mt-1 grid gap-1 sm:grid-cols-2">
                        {summaryLines.map((line) => (
                          <div key={line} className="rounded-xl bg-[var(--raised)] px-2.5 py-1.5 text-xs">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Botó actualitzar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setLoading(true); fetchCrons(); }}
          className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:bg-[var(--raised)] active:scale-[0.98]"
        >
          Actualitzar
        </button>
      </div>
    </div>
  );
}


