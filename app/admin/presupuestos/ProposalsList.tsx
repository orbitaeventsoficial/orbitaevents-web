'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROPOSAL_FILTERABLE_STATUSES, PROPOSAL_STATUS_CONFIG, formatDate, formatCurrency } from '@/lib/constants';
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

const DEFAULT_STATUS_STYLE = {
  label: 'Esborrany',
  bg: 'admin-tone-bg-neutral',
  text: 'admin-tone-text-neutral',
  border: 'admin-tone-border-neutral',
};

function getProposalStatusStyle(status: string) {
  return PROPOSAL_STATUS_CONFIG[status] || DEFAULT_STATUS_STYLE;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getProposalStatusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
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
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const filtered = proposals.filter((proposal) => {
    if (statusFilter && proposal.status !== statusFilter) return false;
    if (!search) return true;

    const query = search.toLowerCase();
    return (
      proposal.reference.toLowerCase().includes(query) ||
      (proposal.customer?.name || '').toLowerCase().includes(query) ||
      (proposal.customer?.email || '').toLowerCase().includes(query)
    );
  });

  const stats = {
    total: proposals.length,
    DRAFT: proposals.filter((proposal) => proposal.status === 'DRAFT').length,
    SENT: proposals.filter((proposal) => proposal.status === 'SENT').length,
    ACCEPTED: proposals.filter((proposal) => proposal.status === 'ACCEPTED').length,
    REJECTED: proposals.filter((proposal) => proposal.status === 'REJECTED').length,
  };

  const totalValue = proposals
    .filter((proposal) => proposal.status === 'ACCEPTED')
    .reduce((sum, proposal) => sum + proposal.total, 0);

  async function handleSend(proposalId: string) {
    setSendingId(proposalId);
    try {
      const res = await fetchWithCsrf(`/api/admin/proposals/${proposalId}/send`, {
        method: 'POST',
      });
      if (res.ok) {
        setActionMsg('Pressupost marcat com a enviat');
        setTimeout(() => setActionMsg(null), 3000);
        router.refresh();
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
        setActionMsg(`Estat canviat a ${getProposalStatusStyle(status).label}`);
        setTimeout(() => setActionMsg(null), 3000);
        router.refresh();
      }
    } catch {
      setActionMsg('Error canviant estat');
      setTimeout(() => setActionMsg(null), 4000);
    }
  }

  return (
    <section className="mb-6 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <button
          onClick={() => setStatusFilter('')}
          className={`rounded-xl border p-3 text-left transition-colors ${!statusFilter ? 'border-white/20 bg-white/10' : 'admin-tone-idle'}`}
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs opacity-60">Total</p>
        </button>
        {PROPOSAL_FILTERABLE_STATUSES.map((status) => {
          const cfg = getProposalStatusStyle(status);
          const count = stats[status];
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl border p-3 text-left transition-colors ${isActive ? `${cfg.border} ${cfg.bg}` : 'admin-tone-idle'}`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs opacity-60">{cfg.label}{status === 'DRAFT' ? 's' : 's'}</p>
            </button>
          );
        })}
      </div>

      {totalValue > 0 && (
        <div className="rounded-xl border px-4 py-2 text-sm">
          Valor acceptat: <strong>{formatCurrency(totalValue)}</strong>
        </div>
      )}

      {actionMsg && (
        <div className="rounded-xl border px-4 py-2 text-sm">
          {actionMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Cerca per client, referència..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-xl border bg-white/5 px-4 py-2 text-sm"
          aria-label="Cercar pressupostos"
        />
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="rounded-full border px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            Netejar filtre
          </button>
        )}
        <Link
          href="/admin/presupuestos"
          className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          + Nou pressupost
        </Link>
      </div>

      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <p className="py-8 text-center opacity-60">
            {search || statusFilter ? 'Cap resultat amb aquests filtres' : 'Cap pressupost creat encara'}
          </p>
        ) : (
          filtered.map((proposal) => (
            <article
              key={proposal.id}
              className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/presupuestos?proposalId=${proposal.id}&customerId=${proposal.customerId}`}
                    className="font-medium hover:underline"
                  >
                    {proposal.reference}
                  </Link>
                  <p className="truncate text-sm opacity-70">
                    <Link href={`/admin/clientes/${proposal.customerId}`} className="hover:underline">
                      {proposal.customer?.name || 'Sense nom'}
                    </Link>
                  </p>
                </div>
                <StatusBadge status={proposal.status} />
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="tabular-nums font-medium">{formatCurrency(proposal.total)}</span>
                <span className="opacity-60">{relativeDate(proposal.createdAt)}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/presupuestos?proposalId=${proposal.id}&customerId=${proposal.customerId}`}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                >
                  ✏️ Editar
                </Link>
                {proposal.status === 'DRAFT' && (
                  <button
                    onClick={() => handleSend(proposal.id)}
                    disabled={sendingId === proposal.id}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    {sendingId === proposal.id ? '⏳ Enviant...' : '📧 Enviar'}
                  </button>
                )}
                {proposal.status === 'SENT' && (
                  <>
                    <button
                      onClick={() => handleStatus(proposal.id, 'ACCEPTED')}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-white/10"
                    >
                      ✅ Acceptat
                    </button>
                    <button
                      onClick={() => handleStatus(proposal.id, 'REJECTED')}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 text-sm transition-colors hover:bg-white/10"
                    >
                      ❌ Rebutjat
                    </button>
                  </>
                )}
                {proposal.customer && (
                  <Link
                    href={`/admin/clientes/${proposal.customerId}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                  >
                    👤 Client
                  </Link>
                )}
                {proposal.leadId && (
                  <Link
                    href={`/admin/leads/${proposal.leadId}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                  >
                    📋 Entrada
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden overflow-x-auto rounded-2xl border lg:block">
        <table className="w-full min-w-[600px] text-sm" aria-label="Llistat de pressupostos">
          <thead>
            <tr className="border-b bg-white/[0.03]">
              <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Ref.</th>
              <th scope="col" className="px-4 py-3 text-left font-medium opacity-70">Client</th>
              <th scope="col" className="hidden px-4 py-3 text-left font-medium opacity-70 sm:table-cell">Estat</th>
              <th scope="col" className="px-4 py-3 text-right font-medium opacity-70">Import</th>
              <th scope="col" className="hidden px-4 py-3 text-right font-medium opacity-70 md:table-cell">Data</th>
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
              filtered.map((proposal) => (
                <tr key={proposal.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/presupuestos?proposalId=${proposal.id}&customerId=${proposal.customerId}`}
                      className="font-medium hover:underline"
                    >
                      {proposal.reference}
                    </Link>
                    <span className="ml-2 sm:hidden"><StatusBadge status={proposal.status} /></span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${proposal.customerId}`} className="hover:underline">
                      {proposal.customer?.name || 'Sense nom'}
                    </Link>
                    <p className="max-w-[200px] truncate text-xs opacity-50">{proposal.customer?.email}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StatusBadge status={proposal.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(proposal.total)}
                  </td>
                  <td className="hidden px-4 py-3 text-right opacity-60 md:table-cell">
                    {relativeDate(proposal.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <details className="relative inline-block">
                      <summary className="list-none cursor-pointer rounded-xl px-3 py-2 transition-colors hover:bg-white/10">
                        <span aria-hidden="true">⋯</span>
                        <span className="sr-only">Accions</span>
                      </summary>
                      <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border bg-black/95 p-1 shadow-xl backdrop-blur-sm">
                        <Link
                          href={`/admin/presupuestos?proposalId=${proposal.id}&customerId=${proposal.customerId}`}
                          className="block rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                        >
                          ✏️ Editar
                        </Link>
                        {proposal.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSend(proposal.id)}
                            disabled={sendingId === proposal.id}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50"
                          >
                            {sendingId === proposal.id ? '⏳ Enviant...' : '📧 Marcar enviat'}
                          </button>
                        )}
                        {proposal.status === 'SENT' && (
                          <>
                            <button
                              onClick={() => handleStatus(proposal.id, 'ACCEPTED')}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                            >
                              ✅ Acceptat
                            </button>
                            <button
                              onClick={() => handleStatus(proposal.id, 'REJECTED')}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                            >
                              ❌ Rebutjat
                            </button>
                          </>
                        )}
                        {proposal.customer && (
                          <Link
                            href={`/admin/clientes/${proposal.customerId}`}
                            className="block rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                          >
                            👤 Fitxa client
                          </Link>
                        )}
                        {proposal.leadId && (
                          <Link
                            href={`/admin/leads/${proposal.leadId}`}
                            className="block rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
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

      {quotes.length > 0 && (
        <details className="rounded-2xl border p-4">
          <summary className="cursor-pointer text-sm font-medium opacity-70 transition-opacity hover:opacity-100">
            📄 Pressupostos antics (LeadDocument) — {quotes.length}
          </summary>
          <div className="mt-3 space-y-2">
            {quotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                    {quote.title}
                  </a>
                  <p className="text-xs opacity-50">
                    {quote.lead?.name || 'Lead'} · {relativeDate(quote.createdAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/leads/${quote.leadId}`}
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
