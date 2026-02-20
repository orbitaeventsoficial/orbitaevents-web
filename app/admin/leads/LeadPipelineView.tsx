'use client';

import { useState, useEffect, useCallback } from 'react';
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
  leads: PipelineLead[];
};

const COLUMNS: Omit<PipelineColumn, 'leads'>[] = [
  { status: 'NEW', label: 'Noves', color: 'text-blue-300', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/5' },
  { status: 'CONTACTED', label: 'Contactat', color: 'text-yellow-300', borderColor: 'border-yellow-500/30', bgColor: 'bg-yellow-500/5' },
  { status: 'QUOTE_SENT', label: 'Pressupost enviat', color: 'text-purple-300', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/5' },
  { status: 'NEGOTIATING', label: 'Negociant', color: 'text-orange-300', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/5' },
  { status: 'WON', label: 'Guanyat', color: 'text-emerald-300', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/5' },
  { status: 'LOST', label: 'Perdut', color: 'text-slate-400', borderColor: 'border-slate-600/30', bgColor: 'bg-slate-800/30' },
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

function applyFilters(leads: PipelineLead[], filters: PipelineFilters): PipelineLead[] {
  const query = filters.q.trim().toLowerCase();
  const fromDate = filters.from ? new Date(filters.from) : null;
  const toDate = filters.to ? new Date(filters.to) : null;

  return leads.filter((lead) => {
    if (filters.status.length > 0 && !filters.status.includes(lead.status)) return false;
    if (filters.priority.length > 0 && !filters.priority.includes(lead.priority)) return false;
    if (filters.eventType.length > 0 && !filters.eventType.includes(lead.eventType)) return false;
    if (filters.source.length > 0 && !filters.source.includes(lead.source)) return false;

    if (query) {
      const haystack = `${lead.name} ${lead.email} ${lead.phone || ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (fromDate || toDate) {
      if (!lead.eventDate) return false;
      const eventDate = new Date(lead.eventDate);
      if (fromDate && eventDate < fromDate) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (eventDate > end) return false;
      }
    }

    return true;
  });
}

export default function LeadPipelineView({ filters }: { filters: PipelineFilters }) {
  const [allLeads, setAllLeads] = useState<PipelineLead[]>([]);
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/leads-new?limit=200&pipeline=true', { credentials: 'include' });
      if (!res.ok) throw new Error('Error carregant pipeline');
      const data = await res.json();
      const leads: PipelineLead[] = data?.data?.leads || data?.leads || [];
      setAllLeads(leads);

      const filtered = applyFilters(leads, filters);
      const grouped = COLUMNS.map((col) => ({
        ...col,
        leads: filtered.filter((l: PipelineLead) => l.status === col.status),
      }));
      setColumns(grouped);
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const moveLeadStatus = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchPipeline();
      }
    } catch {
      // Silent fail
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-400">
        Pipeline filtrat: {columns.reduce((acc, col) => acc + col.leads.length, 0)} de {allLeads.length} entrades
      </div>

      <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-[1200px]">
        {columns.map((col) => (
          <div
            key={col.status}
            className={`flex-1 min-w-[200px] rounded-2xl border ${col.borderColor} ${col.bgColor} flex flex-col`}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-slate-700/30">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${col.color}`}>
                  {col.label}
                </h3>
                <span className={`rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-bold ${col.color}`}>
                  {col.leads.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 max-h-[600px] overflow-y-auto">
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
                  updatingId={updatingId}
                  onMoveStatus={moveLeadStatus}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}

function PipelineCard({
  lead,
  columnStatus,
  updatingId,
  onMoveStatus,
}: {
  lead: PipelineLead;
  columnStatus: string;
  updatingId: string | null;
  onMoveStatus: (id: string, status: string) => Promise<void>;
}) {
  const isUpdating = updatingId === lead.id;
  const statusIndex = COLUMNS.findIndex((c) => c.status === columnStatus);
  const canMoveForward = statusIndex < COLUMNS.length - 2; // Can't move past WON
  const canMoveBack = statusIndex > 0;
  const nextStatus = canMoveForward ? COLUMNS[statusIndex + 1].status : null;
  const prevStatus = canMoveBack ? COLUMNS[statusIndex - 1].status : null;

  return (
    <div className={`rounded-xl border border-slate-700/50 bg-slate-900/80 p-3 transition-all hover:border-slate-600/70 ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/leads/${lead.id}`}
          className="text-sm font-medium text-slate-100 hover:text-cyan-300 transition-colors line-clamp-1"
        >
          {lead.name}
        </Link>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT[lead.priority] || PRIORITY_DOT.MEDIUM}`} title={lead.priority} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span>{EVENT_TYPE_LABELS[lead.eventType] || lead.eventType}</span>
        <span className="text-fuchsia-300/90">{SOURCE_LABELS[lead.source] || lead.source}</span>
        {lead.eventDate && (
          <span className="text-slate-400">
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

      {/* Move buttons */}
      <div className="mt-2 flex items-center gap-1">
        {prevStatus && (
          <button
            type="button"
            onClick={() => onMoveStatus(lead.id, prevStatus)}
            disabled={isUpdating}
            className="rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors disabled:opacity-50"
            title={`Moure a ${COLUMNS[statusIndex - 1].label}`}
          >
            ←
          </button>
        )}
        <div className="flex-1" />
        {nextStatus && (
          <button
            type="button"
            onClick={() => onMoveStatus(lead.id, nextStatus)}
            disabled={isUpdating}
            className="rounded px-1.5 py-0.5 text-[10px] text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors disabled:opacity-50"
            title={`Moure a ${COLUMNS[statusIndex + 1].label}`}
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}

