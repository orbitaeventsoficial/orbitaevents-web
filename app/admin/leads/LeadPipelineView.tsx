'use client';

import { useState, useEffect, useCallback, useDeferredValue, useMemo } from 'react';
import Link from 'next/link';
import { EVENT_TYPE_ICONS, EVENT_TYPE_PLAIN, PRIORITY_DOT_CLASS, PRIORITY_LABELS, LEAD_PIPELINE_COLUMNS, formatDateShort, getSourceDisplay } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import PipelineBoard, { type PipelineCardContext } from '@/app/admin/components/PipelineBoard';
import { ADMIN_PIPELINE_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';

type PipelineFilters = {
  status: string[];
  priority: string[];
  eventType: string[];
  source: string[];
  q: string;
  from?: string | null;
  to?: string | null;
};

type PipelineLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  source: string;
  eventDate: string | null;
  status: string;
  priority: string;
  customerId: string | null;
  budget: string | null;
  createdAt: string;
  booking: { id: string; reference: string } | null;
  cachedScore?: number | null;
};

const COLUMNS = [...LEAD_PIPELINE_COLUMNS];

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap ${
        active
          ? 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info'
          : 'admin-tone-border-neutral admin-tone-text-neutral hover:brightness-105'
      }`}
      {...helpAttrs(ADMIN_PIPELINE_HELP.lead.chips)}
    >
      {label}
    </button>
  );
}

export default function LeadPipelineView({ filters }: { filters: PipelineFilters }) {
  const toast = useToast();
  const [allLeads, setAllLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [localSearch, setLocalSearch] = useState('');
  const [localPriority, setLocalPriority] = useState<string | null>(null);
  const [localEventType, setLocalEventType] = useState<string | null>(null);
  const [localSource, setLocalSource] = useState<string | null>(null);
  const deferredLocalSearch = useDeferredValue(localSearch);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    filters.status.forEach((value) => params.append('status', value));
    filters.priority.forEach((value) => params.append('priority', value));
    filters.eventType.forEach((value) => params.append('eventType', value));
    filters.source.forEach((value) => params.append('source', value));
    if (filters.q) params.set('search', filters.q);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    return params.toString();
  }, [filters]);

  const fetchPipeline = useCallback(async () => {
    try {
      const qs = filterQuery ? `&${filterQuery}` : '';
      const res = await fetchWithCsrf(`/api/admin/leads?limit=500&pipeline=true${qs}`);
      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        log.error(`Pipeline error ${res.status}`, undefined, { context: { errorBody } });
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const leads: PipelineLead[] = data?.data?.leads || data?.leads || [];
      setAllLeads(leads);
    } catch (err) {
      log.error('Error carregant pipeline', err);
      toast.error(`Error carregant el pipeline: ${err instanceof Error ? err.message : 'desconegut'}`);
    } finally {
      setLoading(false);
    }
  }, [filterQuery, toast]);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (deferredLocalSearch) {
      const q = deferredLocalSearch.toLowerCase();
      result = result.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone && l.phone.includes(q))
      );
    }
    if (localPriority) result = result.filter((l) => l.priority === localPriority);
    if (localEventType) result = result.filter((l) => l.eventType === localEventType);
    if (localSource) result = result.filter((l) => l.source === localSource);
    return result;
  }, [allLeads, deferredLocalSearch, localPriority, localEventType, localSource]);

  const setLeadStatusInState = useCallback((leadId: string, status: string) => {
    setAllLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
  }, []);

  const moveLeadStatus = useCallback(async (leadId: string, newStatus: string) => {
    const currentLead = allLeads.find((lead) => lead.id === leadId);
    if (!currentLead || currentLead.status === newStatus) return;
    const previousStatus = currentLead.status;

    setLeadStatusInState(leadId, newStatus);
    setUpdatingId(leadId);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setLeadStatusInState(leadId, previousStatus);
        toast.error('Error movent l\'entrada');
      } else {
        const targetLabel = COLUMNS.find((c) => c.status === newStatus)?.label || newStatus;
        toast.success(`Entrada moguda a ${targetLabel}`);
      }
    } catch {
      setLeadStatusInState(leadId, previousStatus);
      toast.error('Error de connexió movent l\'entrada');
    } finally {
      setUpdatingId(null);
    }
  }, [allLeads, setLeadStatusInState, toast]);

  const availableEventTypes = useMemo(() => [...new Set(allLeads.map((l) => l.eventType))].sort(), [allLeads]);
  const availableSources = useMemo(() => [...new Set(allLeads.map((l) => l.source))].sort(), [allLeads]);
  const availablePriorities = useMemo(() => [...new Set(allLeads.map((l) => l.priority))].sort(), [allLeads]);
  const hasLocalFilters = localSearch || localPriority || localEventType || localSource;

  const columnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const col of COLUMNS) counts[col.status] = filteredLeads.filter((l) => l.status === col.status).length;
    return counts;
  }, [filteredLeads]);
  const totalLeads = filteredLeads.length;
  const wonLeads = columnCounts['WON'] || 0;
  const lostLeads = columnCounts['LOST'] || 0;
  const openLeads = totalLeads - wonLeads - lostLeads;
  const winRate = wonLeads + lostLeads > 0 ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100) : 0;

  return (
    <div className="space-y-3" {...helpAttrs(ADMIN_PIPELINE_HELP.lead.board)}>
      <div className="space-y-2" {...helpAttrs(ADMIN_PIPELINE_HELP.lead.localFilters)}>
        <div className="relative">
          <input
            type="search"
            placeholder="Filtrar per nom, email, telèfon..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-xl border text-xs focus:ring-1 transition-all bg-transparent"
            {...helpAttrs(ADMIN_PIPELINE_HELP.lead.search)}
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div role="navigation" aria-label="Filtres de pipeline" className="flex flex-wrap gap-1.5" {...helpAttrs(ADMIN_PIPELINE_HELP.lead.chips)}>
          {availablePriorities.map((p) => (
            <FilterChip key={p} label={PRIORITY_LABELS[p] || p} active={localPriority === p} onClick={() => setLocalPriority(localPriority === p ? null : p)} />
          ))}
          <span className="admin-tone-border-neutral mx-0.5 border-l" />
          {availableEventTypes.map((et) => (
            <FilterChip key={et} label={EVENT_TYPE_PLAIN[et] || et} active={localEventType === et} onClick={() => setLocalEventType(localEventType === et ? null : et)} />
          ))}
          <span className="admin-tone-border-neutral mx-0.5 border-l" />
          {availableSources.map((s) => (
            <FilterChip key={s} label={getSourceDisplay(s).label} active={localSource === s} onClick={() => setLocalSource(localSource === s ? null : s)} />
          ))}
          {hasLocalFilters && (
            <>
              <span className="admin-tone-border-neutral mx-0.5 border-l" />
              <button
                type="button"
                onClick={() => { setLocalSearch(''); setLocalPriority(null); setLocalEventType(null); setLocalSource(null); }}
                className="rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors"
                {...helpAttrs(ADMIN_PIPELINE_HELP.lead.clearLocalFilters)}
              >
                Netejar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-xs" {...helpAttrs(ADMIN_PIPELINE_HELP.lead.summary)}>
        Pipeline: {totalLeads} entrades{hasLocalFilters ? ` (de ${allLeads.length} totals)` : ''}
      </div>

      <div className="pb-2" {...helpAttrs(ADMIN_PIPELINE_HELP.lead.kanban)}>
        <PipelineBoard<PipelineLead>
          columnsDef={COLUMNS}
          items={filteredLeads}
          getId={(l) => l.id}
          getStatus={(l) => l.status}
          updatingId={updatingId}
          onMoveStatus={(id, status) => void moveLeadStatus(id, status)}
          loading={loading}
          gridClassName="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
          renderEmptyColumn={(col) => (
            <div className="rounded-xl border border-dashed p-4 text-center text-xs">
              <p className="mb-1">Cap entrada</p>
              {col.status === 'NEW' && (
                <Link href="/admin/leads" className="text-[10px] font-medium hover:underline">
                  + Afegir entrada
                </Link>
              )}
            </div>
          )}
          virtualizeColumns
          maxVisiblePerColumn={500}
          estimatedItemHeight={170}
          renderCard={(lead, ctx) => (
            <PipelineCard lead={lead} ctx={ctx} onMoveStatus={moveLeadStatus} />
          )}
        />
      </div>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" {...helpAttrs(ADMIN_PIPELINE_HELP.lead.metrics)}>
        <div className="admin-leads-metric admin-leads-metric--open rounded-xl border p-3">
          <p className="admin-leads-metric-label text-[10px] uppercase tracking-wide">Obertes</p>
          <p className="admin-leads-metric-value mt-1 text-lg font-bold">{openLeads}</p>
        </div>
        <div className="admin-leads-metric admin-leads-metric--won rounded-xl border p-3">
          <p className="admin-leads-metric-label text-[10px] uppercase tracking-wide">Guanyades</p>
          <p className="admin-leads-metric-value mt-1 text-lg font-bold">{wonLeads}</p>
        </div>
        <div className="admin-leads-metric admin-leads-metric--lost rounded-xl border p-3">
          <p className="admin-leads-metric-label text-[10px] uppercase tracking-wide">Perdudes</p>
          <p className="admin-leads-metric-value mt-1 text-lg font-bold">{lostLeads}</p>
        </div>
        <div className="admin-leads-metric admin-leads-metric--winrate rounded-xl border p-3">
          <p className="admin-leads-metric-label text-[10px] uppercase tracking-wide">Taxa guany</p>
          <p className="admin-leads-metric-value mt-1 text-lg font-bold">{winRate}%</p>
        </div>
      </section>
    </div>
  );
}

function estimateScore(lead: PipelineLead): number | null {
  let score = 30;
  if (lead.budget) score += 20;
  if (lead.phone) score += 15;
  if (lead.eventDate) score += 15;
  if (lead.email) score += 10;
  return Math.min(100, score);
}

function PipelineCard({
  lead,
  ctx,
  onMoveStatus,
}: {
  lead: PipelineLead;
  ctx: PipelineCardContext;
  onMoveStatus: (id: string, status: string) => Promise<void>;
}) {
  const { isUpdating, statusIndex, columnCount, dragHandlers } = ctx;
  const col = COLUMNS[statusIndex];
  const canMoveForward = statusIndex < columnCount - 2;
  const canMoveBack = statusIndex > 0;
  const nextStatus = canMoveForward ? COLUMNS[statusIndex + 1].status : null;
  const prevStatus = canMoveBack ? COLUMNS[statusIndex - 1].status : null;
  const cardHelp = ADMIN_PIPELINE_HELP.lead.card(lead.name, col.label);

  return (
    <div
      {...dragHandlers}
      aria-label={`Lead ${lead.name}`}
      {...helpAttrs(cardHelp)}
      className={`admin-drag-item rounded-xl border p-3 transition-all hover:brightness-105 ${col.cardToneClass} ${
        isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="text-sm font-semibold text-white transition-colors line-clamp-1"
        >
          {lead.name}
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          {prevStatus && (() => {
            const help = ADMIN_PIPELINE_HELP.lead.moveTo(COLUMNS[statusIndex - 1].label);
            return (
              <button
                type="button"
                onClick={() => onMoveStatus(lead.id, prevStatus)}
                disabled={isUpdating}
                className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 hover:text-white transition-colors disabled:opacity-50"
                title={help.title}
                aria-label={help.title}
                {...helpAttrs(help)}
              >
                ←
              </button>
            );
          })()}
          {nextStatus && (() => {
            const help = ADMIN_PIPELINE_HELP.lead.moveTo(COLUMNS[statusIndex + 1].label);
            return (
              <button
                type="button"
                onClick={() => onMoveStatus(lead.id, nextStatus)}
                disabled={isUpdating}
                className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 transition-colors disabled:opacity-50"
                title={help.title}
                aria-label={help.title}
                {...helpAttrs(help)}
              >
                →
              </button>
            );
          })()}
          <span
            className={`w-3 h-3 rounded-full ${PRIORITY_DOT_CLASS[lead.priority] || PRIORITY_DOT_CLASS.MEDIUM}`}
            title={lead.priority}
          />
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {(() => {
          const score = lead.cachedScore ?? estimateScore(lead);
          if (score === null) return null;
          const scoreColor = score > 70
            ? 'admin-tone-soft-success admin-tone-border-success'
            : score > 40
              ? 'admin-tone-bg-warning admin-tone-text-warning admin-tone-border-warning'
              : 'admin-tone-soft-danger admin-tone-border-danger';
          return (
            <span
              className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${scoreColor}`}
              title={ADMIN_PIPELINE_HELP.lead.qualityScore.title}
              {...helpAttrs(ADMIN_PIPELINE_HELP.lead.qualityScore)}
            >
              {score}
            </span>
          );
        })()}
        {(() => {
          const daysSince = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
          const daysColor = daysSince <= 2 ? 'admin-tone-soft-success admin-tone-border-success' :
            daysSince <= 5 ? 'admin-tone-bg-warning admin-tone-text-warning admin-tone-border-warning' :
            'admin-tone-soft-danger admin-tone-border-danger';
          return (
            <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${daysColor}`}>
              {daysSince}d
            </span>
          );
        })()}
        {lead.budget && (
          <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
            {lead.budget}
          </span>
        )}
        {lead.eventDate && (
          <span className="inline-flex items-center gap-0.5 text-[10px]">
            📅 {formatDateShort(lead.eventDate)}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span>{EVENT_TYPE_ICONS[lead.eventType] || lead.eventType}</span>
        <span>{getSourceDisplay(lead.source).label}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.customerId && (
          <Link href={`/admin/clientes/${lead.customerId}`} className="text-[10px] hover:underline">
            👤 Client
          </Link>
        )}
        {lead.booking && (
          <Link
            href={`/admin/bookings/${lead.booking.id}`}
            className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
          >
            📋 {lead.booking.reference}
          </Link>
        )}
      </div>
    </div>
  );
}


