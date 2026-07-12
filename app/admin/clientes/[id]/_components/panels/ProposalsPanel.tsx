'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CustomerHubDTO, ProposalDTO, ProposalStatus } from '@/lib/customer-hub/dto';
import { labelEstatPressupost } from '@/lib/customer-hub/labels';
import { formatCurrency, formatDateSimple, getContractStatusDisplay, getProposalStatusDisplay } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminSection, AdminEmptyState } from '@/app/admin/components/AdminPage';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildCustomerHubHref, buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { isSentLikeProposalStatus } from '@/lib/proposals/status';

const STATUS_PILL = 'inline-flex items-center rounded-full border border-current px-2 py-0.5 text-xs font-semibold leading-tight';

type DocumentSnapshotBadge = {
  key: string;
  label: string;
  detail: string;
  className: string;
};

type ProposalOriginLink = {
  key: string;
  label: string;
  href: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildDocumentSnapshotBadges(proposal: ProposalDTO): DocumentSnapshotBadge[] {
  const snapshot = proposal.snapshot;
  if (!isRecord(snapshot)) return [];

  const badges: DocumentSnapshotBadge[] = [];
  if (isRecord(snapshot.quoteSnapshot)) {
    badges.push({
      key: 'quote',
      label: 'Pressupost congelat',
      detail: 'Foto enviada reconstruïble',
      className: 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
    });
  }
  if (isRecord(snapshot.contractSnapshot)) {
    badges.push({
      key: 'contract',
      label: 'Contracte congelat',
      detail: 'Regenera des de snapshot',
      className: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
    });
  }
  return badges;
}

function buildProposalOriginLinks(proposal: ProposalDTO, fallbackCustomerId: string): ProposalOriginLink[] {
  const customerId = proposal.customerId || fallbackCustomerId;
  return [
    customerId ? { key: 'customer', label: 'Client origen', href: buildCustomerHubHref(customerId) } : null,
    proposal.leadId ? { key: 'lead', label: 'Entrada origen', href: buildLeadWorkspaceHref(proposal.leadId) } : null,
    proposal.bookingId ? { key: 'booking', label: 'Reserva origen', href: buildBookingHref(proposal.bookingId) } : null,
  ].filter((link): link is ProposalOriginLink => Boolean(link));
}

function hasCanonicalSentProposalArtifact(proposal: ProposalDTO): boolean {
  return Boolean(proposal.sentAt && proposal.pdfUrl?.trim() && proposal.pdfKey?.trim());
}

function getCanonicalSentProposalPdfHref(proposal: ProposalDTO): string | null {
  if (!hasCanonicalSentProposalArtifact(proposal)) return null;
  return proposal.pdfUrl?.trim() || null;
}

export default function ProposalsPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendProposal = useCallback(async (proposalId: string) => {
    setBusyId(`send-${proposalId}`); setError(null); setConfirmingId(null);
    try {
      const res = await fetchWithCsrf(`/api/admin/proposals/${proposalId}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || "No s'ha pogut enviar el pressupost");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error enviant pressupost'); } finally { setBusyId(null); }
  }, [router]);

  const updateStatus = useCallback(async (proposalId: string, status: ProposalStatus) => {
    setBusyId(`status-${proposalId}-${status}`); setError(null);
    try {
      const payload: Record<string, unknown> = { status };
      if (status === 'ACCEPTED') payload.acceptedAt = new Date().toISOString();
      const res = await fetchWithCsrf(`/api/admin/proposals/${proposalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "No s'ha pogut actualitzar l'estat");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Error actualitzant'); } finally { setBusyId(null); }
  }, [router]);

  const drafts = data.proposals.filter((proposal) => proposal.status === 'DRAFT');
  const sent = data.proposals.filter((proposal) => isSentLikeProposalStatus(proposal.status));
  const closed = data.proposals.filter((proposal) => proposal.status === 'ACCEPTED' || proposal.status === 'REJECTED' || proposal.status === 'EXPIRED');
  const customerProposalHref = buildCustomerProposalHref(data.customer.id);

  return (
    <AdminSection
      title="Pressupostos"
      description={`${data.proposals.length} pressupost${data.proposals.length !== 1 ? 's' : ''} ·${drafts.length > 0 ? ` ${drafts.length} esborrany` : ''}${sent.length > 0 ? ` · ${sent.length} pendent${sent.length !== 1 ? 's' : ''}` : ''}`}
      actions={<Link href={customerProposalHref} className="ap-btn ap-btn--primary ap-btn--xs" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.newProposal)}>+ Nou pressupost</Link>}
      help={ADMIN_CUSTOMER_PANEL_HELP_2.proposals.root}
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-[var(--o-r-xl)] border border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] px-3 py-2 text-sm leading-snug text-[var(--o-danger)]">{error}</div>}
        {drafts.length > 0 && <ProposalGroup title="Esborranys" icon="📝" proposals={drafts} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} />}
        {sent.length > 0 && <ProposalGroup title="Pendents de resposta" icon="📤" proposals={sent} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} />}
        {closed.length > 0 && <ProposalGroup title="Històric" icon="📚" proposals={closed} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} collapsed />}
        {data.proposals.length === 0 && (
          <AdminEmptyState
            icon="📄"
            title="No hi ha pressupostos per aquest client."
            action={<Link href={customerProposalHref} className="ap-btn ap-btn--primary ap-btn--xs">Crear primer pressupost</Link>}
          />
        )}
      </div>
    </AdminSection>
  );
}

