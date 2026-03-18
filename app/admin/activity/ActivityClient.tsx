'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../components/ToastProvider';
import { formatDateTimeFull } from '@/lib/constants';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  category: string;
  createdAt: string;
}

interface CategoryStats {
  total: number;
  actions: Record<string, number>;
}

interface ActivityResponse {
  logs: ActivityLog[];
  total: number;
  stats: Record<string, CategoryStats>;
  page: number;
  pages: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'Tot', icon: '📊' },
  { id: 'comms', label: 'Comunicacions', icon: '✉️' },
  { id: 'automation', label: 'Automatitzacions', icon: '⚡' },
  { id: 'system', label: 'Sistema', icon: '🔄' },
  { id: 'crud', label: 'Operacions', icon: '📝' },
] as const;

const DAYS_OPTIONS = [
  { value: 1, label: 'Avui' },
  { value: 7, label: '7 dies' },
  { value: 30, label: '30 dies' },
  { value: 90, label: '90 dies' },
] as const;

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  COMM_SENT: { label: 'Email enviat', icon: '📤', color: 'text-cyan-300' },
  COMM_RESPONDED: { label: 'Resposta rebuda', icon: '📩', color: 'text-emerald-300' },
  COMM_SEQUENCE_EXEC: { label: 'Seqüència comercial', icon: '🔗', color: 'text-cyan-300' },
  COMM_SEQUENCE_BATCH: { label: 'Batch seqüències', icon: '📦', color: 'text-cyan-300' },
  SEND_POST_EVENT_EMAIL: { label: 'Email post-event', icon: '🎉', color: 'text-purple-300' },
  PAYMENT_REMINDER_SENT: { label: 'Recordatori pagament', icon: '💰', color: 'text-amber-300' },
  AUTOMATION_DAILY_SUMMARY_SENT: { label: 'Resum diari', icon: '📋', color: 'text-blue-300' },
  AUTOMATION_SLA_ENFORCED: { label: 'SLA aplicat', icon: '⏱️', color: 'text-rose-300' },
  AUTOMATION_RUN_ALL: { label: 'Automatització completa', icon: '🤖', color: 'text-blue-300' },
  AUTOMATION_FUEL_REFRESH: { label: 'Preu combustible', icon: '⛽', color: 'text-amber-300' },
  PACK_PRICING_CHECK: { label: 'Check preus packs', icon: '💶', color: 'text-emerald-300' },
  AUTOFIX_OK: { label: 'Autofix OK', icon: '✅', color: 'text-emerald-300' },
  AUTOFIX_FAILED: { label: 'Autofix fallat', icon: '⚠️', color: 'text-amber-300' },
  AUTOFIX_CRASH: { label: 'Autofix crash', icon: '💥', color: 'text-rose-300' },
  CALENDAR_SYNC: { label: 'Sync calendari', icon: '📅', color: 'text-blue-300' },
  CALENDAR_SYNC_ERROR: { label: 'Error sync calendari', icon: '❌', color: 'text-rose-300' },
  PORTAL_AUTO_CREATED: { label: 'Portal client creat', icon: '🔑', color: 'text-purple-300' },
  CREATE: { label: 'Creat', icon: '➕', color: 'text-emerald-300' },
  UPDATE: { label: 'Actualitzat', icon: '✏️', color: 'text-cyan-300' },
  DELETE: { label: 'Eliminat', icon: '🗑️', color: 'text-rose-300' },
};

