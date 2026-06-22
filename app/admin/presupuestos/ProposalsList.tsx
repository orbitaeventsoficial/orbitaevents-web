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
    <section className="pr__list">
      <div className="pr__statGrid">
        <button
          onClick={() => setStatusFilter('')}
          className="pr__stat"
          aria-pressed={!statusFilter}
        >
          <span className="pr__statValue">{stats.total}</span>
          <span className="pr__statLabel">Total</span>
        </button>
        {PROPOSAL_FILTERABLE_STATUSES.map((status) => {
          const cfg = getProposalStatusDisplay(status);
          const count = stats[status];
          const isActive = statusFilter === status;

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="pr__stat"
              aria-pressed={isActive}
            >
              <span className="pr__statValue">{count}</span>
              <span className="pr__statLabel">{cfg.label}s</span>
            </button>
          );
        })}
      </div>

      {totalValue > 0 && (
        <div className="pr__metric">
          Valor acceptat: <strong>{formatCurrency(totalValue)}</strong>
        </div>
      )}

      {actionMsg && (
        <div className="pr__notice">
          {actionMsg}
        </div>
      )}

      <div className="pr__toolbar">
        <input
          type="search"
          placeholder="Cerca per client, referència..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-input min-w-[200px] flex-1"
          aria-label="Cercar pressupostos"
        />
        <div className="pr__actionRow">
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

      <div className="pr__cards">
        {filtered.length === 0 ? (
          <p className="pr__empty">
            {search || statusFilter ? 'Cap resultat amb aquests filtres' : 'Cap pressupost creat encara'}
          </p>
        ) : (
          filtered.map((proposal) => (
            <article
              key={proposal.id}
              className="ap-card pr__proposalCard adm-row-hover"
            >
              <div className="pr__proposalTop">
                <div className="min-w-0 flex-1">
                  <Link
                    href={getProposalHref(proposal)}
                    className="pr__ref hover:underline"
                  >
                    {proposal.reference}
                  </Link>
                  <p className="pr__muted truncate text-sm">
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

              <div className="pr__statusLine">
                <span className="pr__amount">{formatCurrency(proposal.total)}</span>
                <span className="pr__muted">{relativeDate(proposal.createdAt)}</span>
              </div>

              <div className="pr__rowActions">
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

      <div className="pr__tableShell">
        <table className="pr__table" aria-label="Llistat de pressupostos">
          <thead>
            <tr>
              <th scope="col">Ref.</th>
              <th scope="col">Client</th>
              <th scope="col">Estat</th>
              <th scope="col" className="pr__num">Import</th>
              <th scope="col" className="pr__num">Data</th>
              <th scope="col" className="pr__num">Accions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="pr__empty">
                  {search || statusFilter ? 'Cap resultat amb aquests filtres' : 'Cap pressupost creat encara'}
                </td>
              </tr>
            ) : (
              filtered.map((proposal) => (
                <tr key={proposal.id} className="transition-colors adm-row-hover">
                  <td>
                    <Link
                      href={getProposalHref(proposal)}
                      className="pr__ref hover:underline"
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
                      <span className="pr__muted">Sense client assignat</span>
                    )}
                    <p className="pr__muted max-w-[200px] truncate text-xs">{proposal.customer?.email}</p>
                  </td>
                  <td>
                    <StatusBadge status={proposal.status} />
                  </td>
                  <td className="pr__num pr__amount">
                    {formatCurrency(proposal.total)}
                  </td>
                  <td className="pr__num pr__muted">
                    {relativeDate(proposal.createdAt)}
                  </td>
                  <td className="pr__num">
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
        <details className="pr__legacy">
          <summary>
            Pressupostos antics (LeadDocument) — {quotes.length}
          </summary>
          <div className="pr__legacyList">
            {quotes.map((quote) => (
              <div key={quote.id} className="pr__legacyItem">
                <div>
                  <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                    {quote.title}
                  </a>
                  <p className="pr__muted text-xs">
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
