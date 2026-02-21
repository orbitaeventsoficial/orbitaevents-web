'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

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
  color: string;
  borderColor: string;
  bgColor: string;
  cardBgColor: string;
  cardBorderColor: string;
  leads: PipelineLead[];
};

const COLUMNS: Omit<PipelineColumn, 'leads'>[] = [
  { status: 'NEW', label: 'Noves', color: 'text-sky-100', borderColor: 'border-sky-300/60', bgColor: 'bg-[#163a56]', cardBgColor: 'bg-[#102c43]', cardBorderColor: 'border-sky-300/45' },
  { status: 'CONTACTED', label: 'Contactat', color: 'text-amber-100', borderColor: 'border-amber-300/60', bgColor: 'bg-[#5a3f16]', cardBgColor: 'bg-[#46300f]', cardBorderColor: 'border-amber-300/45' },
  { status: 'QUOTE_SENT', label: 'Pressupost enviat', color: 'text-violet-100', borderColor: 'border-violet-300/60', bgColor: 'bg-[#413061]', cardBgColor: 'bg-[#34244f]', cardBorderColor: 'border-violet-300/45' },
  { status: 'NEGOTIATING', label: 'Negociant', color: 'text-orange-100', borderColor: 'border-orange-300/60', bgColor: 'bg-[#5a3118]', cardBgColor: 'bg-[#452513]', cardBorderColor: 'border-orange-300/45' },
  { status: 'WON', label: 'Guanyat', color: 'text-emerald-100', borderColor: 'border-emerald-300/60', bgColor: 'bg-[#174632]', cardBgColor: 'bg-[#123726]', cardBorderColor: 'border-emerald-300/45' },
  { status: 'LOST', label: 'Perdut', color: 'text-rose-100', borderColor: 'border-rose-300/60', bgColor: 'bg-[#4c1f2b]', cardBgColor: 'bg-[#3b1821]', cardBorderColor: 'border-rose-300/45' },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: '💍',
  BIRTHDAY: '🎂',
  CORPORATE: '🎯',
  COMMUNION: '⛪',
  BAPTISM: '👶',
  GRADUATION: '🎓',
  ANNIVERSARY: '🎉',
  PRIVATE_PARTY: '🎵',
  OTHER: '📋',
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-slate-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-rose-500',
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Boca-orella',
  GOOGLE: 'Google',
  OTHER: 'Altre',
};

export default function LeadPipelineView({ filters }: { filters: PipelineFilters }) {
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
      const res = await fetch(`/api/admin/leads-new?limit=500&pipeline=true${qs}`, { credentials: 'include' });
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
      const res = await fetch(`/api/admin/leads-new/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setLeadStatusInState(leadId, previousStatus);
      }
    } catch {
      setLeadStatusInState(leadId, previousStatus);
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
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
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
      <div className="text-xs text-slate-400">
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
            className={`min-w-0 rounded-2xl border ${col.borderColor} ${col.bgColor} flex min-h-[320px] flex-col transition-all ${
              dragOverStatus === col.status ? 'ring-2 ring-cyan-400/50 border-cyan-400/60' : ''
            }`}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-slate-700/30">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${col.color} truncate`}>
                  {col.label}
                </h3>
                <span className={`rounded-full border ${col.borderColor} bg-slate-900/50 px-2 py-0.5 text-[10px] font-bold ${col.color}`}>
                  {col.leads.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2">
              {dragOverStatus === col.status && (
                <div className={`rounded-xl border border-dashed ${col.borderColor} px-2 py-1 text-center text-[10px] ${col.color}`}>
                  Deixa anar aquí
                </div>
              )}
              {col.leads.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700/40 p-4 text-center text-xs text-slate-500">
                  Cap entrada
                </div>
              )}
              {col.leads.map((lead) => (
                <PipelineCard
                  key={lead.id}
                  lead={lead}
                  columnStatus={col.status}
                  columnLabel={col.label}
                  columnColorClass={col.color}
                  cardBgColor={col.cardBgColor}
                  cardBorderColor={col.cardBorderColor}
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
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Obertes</p>
          <p className="mt-1 text-lg font-bold text-slate-100">{openLeads}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-emerald-200">Guanyades</p>
          <p className="mt-1 text-lg font-bold text-emerald-100">{wonLeads}</p>
        </div>
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-rose-200">Perdudes</p>
          <p className="mt-1 text-lg font-bold text-rose-100">{lostLeads}</p>
        </div>
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-3">
          <p className="text-[10px] uppercase tracking-wide text-amber-200">Taxa guany</p>
          <p className="mt-1 text-lg font-bold text-amber-100">{winRate}%</p>
        </div>
      </section>
    </div>
  );
}

function PipelineCard({
  lead,
  columnStatus,
  columnLabel,
  columnColorClass,
  cardBgColor,
  cardBorderColor,
  updatingId,
  onMoveStatus,
  onDragStart,
  onDragEnd,
}: {
  lead: PipelineLead;
  columnStatus: string;
  columnLabel: string;
  columnColorClass: string;
  cardBgColor: string;
  cardBorderColor: string;
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
      className={`rounded-xl border ${cardBorderColor} ${cardBgColor} p-3 transition-all hover:brightness-110 ${
        isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="text-sm font-semibold text-white hover:text-amber-200 transition-colors line-clamp-1"
        >
          {lead.name}
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          {prevStatus && (
            <button
              type="button"
              onClick={() => onMoveStatus(lead.id, prevStatus)}
              disabled={isUpdating}
              className="rounded px-1 py-0.5 text-[10px] text-slate-300 hover:bg-black/20 hover:text-white transition-colors disabled:opacity-50"
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
              className="rounded px-1 py-0.5 text-[10px] text-amber-200 hover:bg-black/20 hover:text-amber-100 transition-colors disabled:opacity-50"
              title={`Moure a ${COLUMNS[statusIndex + 1].label}`}
            >
              →
            </button>
          )}
          <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[lead.priority] || PRIORITY_DOT.MEDIUM}`} title={lead.priority} />
        </div>
      </div>

      <div className="mt-1">
        <span className={`inline-flex rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold ${columnColorClass}`}>
          {columnLabel}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span>{EVENT_TYPE_LABELS[lead.eventType] || lead.eventType}</span>
        <span className="text-fuchsia-300/90">{SOURCE_LABELS[lead.source] || lead.source}</span>
        {lead.eventDate && (
          <span className="text-slate-200/80">
            {new Date(lead.eventDate).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })}
          </span>
        )}
        {lead.budget && (
          <span className="text-emerald-400 font-medium">{lead.budget}</span>
        )}
      </div>

      {/* Links */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.customerId && (
          <Link
            href={`/admin/contactes/${lead.customerId}`}
            className="text-[10px] text-cyan-400 hover:text-cyan-300"
          >
            👤
          </Link>
        )}
        {lead.booking && (
          <Link
            href={`/admin/bookings/${lead.booking.id}`}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
          >
            {lead.booking.reference}
          </Link>
        )}
      </div>

    </div>
  );
}