const ENTITY_LINKS: Record<string, (id: string) => string> = {
  booking: (id) => `/admin/bookings/${id}`,
  lead: (id) => `/admin/leads/${id}`,
  pack: (id) => `/admin/packs/${id}`,
  customer: (id) => `/admin/clientes/${id}`,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ara';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getActionMeta(action: string) {
  return ACTION_LABELS[action] || { label: action, icon: '•', color: 'text-white/70' };
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return '';
  const parts: string[] = [];
  if (details.flow) parts.push(`flux: ${details.flow}`);
  if (details.channel) parts.push(`canal: ${details.channel}`);
  if (details.to) parts.push(`a: ${details.to}`);
  if (details.email) parts.push(`email: ${details.email}`);
  if (details.reference) parts.push(`ref: ${details.reference}`);
  if (details.pendingAmount) parts.push(`pendent: ${details.pendingAmount}€`);
  if (details.locale) parts.push(`idioma: ${details.locale}`);
  if (details.action) parts.push(`${details.action}`);
  if (parts.length === 0) {
    // Fallback: show first 3 keys
    return Object.entries(details)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' · ');
  }
  return parts.join(' · ');
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ActivityClient() {
  const toast = useToast();
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [days, setDays] = useState(7);
  const [page, setPage] = useState(1);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category,
        days: String(days),
        page: String(page),
        limit: '50',
      });
      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error('Error carregant activitat');
      const json: ActivityResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error('Activity fetch error:', err);
      toast.error(err instanceof Error ? err.message : 'Error carregant activitat');
    } finally {
      setLoading(false);
    }
  }, [category, days, page, toast]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [category, days]);

  // ─── Stats cards ──────────────────────────────────────────────────────────

  const statsCards = data?.stats ? (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {[
        { key: 'comms', label: 'Comunicacions', icon: '✉️', accent: 'cyan' },
        { key: 'automation', label: 'Automatitzacions', icon: '⚡', accent: 'amber' },
        { key: 'system', label: 'Sistema', icon: '🔄', accent: 'blue' },
        { key: 'crud', label: 'Operacions', icon: '📝', accent: 'emerald' },
      ].map(({ key, label, icon, accent }) => {
        const cat = data.stats[key];
        const total = cat?.total || 0;
        const topActions = cat
          ? Object.entries(cat.actions)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
          : [];

        return (
          <button
            key={key}
            onClick={() => setCategory(category === key ? 'all' : key)}
            className={`rounded-2xl border p-4 text-left transition-all admin-card-glass ${
              category === key
                ? `border-${accent}-500/40 bg-${accent}-500/10`
                : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-white/50">
                {icon} {label}
              </span>
              <span className={`text-xl font-bold ${total > 0 ? `text-${accent}-300` : 'text-white/30'}`}>
                {total}
              </span>
            </div>
            <div className="space-y-0.5">
              {topActions.map(([action, count]) => (
                <div key={action} className="flex items-center justify-between text-xs text-white/40">
                  <span>{getActionMeta(action).label}</span>
                  <span>{count}</span>
                </div>
              ))}
              {topActions.length === 0 && (
                <div className="text-xs text-white/20">Cap activitat</div>
              )}
            </div>
          </button>
        );
      })}
    </section>
  ) : null;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                category === cat.id
                  ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-200'
                  : 'border-white/10 text-white/50 hover:text-white/70 hover:border-white/20'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Days selector */}
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            aria-label="Període de temps"
          >
            {DAYS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchActivity}
            className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/70 hover:border-white/20 transition-colors"
            aria-label="Refrescar"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && statsCards}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center text-sm text-white/50" role="status">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregant activitat...
        </div>
      )}

      {/* Activity feed */}
      {!loading && data && (
        <>
          <div className="text-xs text-white/40 mb-2">
            {data.total} accions en {days === 1 ? 'les últimes 24h' : `els últims ${days} dies`}
            {data.pages > 1 && ` · Pàg. ${data.page}/${data.pages}`}
          </div>

          {/* Mobile card view */}
          <section className="lg:hidden space-y-3" aria-label="Registre d'activitat del sistema">
            {data.logs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center text-white/30">
                Cap activitat en aquest període
              </div>
            ) : (
              data.logs.map((log) => {
                const meta = getActionMeta(log.action);
                const entityLink =
                  log.entityId && ENTITY_LINKS[log.entity]
                    ? ENTITY_LINKS[log.entity](log.entityId)
                    : null;
                const detailsText = formatDetails(log.details);

                return (
                  <article
                    key={log.id}
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className={`${meta.color} font-medium text-sm`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span
                        className="text-xs text-white/40 whitespace-nowrap"
                        title={formatDateTimeFull(log.createdAt)}
                      >
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>

                    {log.entity && (
                      <div className="text-sm text-white/60 mb-1">
                        {entityLink ? (
                          <Link
                            href={entityLink}
                            className="hover:text-cyan-300 underline decoration-white/20 hover:decoration-cyan-300/50 transition-colors"
                          >
                            {log.entity}
                            {log.entityId && (
                              <span className="text-white/30 ml-1 text-xs">
                                {log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <span>
                            {log.entity}
                            {log.entityId && (
                              <span className="text-white/30 ml-1 text-xs">
                                {log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {detailsText && (
                      <p className="text-xs text-white/40 line-clamp-2 mt-1">
                        {detailsText}
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </section>

          {/* Desktop table view */}
          <section className="hidden lg:block rounded-2xl border admin-card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm" aria-label="Registre d'activitat del sistema">
                <thead className="border-b border-white/10">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-white/60 w-16">Quan</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-white/60">Acció</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-white/60">Entitat</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-white/60">Detalls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-white/30">
                        Cap activitat en aquest període
                      </td>
                    </tr>
                  ) : (
                    data.logs.map((log) => {
                      const meta = getActionMeta(log.action);
                      const entityLink =
                        log.entityId && ENTITY_LINKS[log.entity]
                          ? ENTITY_LINKS[log.entity](log.entityId)
                          : null;

                      return (
                        <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3 text-white/40 whitespace-nowrap" title={formatDateTimeFull(log.createdAt)}>
                            {formatTimeAgo(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`${meta.color} font-medium`}>
                              {meta.icon} {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/60">
                            {entityLink ? (
                              <Link href={entityLink} className="hover:text-cyan-300 underline decoration-white/20 hover:decoration-cyan-300/50 transition-colors">
                                {log.entity}
                                {log.entityId && <span className="text-white/30 ml-1 text-xs">{log.entityId.slice(0, 8)}</span>}
                              </Link>
                            ) : (
                              <span>
                                {log.entity}
                                {log.entityId && <span className="text-white/30 ml-1 text-xs">{log.entityId.slice(0, 8)}</span>}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs max-w-xs truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                            {formatDetails(log.details)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-xs text-white/40">
                {data.page} / {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Següent →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
