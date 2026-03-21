'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ACTIVITY_CATEGORY_OPTIONS, ACTIVITY_DAYS_OPTIONS, formatDateTimeFull } from '@/lib/constants';
import { useToast } from '../components/ToastProvider';

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

const ACTION_LABELS: Record<string, { label: string; icon: string; tone: string }> = {
  COMM_SENT: { label: 'Email enviat', icon: '📤', tone: 'admin-tone-text-info' },
  COMM_RESPONDED: { label: 'Resposta rebuda', icon: '📩', tone: 'admin-tone-text-success' },
  COMM_SEQUENCE_EXEC: { label: 'Seqüència comercial', icon: '🔗', tone: 'admin-tone-text-info' },
  COMM_SEQUENCE_BATCH: { label: 'Batch seqüències', icon: '📦', tone: 'admin-tone-text-info' },
  SEND_POST_EVENT_EMAIL: { label: 'Email post-event', icon: '🎉', tone: 'admin-tone-text-violet' },
  PAYMENT_REMINDER_SENT: { label: 'Recordatori pagament', icon: '💰', tone: 'admin-tone-text-warning' },
  AUTOMATION_DAILY_SUMMARY_SENT: { label: 'Resum diari', icon: '📋', tone: 'admin-tone-text-info' },
  AUTOMATION_SLA_ENFORCED: { label: 'SLA aplicat', icon: '⏱️', tone: 'admin-tone-text-danger' },
  AUTOMATION_RUN_ALL: { label: 'Automatització completa', icon: '🤖', tone: 'admin-tone-text-info' },
  AUTOMATION_FUEL_REFRESH: { label: 'Preu combustible', icon: '⛽', tone: 'admin-tone-text-warning' },
  PACK_PRICING_CHECK: { label: 'Check preus packs', icon: '💶', tone: 'admin-tone-text-success' },
  AUTOFIX_OK: { label: 'Autofix OK', icon: '✅', tone: 'admin-tone-text-success' },
  AUTOFIX_FAILED: { label: 'Autofix fallat', icon: '⚠️', tone: 'admin-tone-text-warning' },
  AUTOFIX_CRASH: { label: 'Autofix crash', icon: '💥', tone: 'admin-tone-text-danger' },
  CALENDAR_SYNC: { label: 'Sync calendari', icon: '📅', tone: 'admin-tone-text-info' },
  CALENDAR_SYNC_ERROR: { label: 'Error sync calendari', icon: '❌', tone: 'admin-tone-text-danger' },
  PORTAL_AUTO_CREATED: { label: 'Portal client creat', icon: '🔑', tone: 'admin-tone-text-violet' },
  CREATE: { label: 'Creat', icon: '➕', tone: 'admin-tone-text-success' },
  UPDATE: { label: 'Actualitzat', icon: '✏️', tone: 'admin-tone-text-info' },
  DELETE: { label: 'Eliminat', icon: '🗑️', tone: 'admin-tone-text-danger' },
};

const STATS_CARDS = [
  {
    key: 'comms',
    label: 'Comunicacions',
    icon: '✉️',
    cardTone: 'ap-card--info',
    textTone: 'admin-tone-text-info',
  },
  {
    key: 'automation',
    label: 'Automatitzacions',
    icon: '⚡',
    cardTone: 'ap-card--warning',
    textTone: 'admin-tone-text-warning',
  },
  {
    key: 'system',
    label: 'Sistema',
    icon: '🔄',
    cardTone: 'admin-tone-border-info admin-tone-bg-info',
    textTone: 'admin-tone-text-info',
  },
  {
    key: 'crud',
    label: 'Operacions',
    icon: '📝',
    cardTone: 'ap-card--success',
    textTone: 'admin-tone-text-success',
  },
] as const;

