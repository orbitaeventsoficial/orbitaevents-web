'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ACTIVITY_CATEGORY_OPTIONS, ACTIVITY_DAYS_OPTIONS, formatDateTimeFull } from '@/lib/constants';
import { ADMIN_ACTIVITY_ACTION_META, ADMIN_ACTIVITY_ENTITY_LINKS, ADMIN_ACTIVITY_STATS_CARDS } from '@/lib/constants/admin';
import { log } from '@/lib/logger';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { useToast } from '../components/ToastProvider';

interface TimelineLink {
  label: string;
  href: string;
}

interface TimelineEntry {
  id: string;
  source: 'customerActivity' | 'leadActivity' | 'adminLog';
  entityType: string;
  entityId?: string | null;
  kind: string;
  title: string;
  body?: string;
  actor?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
  link?: TimelineLink;
  timelineType: string;
}

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  category: string;
  createdAt: string;
  timeline?: TimelineEntry;
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
  return ADMIN_ACTIVITY_ACTION_META[action] || { label: action, icon: '•', tone: 'admin-tone-text-neutral' };
}

function getSourceLabel(source?: TimelineEntry['source']): string {
  if (source === 'customerActivity') return 'Client';
  if (source === 'leadActivity') return 'Lead';
  if (source === 'adminLog') return 'Sistema';
  return 'Activitat';
}

