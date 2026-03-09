'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

type ProposalItem = {
  id: string;
  reference: string;
  status: string;
  total: number;
  createdAt: string;
  sentAt: string | null;
  customerId: string;
  leadId: string | null;
  customer: { name: string; email: string } | null;
};

type QuoteItem = {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  leadId: string;
  lead: { name: string; email: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Esborrany', bg: 'bg-white/10', text: 'text-white/70' },
  SENT: { label: 'Enviat', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  ACCEPTED: { label: 'Acceptat', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  REJECTED: { label: 'Rebutjat', bg: 'bg-red-500/20', text: 'text-red-300' },
  EXPIRED: { label: 'Caducat', bg: 'bg-amber-500/20', text: 'text-amber-300' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Ara';
  if (hours < 24) return `Fa ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Fa ${days}d`;
  return formatDate(dateStr);
}

export default function ProposalsList({
  proposals,
  quotes,
}: {
  proposals: ProposalItem[];
  quotes: QuoteItem[];
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const filtered = proposals.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches =
        p.reference.toLowerCase().includes(q) ||
        (p.customer?.name || '').toLowerCase().includes(q) ||
        (p.customer?.email || '').toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const stats = {
    total: proposals.length,
    draft: proposals.filter((p) => p.status === 'DRAFT').length,
    sent: proposals.filter((p) => p.status === 'SENT').length,
    accepted: proposals.filter((p) => p.status === 'ACCEPTED').length,
    rejected: proposals.filter((p) => p.status === 'REJECTED').length,
  };

  const totalValue = proposals
    .filter((p) => p.status === 'ACCEPTED')
    .reduce((sum, p) => sum + p.total, 0);

  async function handleSend(proposalId: string) {
    setSendingId(proposalId);
    try {
      const res = await fetchWithCsrf(`/api/admin/proposals/${proposalId}/send`, {
        method: 'POST',
      });
      if (res.ok) {
        setActionMsg('Pressupost marcat com a enviat');
        setTimeout(() => setActionMsg(null), 3000);
        // Refresh the page to see updated status
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionMsg(data?.error || 'Error enviant');
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch {
      setActionMsg('Error de connexió');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setSendingId(null);
    }
  }

  async function handleStatus(proposalId: string, status: string) {
    try {
      const res = await fetchWithCsrf(`/api/admin/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setActionMsg(`Estat canviat a ${STATUS_CONFIG[status]?.label || status}`);
        setTimeout(() => setActionMsg(null), 3000);
        window.location.reload();
      }
    } catch {
      setActionMsg('Error canviant estat');
      setTimeout(() => setActionMsg(null), 4000);
    }
  }

  return (
    <section className="mb-6 space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button
          onClick={() => setStatusFilter('')}
          className={`rounded-xl border p-3 text-left transition-colors ${!statusFilter ? 'border-cyan-500/50 bg-cyan-500/10' : 'hover:bg-white/[0.03]'}`}
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs opacity-60">Total</p>
        </button>
        <button
          onClick={() => setStatusFilter('DRAFT')}
          className={`rounded-xl border p-3 text-left transition-colors ${statusFilter === 'DRAFT' ? 'border-white/30 bg-white/10' : 'hover:bg-white/[0.03]'}`}
        >
          <p className="text-2xl font-bold">{stats.draft}</p>
          <p className="text-xs opacity-60">Esborranys</p>
        </button>
        <button
          onClick={() => setStatusFilter('SENT')}
          className={`rounded-xl border p-3 text-left transition-colors ${statusFilter === 'SENT' ? 'border-blue-500/50 bg-blue-500/10' : 'hover:bg-white/[0.03]'}`}
        >
          <p className="text-2xl font-bold">{stats.sent}</p>
          <p className="text-xs opacity-60">Enviats</p>
        </button>
        <button
          onClick={() => setStatusFilter('ACCEPTED')}
          className={`rounded-xl border p-3 text-left transition-colors ${statusFilter === 'ACCEPTED' ? 'border-emerald-500/50 bg-emerald-500/10' : 'hover:bg-white/[0.03]'}`}
        >
          <p className="text-2xl font-bold">{stats.accepted}</p>
          <p className="text-xs opacity-60">Acceptats</p>
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`rounded-xl border p-3 text-left transition-colors ${statusFilter === 'REJECTED' ? 'border-red-500/50 bg-red-500/10' : 'hover:bg-white/[0.03]'}`}
        >
          <p className="text-2xl font-bold">{stats.rejected}</p>
          <p className="text-xs opacity-60">Rebutjats</p>
        </button>
      </div>

      {/* Revenue accepted */}
      {totalValue > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm">
          Valor acceptat: <strong className="text-emerald-300">{totalValue.toLocaleString('ca-ES', { minimumFractionDigits: 2 })}€</strong>
        </div>
      )}

      {/* Action message */}
      {actionMsg && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
          {actionMsg}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Cerca per client, referència..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-xl border bg-white/5 px-4 py-2 text-sm focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
          aria-label="Cercar pressupostos"
        />
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="rounded-full border px-3 py-1 text-xs hover:bg-white/10 transition-colors"
          >
            Netejar filtre
          </button>
        )}
        <Link
          href="/admin/presupuestos"
          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 transition-colors"
        >
          + Nou pressupost
        </Link>
      </div>

      {/* Proposals table */}
      <div className="rounded-2xl border overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm" aria-label="Llistat de pressupostos">
          <thead>
            <tr className="border-b bg-white/[0.03]">
              <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Ref.</th>
              <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Client</th>
              <th scope="col" className="px-4 py-3 text-left font-medium opacity-70 hidden sm:table-cell">Estat</th>
              <th scope="col" className="px-4 py-3 text-right font-medium opacity-70">Import</th>
              <th scope="col" className="px-4 py-3 text-right font-medium opacity-70 hidden md:table-cell">Data</th>
              <th scope="col" className="px-4 py-3 text-right font-medium opacity-70">Accions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center opacity-60">
                  {search || statusFilter ? 'Cap resultat amb aquests filtres' : 'Cap pressupost creat encara'}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/presupuestos?proposalId=${p.id}&customerId=${p.customerId}`}
                      className="font-medium text-cyan-400 hover:underline"
                    >
                      {p.reference}
                    </Link>
                    <span className="sm:hidden ml-2"><StatusBadge status={p.status} /></span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${p.customerId}`} className="hover:underline">
                      {p.customer?.name || 'Sense nom'}
                    </Link>
                    <p className="text-xs opacity-50 truncate max-w-[200px]">{p.customer?.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {p.total.toLocaleString('ca-ES', { minimumFractionDigits: 2 })}€
                  </td>
                  <td className="px-4 py-3 text-right opacity-60 hidden md:table-cell">
                    {relativeDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <details className="relative inline-block">
                      <summary className="cursor-pointer rounded-xl px-3 py-2 hover:bg-white/10 transition-colors list-none">
                        <span aria-hidden="true">⋯</span>
                        <span className="sr-only">Accions</span>
                      </summary>
                      <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border bg-black/95 backdrop-blur-sm p-1 shadow-xl">
                        <Link
                          href={`/admin/presupuestos?proposalId=${p.id}&customerId=${p.customerId}`}
                          className="block rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                        >
                          ✏️ Editar
                        </Link>
                        {p.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSend(p.id)}
                            disabled={sendingId === p.id}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                          >
                            {sendingId === p.id ? '⏳ Enviant...' : '📧 Marcar enviat'}
                          </button>
                        )}
                        {p.status === 'SENT' && (
                          <>
                            <button
                              onClick={() => handleStatus(p.id, 'ACCEPTED')}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-500/10 text-emerald-300 transition-colors"
                            >
                              ✅ Acceptat
                            </button>
                            <button
                              onClick={() => handleStatus(p.id, 'REJECTED')}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-red-500/10 text-red-300 transition-colors"
                            >
                              ❌ Rebutjat
                            </button>
                          </>
                        )}
                        {p.customer && (
                          <Link
                            href={`/admin/clientes/${p.customerId}`}
                            className="block rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                          >
                            👤 Fitxa client
                          </Link>
                        )}
                        {p.leadId && (
                          <Link
                            href={`/admin/leads/${p.leadId}`}
                            className="block rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                          >
                            📋 Entrada
                          </Link>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legacy quotes */}
      {quotes.length > 0 && (
        <details className="rounded-2xl border p-4">
          <summary className="cursor-pointer text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">
            📄 Pressupostos antics (LeadDocument) — {quotes.length}
          </summary>
          <div className="mt-3 space-y-2">
            {quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <a href={q.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-cyan-400 hover:underline">
                    {q.title}
                  </a>
                  <p className="text-xs opacity-50">
                    {q.lead?.name || 'Lead'} · {relativeDate(q.createdAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/leads/${q.leadId}`}
                  className="text-xs opacity-60 hover:opacity-100"
                >
                  Veure lead →
                </Link>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
