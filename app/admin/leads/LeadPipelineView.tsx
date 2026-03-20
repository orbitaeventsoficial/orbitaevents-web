'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { EVENT_TYPE_ICONS, EVENT_TYPE_PLAIN, SOURCE_LABELS, PRIORITY_DOT_CLASS, PRIORITY_LABELS, LEAD_PIPELINE_COLUMNS, formatDateShort } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

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

type PipelineColumn = {
  status: string;
  label: string;
  toneClass: string;
  cardToneClass: string;
  leads: PipelineLead[];
};

const COLUMNS: Omit<PipelineColumn, 'leads'>[] = [...LEAD_PIPELINE_COLUMNS];


// Local filter chips for interactive pipeline filtering
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
    >
      {label}
    </button>
  );
}

export default function LeadPipelineView({ filters }: { filters: PipelineFilters }) {
  const toast = useToast();
  const [allLeads, setAllLeads] = useState<PipelineLead[]>([]);
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  // Local interactive filters (client-side, no reload)
  const [localSearch, setLocalSearch] = useState('');
  const [localPriority, setLocalPriority] = useState<string | null>(null);
  const [localEventType, setLocalEventType] = useState<string | null>(null);
  const [localSource, setLocalSource] = useState<string | null>(null);

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
        console.error(`Pipeline error ${res.status}:`, errorBody);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      const leads: PipelineLead[] = data?.data?.leads || data?.leads || [];
      setAllLeads(leads);
    } catch (err) {
      console.error('Error carregant pipeline', err);
      toast.error(`Error carregant el pipeline: ${err instanceof Error ? err.message : 'desconegut'}`);
    } finally {
      setLoading(false);
    }
  }, [filterQuery, toast]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Derive filtered leads from allLeads + local filters
  const filteredLeads = useMemo(() => {
    let result = allLeads;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      result = result.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone && l.phone.includes(q))
      );
    }
    if (localPriority) {
      result = result.filter((l) => l.priority === localPriority);
    }
    if (localEventType) {
      result = result.filter((l) => l.eventType === localEventType);
    }
    if (localSource) {
      result = result.filter((l) => l.source === localSource);
    }
    return result;
  }, [allLeads, localSearch, localPriority, localEventType, localSource]);

  // Rebuild columns whenever filteredLeads changes
  useEffect(() => {
    setColumns(
      COLUMNS.map((col) => ({
        ...col,
        leads: filteredLeads.filter((l) => l.status === col.status),
      }))
    );
  }, [filteredLeads]);

  const setLeadStatusInState = useCallback((leadId: string, status: string) => {
    setAllLeads((prev) => prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
  }, []);

  const moveLeadStatus = async (leadId: string, newStatus: string) => {
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
  };

  const handleDropOnColumn = async (targetStatus: string) => {
    if (!draggingLeadId) return;
    const lead = allLeads.find((item) => item.id === draggingLeadId);
    setDragOverStatus(null);
    if (!lead || lead.status === targetStatus) {
      setDraggingLeadId(null);
      return;
    }
    await moveLeadStatus(draggingLeadId, targetStatus);
    setDraggingLeadId(null);
  };

  // Collect unique values from all leads for filter chips (must be before early returns)
  const availableEventTypes = useMemo(() => [...new Set(allLeads.map((l) => l.eventType))].sort(), [allLeads]);
  const availableSources = useMemo(() => [...new Set(allLeads.map((l) => l.source))].sort(), [allLeads]);
  const availablePriorities = useMemo(() => [...new Set(allLeads.map((l) => l.priority))].sort(), [allLeads]);
  const hasLocalFilters = localSearch || localPriority || localEventType || localSource;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalLeads = columns.reduce((acc, col) => acc + col.leads.length, 0);

  const openLeads = totalLeads - (columns.find((c) => c.status === 'WON')?.leads.length || 0) - (columns.find((c) => c.status === 'LOST')?.leads.length || 0);
  const wonLeads = columns.find((c) => c.status === 'WON')?.leads.length || 0;
  const lostLeads = columns.find((c) => c.status === 'LOST')?.leads.length || 0;
  const winRate = wonLeads + lostLeads > 0 ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Local filters */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="search"
            placeholder="Filtrar per nom, email, telèfon..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-xl border text-xs focus:ring-1 transition-all bg-transparent"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availablePriorities.map((p) => (
            <FilterChip
              key={p}
              label={PRIORITY_LABELS[p] || p}
              active={localPriority === p}
              onClick={() => setLocalPriority(localPriority === p ? null : p)}
            />
          ))}
          <span className="admin-tone-border-neutral mx-0.5 border-l" />
          {availableEventTypes.map((et) => (
            <FilterChip
              key={et}
              label={EVENT_TYPE_PLAIN[et] || et}
              active={localEventType === et}
              onClick={() => setLocalEventType(localEventType === et ? null : et)}
            />
          ))}
          <span className="admin-tone-border-neutral mx-0.5 border-l" />
          {availableSources.map((s) => (
            <FilterChip
              key={s}
              label={SOURCE_LABELS[s] || s}
              active={localSource === s}
              onClick={() => setLocalSource(localSource === s ? null : s)}
            />
          ))}
          {hasLocalFilters && (
            <>
              <span className="admin-tone-border-neutral mx-0.5 border-l" />
              <button
                type="button"
                onClick={() => { setLocalSearch(''); setLocalPriority(null); setLocalEventType(null); setLocalSource(null); }}
                className="rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors"
              >
                Netejar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-xs">
        Pipeline: {totalLeads} entrades{hasLocalFilters ? ` (de ${allLeads.length} totals)` : ''}
      </div>

      <div className="pb-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {columns.map((col) => (
          <div
            key={col.status}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setDragOverStatus(col.status);
            }}
            onDragLeave={() => {
              if (dragOverStatus === col.status) setDragOverStatus(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              void handleDropOnColumn(col.status);
            }}
            className={`min-w-0 rounded-2xl border flex min-h-[320px] flex-col transition-all ${col.toneClass} ${
              dragOverStatus === col.status ? 'admin-drop-active' : ''
            }`}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b">
              <div className="flex items-center justify-between">
                <h3 className="admin-leads-column-title text-sm font-semibold truncate">
                  {col.label}
                </h3>
                <span className="admin-leads-column-count rounded-full border px-2 py-0.5 text-[10px] font-bold">
                  {col.leads.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2">
              {dragOverStatus === col.status && (
                <div className="admin-drag-placeholder rounded-xl px-2 py-3 text-center text-[10px]">
                  Deixa anar aquí
                </div>
              )}
              {col.leads.length === 0 && !dragOverStatus && (
                <div className="rounded-xl border border-dashed p-4 text-center text-xs">
                  <p className="mb-1">Cap entrada</p>
                  {col.status === 'NEW' && (
                    <Link href="/admin/leads" className="text-[10px] font-medium hover:underline">
                      + Afegir entrada
                    </Link>
                  )}
                </div>
              )}
              {col.leads.map((lead) => (
                <PipelineCard
                  key={lead.id}
                  lead={lead}
                  columnStatus={col.status}
                  columnLabel={col.label}
                  cardToneClass={col.cardToneClass}
                  updatingId={updatingId}
                  isDragging={draggingLeadId === lead.id}
                  onMoveStatus={moveLeadStatus}
                  onDragStart={setDraggingLeadId}
                  onDragEnd={() => {
                    setDraggingLeadId(null);
                    setDragOverStatus(null);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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

/** Estimate a lead quality score from available fields when cachedScore is not available */
function estimateScore(lead: PipelineLead): number | null {
  let score = 30; // base
  if (lead.budget) score += 20;
  if (lead.phone) score += 15;
  if (lead.eventDate) score += 15;
  if (lead.email) score += 10;
  // Cap at 100
  return Math.min(100, score);
}

function PipelineCard({
  lead,
  columnStatus,
  columnLabel,
  cardToneClass,
  updatingId,
  isDragging,
  onMoveStatus,
  onDragStart,
  onDragEnd,
}: {
  lead: PipelineLead;
  columnStatus: string;
  columnLabel: string;
  cardToneClass: string;
  updatingId: string | null;
  isDragging: boolean;
  onMoveStatus: (id: string, status: string) => Promise<void>;
  onDragStart: (leadId: string) => void;
  onDragEnd: () => void;
}) {
  const isUpdating = updatingId === lead.id;
  const statusIndex = COLUMNS.findIndex((c) => c.status === columnStatus);
  const canMoveForward = statusIndex < COLUMNS.length - 2; // Can't move past WON
  const canMoveBack = statusIndex > 0;
  const nextStatus = canMoveForward ? COLUMNS[statusIndex + 1].status : null;
  const prevStatus = canMoveBack ? COLUMNS[statusIndex - 1].status : null;

  return (
    <div
      draggable={!isUpdating}
      aria-label={`Lead ${lead.name}`}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', lead.id);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      data-dragging={isDragging || undefined}
      className={`admin-drag-item rounded-xl border p-3 transition-all hover:brightness-105 ${cardToneClass} ${
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
          {prevStatus && (
            <button
              type="button"
              onClick={() => onMoveStatus(lead.id, prevStatus)}
              disabled={isUpdating}
              className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 hover:text-white transition-colors disabled:opacity-50"
              title={`Moure a ${COLUMNS[statusIndex - 1].label}`}
            >
              ←
            </button>
          )}
          {nextStatus && (
            <button
              type="button"
              onClick={() => onMoveStatus(lead.id, nextStatus)}
              disabled={isUpdating}
              className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 transition-colors disabled:opacity-50"
              title={`Moure a ${COLUMNS[statusIndex + 1].label}`}
            >
              →
            </button>
          )}
          <span className={`w-3 h-3 rounded-full ${PRIORITY_DOT_CLASS[lead.priority] || PRIORITY_DOT_CLASS.MEDIUM}`} title={lead.priority} />
        </div>
      </div>

      {/* Indicadors visuals ràpids */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {/* Score badge */}
        {(() => {
          const score = lead.cachedScore ?? estimateScore(lead);
          if (score === null) return null;
          const scoreColor = score > 70
            ? 'admin-tone-soft-success admin-tone-border-success'
            : score > 40
              ? 'admin-tone-bg-warning admin-tone-text-warning admin-tone-border-warning'
              : 'admin-tone-soft-danger admin-tone-border-danger';
          return (
            <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${scoreColor}`} title="Score de qualitat">
              {score}
            </span>
          );
        })()}
        {/* Dies sense resposta */}
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
        {/* Budget prominent */}
        {lead.budget && (
          <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
            {lead.budget}
          </span>
        )}
        {/* Data event amb icona */}
        {lead.eventDate && (
          <span className="inline-flex items-center gap-0.5 text-[10px]">
            📅 {formatDateShort(lead.eventDate)}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span>{EVENT_TYPE_ICONS[lead.eventType] || lead.eventType}</span>
        <span>{SOURCE_LABELS[lead.source] || lead.source}</span>
      </div>

      {/* Links */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.customerId && (
          <Link
            href={`/admin/clientes/${lead.customerId}`}
            className="text-[10px] hover:underline"
          >
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








