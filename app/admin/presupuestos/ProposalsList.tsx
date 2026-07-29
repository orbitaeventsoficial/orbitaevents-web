'use client';

import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog, { useConfirmDialog } from '@/app/admin/components/ConfirmDialog';
import { getProposalStatusDisplay, PROPOSAL_FILTERABLE_STATUSES, formatDate, formatCurrency } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { buildCustomerProposalHref, buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildProposalBookingCreateHref, buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';
import { isAdminTestArtifactFromParts } from '@/lib/admin/testArtifacts';
import { isSentLikeProposalStatus } from '@/lib/proposals/status';
import { AdminEmptyState } from '@/app/admin/components/AdminPage';

type ProposalItem = {
  id: string;
  reference: string;
  status: string;
  total: number;
  createdAt: string;
  sentAt: string | null;
  pdfUrl: string | null;
  pdfKey: string | null;
  customerId: string | null;
  leadId: string | null;
  bookingId: string | null;
  customer: { name: string; email: string } | null;
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

function isProposalTestArtifact(proposal: ProposalItem): boolean {
  return isAdminTestArtifactFromParts([
    proposal.reference,
    proposal.customer?.name,
    proposal.customer?.email,
  ]);
}

function hasCanonicalSentProposalArtifact(proposal: ProposalItem): boolean {
  return Boolean(proposal.sentAt && proposal.pdfUrl?.trim() && proposal.pdfKey?.trim());
}

function matchesProposalStatusFilter(proposal: ProposalItem, statusFilter: string): boolean {
  if (!statusFilter) return true;
  if (statusFilter === 'SENT') return isSentLikeProposalStatus(proposal.status);
  return proposal.status === statusFilter;
}

export default function ProposalsList({
  proposals,
  initialStatusFilter = '',
}: {
  proposals: ProposalItem[];
  initialStatusFilter?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTestProposals, setShowTestProposals] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  const testProposalArtifacts = proposals.filter(isProposalTestArtifact);
  const visibleProposals = showTestProposals ? proposals : proposals.filter((proposal) => !isProposalTestArtifact(proposal));
  const hiddenTestProposals = testProposalArtifacts.length;

  const filtered = visibleProposals.filter((proposal) => {
    if (!matchesProposalStatusFilter(proposal, statusFilter)) return false;
    if (!search) return true;

    const query = search.toLowerCase();
    return (
      proposal.reference.toLowerCase().includes(query) ||
      (proposal.customer?.name || '').toLowerCase().includes(query) ||
      (proposal.customer?.email || '').toLowerCase().includes(query)
    );
  });

  const stats = {
    total: visibleProposals.length,
    DRAFT: visibleProposals.filter((proposal) => proposal.status === 'DRAFT').length,
    SENT: visibleProposals.filter((proposal) => isSentLikeProposalStatus(proposal.status)).length,
    ACCEPTED: visibleProposals.filter((proposal) => proposal.status === 'ACCEPTED').length,
    REJECTED: visibleProposals.filter((proposal) => proposal.status === 'REJECTED').length,
  };

  const totalValue = visibleProposals
    .filter((proposal) => proposal.status === 'ACCEPTED')
    .reduce((sum, proposal) => sum + proposal.total, 0);
  const selectedCount = selectedIds.size;
  const filteredIds = filtered.map((proposal) => proposal.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  const getProposalHref = (proposal: ProposalItem) =>
    proposal.customerId
      ? buildCustomerProposalHref(proposal.customerId, proposal.id)
      : buildProposalHref(proposal.id);
  const getProposalDetailHref = (proposal: ProposalItem) => buildProposalHref(proposal.id);
  const getBookingAction = (proposal: ProposalItem) => {
    if (proposal.bookingId) {
      return { href: buildBookingHref(proposal.bookingId), label: 'Reserva' };
    }
    if (proposal.status !== 'ACCEPTED' || !hasCanonicalSentProposalArtifact(proposal)) return null;
    return {
      href: buildProposalBookingCreateHref({
        proposalId: proposal.id,
        leadId: proposal.leadId,
        customerId: proposal.customerId,
      }),
      label: 'Crear reserva',
    };
  };

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

  function toggleProposalSelection(proposalId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(proposalId)) next.delete(proposalId);
      else next.add(proposalId);
      return next;
    });
  }

  function toggleFilteredSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id);
      } else {
        for (const id of filteredIds) next.add(id);
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0 || bulkDeleting) return;
    const ok = await confirm({
      title: 'Eliminar pressupostos',
      message: `S'eliminaran ${ids.length} pressupostos seleccionats. Aquesta acció no es pot desfer.`,
      variant: 'danger',
      confirmLabel: 'Eliminar seleccionats',
    });
    if (!ok) return;

    setBulkDeleting(true);
    const failed: string[] = [];
    try {
      for (const id of ids) {
        const res = await fetchWithCsrf(`/api/admin/proposals/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          failed.push(data?.error || 'Error eliminant');
        }
      }
      const deleted = ids.length - failed.length;
      if (deleted > 0) setActionMsg(`${deleted} pressupostos eliminats`);
      if (failed.length > 0) setActionMsg(`${failed.length} pressupostos no s'han pogut eliminar`);
      setSelectedIds(new Set());
      setTimeout(() => setActionMsg(null), failed.length > 0 ? 4000 : 3000);
      router.refresh();
    } catch {
      setActionMsg('Error de connexió');
      setTimeout(() => setActionMsg(null), 4000);
    } finally {
      setBulkDeleting(false);
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
      } else {
        const data = await res.json().catch(() => ({}));
        setActionMsg(data?.error || 'Error canviant estat');
        setTimeout(() => setActionMsg(null), 4000);
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

      {hiddenTestProposals > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-3">
          <span className="ap-badge">
            {showTestProposals ? `${hiddenTestProposals} pressupostos de prova visibles` : `${hiddenTestProposals} pressupostos de prova ocults`}
          </span>
          <button
            type="button"
            className="ap-btn ap-btn--xs"
            onClick={() => {
              setSelectedIds(new Set());
              setShowTestProposals((value) => !value);
            }}
          >
            {showTestProposals ? 'Ocultar proves' : 'Mostrar proves'}
          </button>
        </div>
      )}

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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-3">
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--t2)]">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleFilteredSelection}
            className="h-4 w-4"
            aria-label="Seleccionar pressupostos visibles"
          />
          Seleccionar visibles
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && <span className="ap-badge">{selectedCount} seleccionats</span>}
          {selectedCount > 0 && (
            <button type="button" className="ap-btn ap-btn--xs" onClick={() => setSelectedIds(new Set())}>
              Netejar
            </button>
          )}
          <button
            type="button"
            className="ap-btn ap-btn--danger ap-btn--xs"
            onClick={handleBulkDelete}
            disabled={selectedCount === 0 || bulkDeleting}
          >
            {bulkDeleting ? 'Eliminant...' : 'Eliminar seleccionats'}
          </button>
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
                <input
                  type="checkbox"
                  checked={selectedIds.has(proposal.id)}
                  onChange={() => toggleProposalSelection(proposal.id)}
                  className="mt-1 h-4 w-4 shrink-0"
                  aria-label={`Seleccionar pressupost ${proposal.reference}`}
                />
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
                {isSentLikeProposalStatus(proposal.status) && hasCanonicalSentProposalArtifact(proposal) && (
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
                {isSentLikeProposalStatus(proposal.status) && !hasCanonicalSentProposalArtifact(proposal) && (
                  <button
                    onClick={() => handleSend(proposal.id)}
                    disabled={sendingId === proposal.id}
                    className="ap-btn ap-btn--xs"
                  >
                    {sendingId === proposal.id ? 'Reparant...' : 'Reparar PDF'}
                  </button>
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
                {getBookingAction(proposal) && (
                  <Link
                    href={getBookingAction(proposal)!.href}
                    className="ap-btn ap-btn--primary ap-btn--xs"
                  >
                    {getBookingAction(proposal)!.label}
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
              <th scope="col" className="ap-table-th">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleFilteredSelection}
                  className="h-4 w-4"
                  aria-label="Seleccionar pressupostos visibles"
                />
              </th>
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
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--t3)]">
                  {search || statusFilter ? 'Cap resultat amb aquests filtres' : 'Cap pressupost creat encara'}
                </td>
              </tr>
            ) : (
              filtered.map((proposal) => (
                <tr key={proposal.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(proposal.id)}
                      onChange={() => toggleProposalSelection(proposal.id)}
                      className="h-4 w-4"
                      aria-label={`Seleccionar pressupost ${proposal.reference}`}
                    />
                  </td>
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
                      {getBookingAction(proposal) && (
                        <Link
                          href={getBookingAction(proposal)!.href}
                          className="ap-btn ap-btn--primary ap-btn--xs"
                          title={getBookingAction(proposal)!.label}
                        >
                          {getBookingAction(proposal)!.label}
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
      <ConfirmDialog {...dialogProps} />
    </section>
  );
}
