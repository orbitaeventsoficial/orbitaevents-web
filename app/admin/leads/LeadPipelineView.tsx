'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { EVENT_TYPE_ICONS, SOURCE_LABELS, formatDateShort } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';

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
};

type PipelineColumn = {
  status: string;
  label: string;
  toneClass: string;
  cardToneClass: string;
  leads: PipelineLead[];
};

const COLUMNS: Omit<PipelineColumn, 'leads'>[] = [
  { status: 'NEW', label: 'Noves', toneClass: 'admin-leads-tone admin-leads-tone--new', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--new' },
  { status: 'CONTACTED', label: 'Contactat', toneClass: 'admin-leads-tone admin-leads-tone--contacted', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--contacted' },
  { status: 'QUOTE_SENT', label: 'Pressupost enviat', toneClass: 'admin-leads-tone admin-leads-tone--quote', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--quote' },
  { status: 'NEGOTIATING', label: 'Negociant', toneClass: 'admin-leads-tone admin-leads-tone--negotiating', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--negotiating' },
  { status: 'WON', label: 'Guanyat', toneClass: 'admin-leads-tone admin-leads-tone--won', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--won' },
  { status: 'LOST', label: 'Perdut', toneClass: 'admin-leads-tone admin-leads-tone--lost', cardToneClass: 'admin-leads-card-tone admin-leads-card-tone--lost' },
];


const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-rose-500',
};


export default function LeadPipelineView({ filters }: { filters: PipelineFilters }) {
  const toast = useToast();
  const [allLeads, setAllLeads] = useState<PipelineLead[]>([]);
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
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
      const res = await fetch(`/api/admin/leads?limit=500&pipeline=true${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error carregant pipeline');
      const data = await res.json();
      const leads: PipelineLead[] = data?.data?.leads || data?.leads || [];
      setAllLeads(leads);

      setColumns(
        COLUMNS.map((col) => ({
          ...col,
          leads: leads.filter((l: PipelineLead) => l.status === col.status),
        }))
      );
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const setLeadStatusInState = useCallback((leadId: string, status: string) => {
    setAllLeads((prev) => {
      const next = prev.map((lead) => (lead.id === leadId ? { ...lead, status } : lead));
      setColumns(
        COLUMNS.map((col) => ({
          ...col,
          leads: next.filter((l: PipelineLead) => l.status === col.status),
        }))
      );
      return next;
    });
  }, []);

  const moveLeadStatus = async (leadId: string, newStatus: string) => {
    const currentLead = allLeads.find((lead) => lead.id === leadId);
    if (!currentLead || currentLead.status === newStatus) return;
    const previousStatus = currentLead.status;

    setLeadStatusInState(leadId, newStatus);
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
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
      <div className="text-xs">
        Pipeline filtrat: {totalLeads} de {allLeads.length} entrades
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
              dragOverStatus === col.status ? 'ring-2 ring-cyan-400/50' : ''
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
                <div className="admin-leads-dropzone rounded-xl border border-dashed px-2 py-1 text-center text-[10px]">
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

function PipelineCard({
  lead,
  columnStatus,
  columnLabel,
  cardToneClass,
  updatingId,
  onMoveStatus,
  onDragStart,
  onDragEnd,
}: {
  lead: PipelineLead;
  columnStatus: string;
  columnLabel: string;
  cardToneClass: string;
  updatingId: string | null;
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
      className={`rounded-xl border p-3 transition-all hover:brightness-105 ${cardToneClass} ${
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
          <span className={`w-3 h-3 rounded-full ${PRIORITY_DOT[lead.priority] || PRIORITY_DOT.MEDIUM}`} title={lead.priority} />
        </div>
      </div>

      {/* Indicadors visuals ràpids */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {/* Dies sense resposta */}
        {(() => {
          const daysSince = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
          const daysColor = daysSince <= 2 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            daysSince <= 5 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            'bg-rose-500/20 text-rose-300 border-rose-500/30';
          return (
            <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${daysColor}`}>
              {daysSince}d
            </span>
          );
        })()}
        {/* Budget prominent */}
        {lead.budget && (
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
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
            className="inline-flex items-center gap-0.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300 hover:bg-sky-500/25"
          >
            📋 {lead.booking.reference}
          </Link>
        )}
      </div>

    </div>
  );
}