function getKindLabel(kind?: string): string {
  if (kind === 'message') return 'Comunicació';
  if (kind === 'task') return 'Tasca';
  if (kind === 'booking') return 'Reserva';
  if (kind === 'proposal') return 'Pressupost';
  if (kind === 'system') return 'Sistema';
  if (kind === 'crud') return 'Operació';
  return 'Activitat';
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

function getEntityLink(log: ActivityLog): string | null {
  if (log.timeline?.link?.href) return log.timeline.link.href;
  if (log.entityId && ADMIN_ACTIVITY_ENTITY_LINKS[log.entity]) {
    return `${ADMIN_ACTIVITY_ENTITY_LINKS[log.entity]}/${log.entityId}`;
  }
  return null;
}

function getEntityLabel(log: ActivityLog): string {
  if (log.timeline?.entityType && log.timeline.entityType !== 'other') return log.timeline.entityType;
  return log.entity;
}

function formatWindowLabel(days: number): string {
  return days === 1 ? 'les últimes 24h' : `els últims ${days} dies`;
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
      log.error('Activity fetch error', err);
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

  const activeCategoryLabel = ACTIVITY_CATEGORY_OPTIONS.find((option) => option.id === category)?.label || 'Tot';
  const windowLabel = formatWindowLabel(days);
  const dominantCategory = data?.stats
    ? Object.entries(data.stats)
        .filter(([, value]) => value.total > 0)
        .sort(([, a], [, b]) => b.total - a.total)[0]
    : null;
  const dominantCategoryMeta = dominantCategory
    ? ADMIN_ACTIVITY_STATS_CARDS.find((card) => card.key === dominantCategory[0])
    : null;
  const timelineLinkedCount = data?.logs.filter((entry) => Boolean(entry.timeline?.title || entry.timeline?.link?.href)).length || 0;
  const sourceCounts = data?.logs.reduce<Record<string, number>>((acc, entry) => {
    const source = entry.timeline?.source || 'adminLog';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {}) || {};
  const sourceEntries = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a);
  const systemItems = data
    ? [
        `${data.total} accions detectades en ${windowLabel}`,
        dominantCategoryMeta && dominantCategory ? `${dominantCategoryMeta.label} lidera la lectura amb ${dominantCategory[1].total} moviments` : '',
        timelineLinkedCount > 0 ? `${timelineLinkedCount} registres ja arriben amb lectura canònica visible` : 'Sense registres amb lectura canònica visible en aquesta finestra',
        sourceEntries[0] ? `${getSourceLabel(sourceEntries[0][0] as TimelineEntry['source'])} és la font principal ara mateix (${sourceEntries[0][1]})` : '',
      ].filter(Boolean)
    : [];
  const manualItems = data
    ? [
        category !== 'all' ? `Filtre actiu: ${activeCategoryLabel}` : 'Sense filtre de categoria: lectura transversal del sistema',
        days !== 7 ? `Finestra manual ajustada a ${windowLabel}` : 'Finestra estàndard de 7 dies activa',
        data.logs.length === 0 ? 'La combinació actual no retorna activitat; convé obrir la finestra o treure filtre' : '',
        data.pages > 1 ? `La lectura ocupa ${data.pages} pàgines i ara mateix estàs a la ${data.page}` : '',
      ].filter(Boolean)
    : [];
  const nextStep = data
    ? data.logs.length === 0
      ? {
          title: 'Recuperar context abans de diagnosticar',
          detail: `Amb ${activeCategoryLabel.toLowerCase()} i ${windowLabel} no hi ha moviment visible. El següent pas correcte és ampliar la finestra o tornar al global abans de donar res per estable.`,
          href: '/admin/activity',
          ctaLabel: 'Obrir vista completa',
          secondaryAction: { href: '/admin/crons', label: 'Obrir Crons' },
        }
      : category !== 'all'
        ? {
            title: `Tancar el focus de ${activeCategoryLabel.toLowerCase()} sense perdre context`,
            detail: `La vista està filtrada i ja tens prou senyal per revisar aquest bloc. Després del tall, convé tornar al global per confirmar si el patró és local o sistèmic.`,
            href: '/admin/activity',
            ctaLabel: 'Veure activitat completa',
            secondaryAction: { href: '/admin', label: 'Tornar al panell' },
          }
        : dominantCategoryMeta && dominantCategory
          ? {
              title: `Entrar al coll principal de ${dominantCategoryMeta.label.toLowerCase()}`,
              detail: `${dominantCategoryMeta.label} concentra ara mateix ${dominantCategory[1].total} moviments. El següent pas és validar si aquest volum reflecteix bon ritme o soroll operatiu abans de baixar al detall registre per registre.`,
              href: '/admin/activity',
              ctaLabel: 'Revisar aquesta cua',
              secondaryAction: { href: '/admin/crons', label: 'Cruïlla amb Crons' },
            }
          : {
              title: 'Mantenir lectura executiva del sistema',
              detail: 'No hi ha un coll clar per categoria. El millor següent pas és conservar la vista global i baixar només als registres que trenquen el ritme normal.',
              href: '/admin/activity',
              ctaLabel: 'Continuar lectura',
              secondaryAction: { href: '/admin', label: 'Tornar al panell' },
            }
    : null;

  const statsCards = data?.stats ? (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ADMIN_ACTIVITY_STATS_CARDS.map(({ key, label, icon, cardTone, textTone }) => {
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
            className={`admin-stagger-item rounded-2xl border border-white/10 p-4 text-left transition-all ${
              category === key ? cardTone : 'admin-card-glass adm-row-hover'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide opacity-60">
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
      {!loading && data && nextStep && (
        <OwnerControlStrip
          system={{
            eyebrow: 'Automàtic',
            title: 'Què està movent el sistema',
            tone: data.total > 0 ? 'info' : 'warning',
            items: systemItems,
            emptyText: 'Sense activitat rellevant detectada en aquesta finestra.',
          }}
          manual={{
            eyebrow: 'Manual',
            title: 'On cal criteri teu',
            tone: category !== 'all' || days !== 7 || data.logs.length === 0 ? 'warning' : 'success',
            items: manualItems,
            emptyText: 'La vista global no et reclama cap ajust manual ara mateix.',
          }}
          nextStep={{
            eyebrow: 'Següent pas',
            ...nextStep,
          }}
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div role="navigation" aria-label="Filtres d'activitat" className="flex flex-wrap gap-1.5">
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

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="ap-input min-w-0 flex-1 rounded-xl px-3 py-1.5 text-xs sm:flex-none"
            aria-label="Període de temps"
          >
            {ACTIVITY_DAYS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button onClick={fetchActivity} className="ap-btn ap-btn--secondary shrink-0 px-3 py-1.5 text-xs" aria-label="Refrescar">
            ↻
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
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs admin-tone-text-slate">
            <span>{data.total} accions en {windowLabel}</span>
            {data.pages > 1 && <span>· Pàg. {data.page}/{data.pages}</span>}
            <span>· Timeline canònica disponible</span>
          </div>

          <section className="space-y-3 lg:hidden" aria-label="Registre d'activitat del sistema">
            {data.logs.length === 0 ? (
              <div className="admin-card-glass rounded-2xl border border-white/10 p-8 text-center">
                <p className="ap-empty-title">Cap activitat en aquest període</p>
              </div>
            ) : (
              data.logs.map((entry) => {
                const meta = getActionMeta(entry.action);
                const entityLink = getEntityLink(entry);
                const detailsText = formatDetails(entry.details);
                const sourceLabel = getSourceLabel(entry.timeline?.source);
                const kindLabel = getKindLabel(entry.timeline?.kind);
                const entityLabel = getEntityLabel(entry);

                return (
                  <article key={entry.id} className="admin-stagger-item admin-card-glass block rounded-2xl border border-white/10 p-4 transition-colors adm-row-hover">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <span className={`${meta.tone} text-sm font-medium`}>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="max-w-[9rem] truncate text-right text-xs admin-tone-text-slate sm:max-w-none sm:whitespace-nowrap" title={formatDateTimeFull(entry.createdAt)}>
                        {formatTimeAgo(entry.createdAt)}
                      </span>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide admin-tone-text-neutral">
                      <span>{sourceLabel}</span>
                      <span>·</span>
                      <span>{kindLabel}</span>
                    </div>

                    <p className="mb-1 text-sm truncate admin-tone-text-neutral">{entry.timeline?.title || meta.label}</p>

                    {entityLabel && (
                      <div className="mb-1 text-sm admin-tone-text-neutral">
                        {entityLink ? (
                          <Link href={entityLink} className="admin-tone-text-info underline decoration-current/30 transition-colors hover:opacity-80">
                            {entityLabel}
                            {entry.entityId && (
                              <span className="ml-1 text-xs admin-tone-text-slate">{entry.entityId.slice(0, 8)}</span>
                            )}
                          </Link>
                        ) : (
                          <span>
                            {entityLabel}
                            {entry.entityId && (
                              <span className="ml-1 text-xs admin-tone-text-slate">{entry.entityId.slice(0, 8)}</span>
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

          <section className="hidden lg:block admin-card-glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ap-table w-full min-w-[920px] text-sm" aria-label="Registre d'activitat del sistema">
                <thead className="ap-table-head">
                  <tr>
                    <th scope="col" className="ap-table-th w-16">Quan</th>
                    <th scope="col" className="ap-table-th">Acció</th>
                    <th scope="col" className="ap-table-th">Font</th>
                    <th scope="col" className="ap-table-th">Entitat</th>
                    <th scope="col" className="ap-table-th">Lectura</th>
                    <th scope="col" className="ap-table-th">Detalls</th>
                  </tr>
                </thead>
                <tbody className="ap-table-body">
                  {data.logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center admin-tone-text-neutral">
                        Cap activitat en aquest període
                      </td>
                    </tr>
                  ) : (
                    data.logs.map((entry) => {
                      const meta = getActionMeta(entry.action);
                      const entityLink = getEntityLink(entry);
                      const sourceLabel = getSourceLabel(entry.timeline?.source);
                      const kindLabel = getKindLabel(entry.timeline?.kind);
                      const entityLabel = getEntityLabel(entry);

                      return (
                        <tr key={entry.id}>
                          <td className="max-w-[8rem] px-4 py-3 truncate admin-tone-text-slate xl:max-w-none xl:whitespace-nowrap" title={formatDateTimeFull(entry.createdAt)}>
                            {formatTimeAgo(entry.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`${meta.tone} font-medium`}>
                              {meta.icon} {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs admin-tone-text-slate">
                            {sourceLabel}
                            <span className="ml-2 admin-tone-text-neutral">{kindLabel}</span>
                          </td>
                          <td className="px-4 py-3 admin-tone-text-neutral">
                            {entityLink ? (
                              <Link href={entityLink} className="admin-tone-text-info underline decoration-current/30 transition-colors hover:opacity-80">
                                {entityLabel}
                                {entry.entityId && <span className="ml-1 text-xs admin-tone-text-slate">{entry.entityId.slice(0, 8)}</span>}
                              </Link>
                            ) : (
                              <span>
                                {entityLabel}
                                {entry.entityId && <span className="ml-1 text-xs admin-tone-text-slate">{entry.entityId.slice(0, 8)}</span>}
                              </span>
                            )}
                          </td>
                          <td className="max-w-sm px-4 py-3 text-sm admin-tone-text-neutral">
                            {entry.timeline?.title || meta.label}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-xs admin-tone-text-slate" title={entry.details ? JSON.stringify(entry.details) : ''}>
                            {formatDetails(entry.details)}
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
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="ap-btn ap-btn--secondary min-w-[7.5rem] px-3 py-1.5 text-xs"
              >
                ← Anterior
              </button>
              <span className="text-xs admin-tone-text-slate">
                {data.page} / {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="ap-btn ap-btn--secondary min-w-[7.5rem] px-3 py-1.5 text-xs"
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