function ProposalGroup({ title, icon, proposals, busyId, confirmingId, setConfirmingId, onSend, onUpdateStatus, customerId, collapsed = false }: { title: string; icon: string; proposals: ProposalDTO[]; busyId: string | null; confirmingId: string | null; setConfirmingId: (id: string | null) => void; onSend: (id: string) => Promise<void>; onUpdateStatus: (id: string, status: ProposalStatus) => Promise<void>; customerId: string; collapsed?: boolean; }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  return (
    <div className="overflow-hidden rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--panel)]" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.group(title))}>
      <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="flex w-full items-center justify-between gap-3 border-0 bg-transparent px-5 py-3 text-left text-[var(--t)] transition-colors hover:bg-[var(--ax-fill-2)]">
        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--t)]"><span>{icon}</span>{title}<span className="rounded-full bg-[var(--ax-fill-3)] px-2 py-0.5 text-xs leading-tight text-[var(--t2)]">{proposals.length}</span></span>
        <span className={`text-[var(--t3)] transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>▾</span>
      </button>
      {!isCollapsed && <div className="flex flex-col gap-2 border-t border-[var(--o-admin-line)] p-3">{proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} busyId={busyId} isConfirming={confirmingId === proposal.id} onConfirm={() => setConfirmingId(proposal.id)} onCancelConfirm={() => setConfirmingId(null)} onSend={() => onSend(proposal.id)} onUpdateStatus={(status) => onUpdateStatus(proposal.id, status)} customerId={customerId} />)}</div>}
    </div>
  );
}

function ProposalCard({ proposal, busyId, isConfirming, onConfirm, onCancelConfirm, onSend, onUpdateStatus, customerId }: { proposal: ProposalDTO; busyId: string | null; isConfirming: boolean; onConfirm: () => void; onCancelConfirm: () => void; onSend: () => Promise<void>; onUpdateStatus: (status: ProposalStatus) => Promise<void>; customerId: string; }) {
  const router = useRouter();
  const style = getProposalStatusDisplay(proposal.status);
  const isBusy = busyId?.includes(proposal.id) || false;
  const canSend = proposal.status === 'DRAFT';
  const isSentLike = isSentLikeProposalStatus(proposal.status);
  const canRepairSentArtifact = isSentLikeProposalStatus(proposal.status) && !hasCanonicalSentProposalArtifact(proposal);
  const canMarkAccepted = isSentLike && hasCanonicalSentProposalArtifact(proposal);
  const canMarkExpired = isSentLike;
  const canMarkRejected = isSentLike;
  const proposalPdfHref = getCanonicalSentProposalPdfHref(proposal);
  const [contractBusy, setContractBusy] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const contractStatus = proposal.contractStatus;
  const contractRef = proposal.contractReference;
  const contractStyle = contractStatus ? getContractStatusDisplay(contractStatus) : null;
  const canGenerateContract = proposal.status === 'ACCEPTED' && (!contractStatus || (contractStatus === 'DRAFT' && !contractRef));
  const canSendContract = contractStatus === 'DRAFT' && Boolean(contractRef);
  const canMarkSigned = contractStatus === 'SENT';
  const documentSnapshotBadges = buildDocumentSnapshotBadges(proposal);
  const proposalHref = buildCustomerProposalHref(customerId, proposal.id);
  const hasSignedContract = contractStatus === 'SIGNED' || Boolean(proposal.contractSignedAt);
  const contractPdfHref = proposal.contractPdfUrl?.trim() || null;
  const signedContractHref = contractPdfHref || proposalHref;
  const pendingContractPdfHref = contractPdfHref && !hasSignedContract ? contractPdfHref : null;
  const originLinks = buildProposalOriginLinks(proposal, customerId);

  const generateContract = async () => { setContractBusy(true); setContractError(null); try { const res = await fetchWithCsrf(`/api/admin/proposals/${proposal.id}/contract`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); if (!res.ok) { const payload = await res.json().catch(() => ({})); throw new Error(payload?.error || 'Error generant contracte'); } const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `contracte-${res.headers.get('X-Contract-Reference') || proposal.reference}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 10000); router.refresh(); } catch (err) { setContractError(err instanceof Error ? err.message : 'Error'); } finally { setContractBusy(false); } };
  const sendContractEmail = async () => { setContractBusy(true); setContractError(null); try { const res = await fetchWithCsrf(`/api/admin/proposals/${proposal.id}/contract/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); const payload = await res.json().catch(() => ({})); if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Error enviant contracte'); router.refresh(); } catch (err) { setContractError(err instanceof Error ? err.message : 'Error'); } finally { setContractBusy(false); } };
  const updateContractStatus = async (status: 'SIGNED' | 'CANCELLED') => { setContractBusy(true); setContractError(null); try { const res = await fetchWithCsrf(`/api/admin/proposals/${proposal.id}/contract`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); const payload = await res.json().catch(() => ({})); if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Error actualitzant contracte'); router.refresh(); } catch (err) { setContractError(err instanceof Error ? err.message : 'Error'); } finally { setContractBusy(false); } };

  return (
    <div className="rounded-[var(--o-r-xl)] bg-[var(--raised)] p-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.card(proposal.reference))}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="m-0 text-sm font-semibold text-[var(--t)]">{proposal.reference}</p>
            <span className={`${STATUS_PILL} ${style.bg} ${style.text} ${style.border}`}>{labelEstatPressupost(proposal.status)}</span>
          </div>
          <p className="m-0 mt-1 text-xs leading-snug text-[var(--t3)]">Creat {formatDateSimple(proposal.createdAt)} ·<span className="font-semibold text-[var(--t2)]"> {formatCurrency(proposal.total)}</span></p>
          {proposal.sentAt && <p className="m-0 mt-1 text-xs leading-snug text-[var(--t3)]">Enviat {formatDateSimple(proposal.sentAt)}</p>}
          {proposal.acceptedAt && <p className="m-0 mt-1 text-xs leading-snug text-[var(--t3)]">✓ Acceptat {formatDateSimple(proposal.acceptedAt)}</p>}
          {originLinks.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--t3)]">Origen</span>
              {originLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="inline-flex items-center rounded-full border border-[var(--o-admin-line)] bg-[var(--sunk)] px-2 py-0.5 font-semibold text-[var(--t2)] no-underline hover:text-[var(--gold)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          {documentSnapshotBadges.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--t3)]">Foto documental</span>
              {documentSnapshotBadges.map((badge) => (
                <span key={badge.key} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${badge.className}`} title={badge.detail}>
                  {badge.label}
                </span>
              ))}
              <Link href={proposalHref} className="font-semibold text-[var(--gold)] no-underline hover:text-[var(--gold-bright)]">
                Obrir document →
              </Link>
            </div>
          )}
        </div>
        <div className="text-lg font-semibold leading-tight text-[var(--t)]">{formatCurrency(proposal.total)}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link href={proposalHref} className="ap-btn ap-btn--xs">✏️ Editar</Link>
        {proposalPdfHref && (
          <a href={proposalPdfHref} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--xs">
            📄 PDF enviat
          </a>
        )}
        {canSend && !isConfirming && <button type="button" onClick={onConfirm} disabled={isBusy} className="ap-btn ap-btn--xs">📤 Enviar</button>}
        {canRepairSentArtifact && <button type="button" onClick={onSend} disabled={isBusy} className="ap-btn ap-btn--xs">{isBusy ? '...' : '📄 Reparar PDF'}</button>}
        {canSend && isConfirming && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] px-2 py-1.5 text-xs text-[var(--t2)]">
            <span>Confirmes l&apos;enviament?</span>
            <button type="button" onClick={onSend} disabled={isBusy} className="ap-btn ap-btn--primary ap-btn--xs">{isBusy ? '...' : 'Sí'}</button>
            <button type="button" onClick={onCancelConfirm} disabled={isBusy} className="ap-btn ap-btn--xs">No</button>
          </div>
        )}
        {canMarkAccepted && <button type="button" onClick={() => onUpdateStatus('ACCEPTED')} disabled={isBusy} className="ap-btn ap-btn--xs">{busyId === `status-${proposal.id}-ACCEPTED` ? '...' : '✅ Acceptat'}</button>}
        {canMarkExpired && <button type="button" onClick={() => onUpdateStatus('EXPIRED')} disabled={isBusy} className="ap-btn ap-btn--xs">{busyId === `status-${proposal.id}-EXPIRED` ? '...' : '⏰ Caducat'}</button>}
        {canMarkRejected && <button type="button" onClick={() => onUpdateStatus('REJECTED')} disabled={isBusy} className="ap-btn ap-btn--xs">{busyId === `status-${proposal.id}-REJECTED` ? '...' : '❌ Rebutjat'}</button>}
      </div>
      {proposal.status === 'ACCEPTED' && (
        <div className="mt-3 border-t border-[var(--o-admin-line)] pt-3" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.contract)}>
          <div className="flex flex-wrap items-center gap-2">
            {contractStatus && contractRef && contractStyle && <span className="inline-flex flex-wrap items-center gap-2 text-xs text-[var(--t2)]">📄 Contracte {contractRef}<span className={`${STATUS_PILL} ${contractStyle.bg} ${contractStyle.text} ${contractStyle.border}`}>{contractStyle.label}</span></span>}
            {canGenerateContract && <button type="button" onClick={generateContract} disabled={contractBusy} className="ap-btn ap-btn--primary ap-btn--xs">{contractBusy ? '...' : '📄 Generar contracte'}</button>}
            {canSendContract && <button type="button" onClick={sendContractEmail} disabled={contractBusy} className="ap-btn ap-btn--xs">📧 Enviar contracte</button>}
            {pendingContractPdfHref && <a href={pendingContractPdfHref} target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--xs">📄 PDF contracte</a>}
            {canMarkSigned && <button type="button" onClick={() => updateContractStatus('SIGNED')} disabled={contractBusy} className="ap-btn ap-btn--xs">✍️ Marcar signat</button>}
            {contractStatus && contractStatus !== 'CANCELLED' && contractStatus !== 'SIGNED' && <button type="button" onClick={() => updateContractStatus('CANCELLED')} disabled={contractBusy} className="ap-btn ap-btn--xs">🚫 Cancel·lar</button>}
          </div>
          {hasSignedContract && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--sunk)] px-3 py-2 text-xs">
              <span className="font-semibold text-[var(--t)]">Contracte signat</span>
              {proposal.contractSignedAt && <span className="text-[var(--t3)]">Signat {formatDateSimple(proposal.contractSignedAt)}</span>}
              <Link
                href={signedContractHref}
                target={proposal.contractPdfUrl ? '_blank' : undefined}
                rel={proposal.contractPdfUrl ? 'noopener noreferrer' : undefined}
                className="font-semibold text-[var(--gold)] no-underline hover:text-[var(--gold-bright)]"
              >
                {proposal.contractPdfUrl ? 'Obrir PDF signat' : 'Obrir contracte'} →
              </Link>
            </div>
          )}
          {contractError && <p className="m-0 mt-2 text-xs leading-snug text-[var(--o-danger)]">{contractError}</p>}
        </div>
      )}
    </div>
  );
}