const ENTITY_LINKS: Record<string, (id: string) => string> = {
  booking: (id) => `/admin/bookings/${id}`,
  lead: (id) => `/admin/leads/${id}`,
  pack: (id) => `/admin/packs/${id}`,
  customer: (id) => `/admin/clientes/${id}`,
};

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
  return ACTION_LABELS[action] || { label: action, icon: '•', tone: 'admin-tone-text-neutral' };
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
    return Object.entries(details)
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' · ');
  }
  return parts.join(' · ');
}

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

  useEffect(() => {
    setPage(1);
  }, [category, days]);

  const statsCards = data?.stats ? (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STATS_CARDS.map(({ key, label, icon, cardTone, textTone }) => {
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
            className={`ap-card rounded-2xl p-4 text-left transition-all ${
              category === key ? cardTone : 'admin-tone-idle hover:admin-tone-bg-neutral'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide admin-tone-text-neutral">
                {icon} {label}
              </span>
              <span className={`text-xl font-bold ${total > 0 ? textTone : 'admin-tone-text-neutral'}`}>
                {total}
              </span>
            </div>
            <div className="space-y-0.5">
              {topActions.map(([action, count]) => (
                <div key={action} className="flex items-center justify-between text-xs admin-tone-text-slate">
                  <span>{getActionMeta(action).label}</span>
                  <span>{count}</span>
                </div>
              ))}
              {topActions.length === 0 && <div className="text-xs admin-tone-text-neutral">Cap activitat</div>}
            </div>
          </button>
        );
      })}
    </section>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                category === cat.id
                  ? 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info'
                  : 'admin-tone-idle'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="ap-input rounded-xl px-3 py-1.5 text-xs"
            aria-label="Període de temps"
          >
            {ACTIVITY_DAYS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button onClick={fetchActivity} className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs" aria-label="Refrescar">
            🔄
          </button>
        </div>
      </div>

      {!loading && statsCards}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm admin-tone-text-neutral" role="status">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Carregant activitat...
        </div>
      )}

      {!loading && data && (
        <>
          <div className="mb-2 text-xs admin-tone-text-slate">
            {data.total} accions en {days === 1 ? 'les últimes 24h' : `els últims ${days} dies`}
            {data.pages > 1 && ` · Pàg. ${data.page}/${data.pages}`}
          </div>

          <section className="space-y-3 lg:hidden" aria-label="Registre d'activitat del sistema">
            {data.logs.length === 0 ? (
              <div className="ap-card ap-empty rounded-2xl">
                <p className="ap-empty-title">Cap activitat en aquest període</p>
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
                  <article key={log.id} className="ap-card block rounded-2xl p-4 transition-colors hover:admin-tone-bg-neutral">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <span className={`${meta.tone} text-sm font-medium`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="whitespace-nowrap text-xs admin-tone-text-slate" title={formatDateTimeFull(log.createdAt)}>
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>

                    {log.entity && (
                      <div className="mb-1 text-sm admin-tone-text-neutral">
                        {entityLink ? (
                          <Link href={entityLink} className="admin-tone-text-info underline decoration-current/30 transition-colors hover:opacity-80">
                            {log.entity}
                            {log.entityId && (
                              <span className="ml-1 text-xs admin-tone-text-slate">{log.entityId.slice(0, 8)}</span>
                            )}
                          </Link>
                        ) : (
                          <span>
                            {log.entity}
                            {log.entityId && (
                              <span className="ml-1 text-xs admin-tone-text-slate">{log.entityId.slice(0, 8)}</span>
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {detailsText && <p className="mt-1 line-clamp-2 text-xs admin-tone-text-slate">{detailsText}</p>}
                  </article>
                );
              })
            )}
          </section>

          <section className="hidden lg:block ap-table-wrap">
            <div className="overflow-x-auto">
              <table className="ap-table w-full min-w-[700px] text-sm" aria-label="Registre d'activitat del sistema">
                <thead className="ap-table-head">
                  <tr>
                    <th scope="col" className="ap-table-th w-16">Quan</th>
                    <th scope="col" className="ap-table-th">Acció</th>
                    <th scope="col" className="ap-table-th">Entitat</th>
                    <th scope="col" className="ap-table-th">Detalls</th>
                  </tr>
                </thead>
                <tbody className="ap-table-body">
                  {data.logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center admin-tone-text-neutral">
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
                        <tr key={log.id}>
                          <td className="px-4 py-3 whitespace-nowrap admin-tone-text-slate" title={formatDateTimeFull(log.createdAt)}>
                            {formatTimeAgo(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`${meta.tone} font-medium`}>
                              {meta.icon} {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 admin-tone-text-neutral">
                            {entityLink ? (
                              <Link href={entityLink} className="admin-tone-text-info underline decoration-current/30 transition-colors hover:opacity-80">
                                {log.entity}
                                {log.entityId && <span className="ml-1 text-xs admin-tone-text-slate">{log.entityId.slice(0, 8)}</span>}
                              </Link>
                            ) : (
                              <span>
                                {log.entity}
                                {log.entityId && <span className="ml-1 text-xs admin-tone-text-slate">{log.entityId.slice(0, 8)}</span>}
                              </span>
                            )}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-xs admin-tone-text-slate" title={log.details ? JSON.stringify(log.details) : ''}>
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

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs"
              >
                ← Anterior
              </button>
              <span className="text-xs admin-tone-text-slate">
                {data.page} / {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs"
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
