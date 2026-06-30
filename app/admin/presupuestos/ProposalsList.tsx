'use client';

import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { getProposalStatusDisplay, PROPOSAL_FILTERABLE_STATUSES, formatDate, formatCurrency } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { buildCustomerProposalHref, buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import { AdminEmptyState } from '@/app/admin/components/AdminPage';

type ProposalItem = {
  id: string;
  reference: string;
  status: string;
  total: number;
  createdAt: string;
  sentAt: string | null;
  customerId: string | null;
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

function StatusBadge({ status }: { status: string }) {
  const cfg = getProposalStatusDisplay(status);
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
  initialStatusFilter = '',
}: {
  proposals: ProposalItem[];
  quotes: QuoteItem[];
  initialStatusFilter?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

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

  const getProposalHref = (proposal: ProposalItem) =>
    proposal.customerId
      ? buildCustomerProposalHref(proposal.customerId, proposal.id)
      : buildProposalHref(proposal.id);
  const getProposalDetailHref = (proposal: ProposalItem) => buildProposalHref(proposal.id);

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

  async function handleDelete(proposalId: string) {
    const ok = await confirm({ title: 'Eliminar pressupost', message: 'Aquesta acció no es pot desfer.', variant: 'danger', confirmLabel: 'Eliminar' });
    if (!ok) return;
    setDeletingId(proposalId);
    try {
      const res = await fetchWithCsrf(`/api/admin/proposals/${proposalId}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMsg('Pressupost eliminat');
        setTimeout(() => setActionMsg(null), 3000);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionMsg(data?.error || 'Error eliminant');
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch {
      setActionMsg('Error de connexió');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setDeletingId(null);
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
        setActionMsg(`Estat canviat a ${getProposalStatusDisplay(status).label}`);
        setTimeout(() => setActionMsg(null), 3000);
        router.refresh();
      }
    } catch {
      setActionMsg('Error canviant estat');
      setTimeout(() => setActionMsg(null), 4000);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          onClick={() => setStatusFilter('')}
          className={`ap-kpi cursor-pointer text-left hover:border-[var(--line2)] ${!statusFilter ? 'ap-kpi--info' : ''}`}
          aria-pressed={!statusFilter}
        >
          <span className="ap-kpi-label">Total</span>
          <span className="ap-kpi-value">{stats.total}</span>
        </button>
        {PROPOSAL_FILTERABLE_STATUSES.map((status) => {
          const cfg = getProposalStatusDisplay(status);
          const count = stats[status];
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`ap-kpi cursor-pointer text-left hover:border-[var(--line2)] ${isActive ? 'ap-kpi--info' : ''}`}
              aria-pressed={isActive}
            >
              <span className="ap-kpi-label">{cfg.label}s</span>
              <span className="ap-kpi-value">{count}</span>
            </button>
          );
        })}
      </div>

      {totalValue > 0 && (
        <div className="ap-kpi ap-kpi--warning w-fit">
          <span className="ap-kpi-label">Valor acceptat</span>
          <span className="ap-kpi-value">{formatCurrency(totalValue)}</span>
        </div>
      )}

      {actionMsg && <div className="ap-alert">{actionMsg}</div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Cerca per client, referència..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-input flex-1"
          aria-label="Cercar pressupostos"
        />
        <div className="flex flex-wrap items-center gap-2">
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="ap-btn ap-btn--xs"
            >
              Netejar filtre
            </button>
          )}
          <Link
            href="/admin/presupuestos?customerId=new"
            className="ap-btn ap-btn--primary"
          >
            + Nou pressupost
          </Link>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {filtered.length === 0 ? (
          <AdminEmptyState
            icon="📄"
            title={search || statusFilter ? 'Cap resultat amb aquests filtres' : 'Cap pressupost creat encara'}
          />
        ) : (
          filtered.map((proposal) => (
            <article
              key={proposal.id}
              className="ap-card adm-row-hover grid gap-3 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={getProposalHref(proposal)}
                    className="font-bold text-[var(--t)] hover:underline"
                  >
                    {proposal.reference}
                  </Link>
                  <p className="truncate text-sm text-[var(--t3)]">
                    {proposal.customerId ? (
                      <Link href={buildCustomerHubHref(proposal.customerId)} className="hover:underline">
                        {proposal.customer?.name || 'Sense nom'}
                      </Link>
                    ) : (
                      <span className="opacity-60">Sense client assignat</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={proposal.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="[font-family:var(--display)] font-bold tabular-nums text-[var(--t)]">{formatCurrency(proposal.total)}</span>
                <span className="text-[var(--t3)]">{relativeDate(proposal.createdAt)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={getProposalHref(proposal)}
                  className="ap-btn ap-btn--primary ap-btn--xs"
                >
                  Editar
                </Link>
                {proposal.status === 'DRAFT' && (
                  <button
                    onClick={() => handleSend(proposal.id)}
                    disabled={sendingId === proposal.id}
                    className="ap-btn ap-btn--xs"
                  >
                    {sendingId === proposal.id ? 'Enviant...' : 'Enviar'}
                  </button>
                )}
                {proposal.status === 'SENT' && (
                  <>
                    <button
                      onClick={() => handleStatus(proposal.id, 'ACCEPTED')}
                      className="ap-btn ap-btn--xs"
                    >
                      Acceptat
                    </button>
                    <button
                      onClick={() => handleStatus(proposal.id, 'REJECTED')}
                      className="ap-btn ap-btn--xs admin-tone-text-danger admin-tone-border-danger"
                    >
                      Rebutjat
                    </button>
                  </>
                )}
                {proposal.customer && proposal.customerId && (
                  <Link
                    href={buildCustomerHubHref(proposal.customerId)}
                    className="ap-btn ap-btn--xs"
                  >
                    Client
                  </Link>
                )}
                <Link
                  href={getProposalDetailHref(proposal)}
                  className="ap-btn ap-btn--xs"
                >
                  Vincles
                </Link>
                {proposal.leadId && (
                  <Link
                    href={buildLeadWorkspaceHref(proposal.leadId)}
                    className="ap-btn ap-btn--xs"
                  >
                    Entrada
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="ap-table-wrap hidden lg:block">
        <table className="ap-table" aria-label="Llistat de pressupostos">
          <thead className="ap-table-head">
            <tr>
              <th scope="col" className="ap-table-th">Ref.</th>
              <th scope="col" className="ap-table-th">Client</th>
              <th scope="col" className="ap-table-th">Estat</th>
              <th scope="col" className="ap-table-th"><div className="text-right">Import</div></th>
              <th scope="col" className="ap-table-th"><div className="text-right">Data</div></th>
              <th scope="col" className="ap-table-th"><div className="text-right">Accions</div></th>
            </tr>
          </thead>
          <tbody className="ap-table-body">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--t3)]">
                  {search || statusFilter ? 'Cap resultat amb aquests filtres' : 'Cap pressupost creat encara'}
                </td>
              </tr>
            ) : (
              filtered.map((proposal) => (
                <tr key={proposal.id}>
                  <td>
                    <Link
                      href={getProposalHref(proposal)}
                      className="font-bold text-[var(--t)] hover:underline"
                    >
                      {proposal.reference}
                    </Link>
                  </td>
                  <td>
                    {proposal.customerId ? (
                      <Link href={buildCustomerHubHref(proposal.customerId)} className="hover:underline">
                        {proposal.customer?.name || 'Sense nom'}
                      </Link>
                    ) : (
                      <span className="text-[var(--t3)]">Sense client assignat</span>
                    )}
                    <p className="max-w-[200px] truncate text-xs text-[var(--t3)]">{proposal.customer?.email}</p>
                  </td>
                  <td>
                    <StatusBadge status={proposal.status} />
                  </td>
                  <td>
                    <div className="text-right [font-family:var(--display)] font-bold tabular-nums text-[var(--t)]">
                      {formatCurrency(proposal.total)}
                    </div>
                  </td>
                  <td>
                    <div className="text-right text-[var(--t3)]">
                      {relativeDate(proposal.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={getProposalHref(proposal)}
                        className="ap-btn ap-btn--primary ap-btn--xs"
                        title="Editar / generar PDF"
                      >
                        Editar
                      </Link>
                      {proposal.customerId && (
                        <Link
                          href={buildCustomerHubHref(proposal.customerId)}
                          className="ap-btn ap-btn--xs"
                          title="Fitxa client"
                        >
                          Client
                        </Link>
                      )}
                      {proposal.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSend(proposal.id)}
                          disabled={sendingId === proposal.id}
                          className="ap-btn ap-btn--xs"
                          title="Marcar enviat"
                        >
                          {sendingId === proposal.id ? '...' : 'Enviat'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(proposal.id)}
                        disabled={deletingId === proposal.id}
                        className="ap-btn ap-btn--xs admin-tone-text-danger admin-tone-border-danger"
                        title="Eliminar pressupost"
                      >
                        {deletingId === proposal.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {quotes.length > 0 && (
        <details className="ap-card ap-card-body">
          <summary className="cursor-pointer font-bold text-[var(--t2)]">
            Pressupostos antics (LeadDocument) — {quotes.length}
          </summary>
          <div className="mt-3 grid gap-2">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-3"
              >
                <div className="min-w-0">
                  <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                    {quote.title}
                  </a>
                  <p className="text-xs text-[var(--t3)]">
                    {quote.lead?.name || 'Lead'} · {relativeDate(quote.createdAt)}
                  </p>
                </div>
                <Link
                  href={buildLeadWorkspaceHref(quote.leadId)}
                  className="ap-btn ap-btn--xs"
                >
                  Veure lead
                </Link>
              </div>
            ))}
          </div>
        </details>
      )}
      <ConfirmDialog {...dialogProps} />
    </section>
  );
}
