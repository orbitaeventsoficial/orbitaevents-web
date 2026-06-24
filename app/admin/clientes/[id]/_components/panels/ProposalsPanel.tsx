'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CustomerHubDTO, ProposalDTO, ProposalStatus } from '@/lib/customer-hub/dto';
import { labelEstatPressupost } from '@/lib/customer-hub/labels';
import { formatCurrency, formatDateSimple, getContractStatusDisplay, getProposalStatusDisplay } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_CUSTOMER_PANEL_HELP_2, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';

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
  const sent = data.proposals.filter((proposal) => proposal.status === 'SENT' || proposal.status === 'VIEWED');
  const closed = data.proposals.filter((proposal) => proposal.status === 'ACCEPTED' || proposal.status === 'REJECTED' || proposal.status === 'EXPIRED');
  const customerProposalHref = buildCustomerProposalHref(data.customer.id);

  return (
    <section className="ch__proposals-stack" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.root)}>
      <div className="ch__proposals-panel">
        <div className="ch__proposals-head">
          <div>
            <h2 className="ch__proposals-title">Pressupostos</h2>
            <p className="ch__proposals-summary">{data.proposals.length} pressupost{data.proposals.length !== 1 ? 's' : ''} ·{drafts.length > 0 && ` ${drafts.length} esborrany`}{sent.length > 0 && ` · ${sent.length} pendent${sent.length !== 1 ? 's' : ''}`}</p>
          </div>
          <Link href={customerProposalHref} className="ap-btn ap-btn--primary" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.newProposal)}>+ Nou pressupost</Link>
        </div>
        {error && <div className="ch__proposal-error">{error}</div>}
      </div>
      {drafts.length > 0 && <ProposalGroup title="Esborranys" icon="📝" proposals={drafts} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} />}
      {sent.length > 0 && <ProposalGroup title="Pendents de resposta" icon="📤" proposals={sent} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} />}
      {closed.length > 0 && <ProposalGroup title="Històric" icon="📚" proposals={closed} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} collapsed />}
      {data.proposals.length === 0 && <div className="ch__proposals-empty"><p>No hi ha pressupostos per aquest client.</p><Link href={customerProposalHref} className="ap-btn ap-btn--primary">Crear primer pressupost</Link></div>}
    </section>
  );
}

function ProposalGroup({ title, icon, proposals, busyId, confirmingId, setConfirmingId, onSend, onUpdateStatus, customerId, collapsed = false }: { title: string; icon: string; proposals: ProposalDTO[]; busyId: string | null; confirmingId: string | null; setConfirmingId: (id: string | null) => void; onSend: (id: string) => Promise<void>; onUpdateStatus: (id: string, status: ProposalStatus) => Promise<void>; customerId: string; collapsed?: boolean; }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  return (
    <div className="ch__proposal-group" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.group(title))}>
      <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="ch__proposal-group-toggle">
        <span className="ch__proposal-group-title"><span>{icon}</span>{title}<span className="ch__proposal-count">{proposals.length}</span></span>
        <span className="ch__proposal-caret" data-open={!isCollapsed}>▾</span>
      </button>
      {!isCollapsed && <div className="ch__proposal-list">{proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} busyId={busyId} isConfirming={confirmingId === proposal.id} onConfirm={() => setConfirmingId(proposal.id)} onCancelConfirm={() => setConfirmingId(null)} onSend={() => onSend(proposal.id)} onUpdateStatus={(status) => onUpdateStatus(proposal.id, status)} customerId={customerId} />)}</div>}
    </div>
  );
}

function ProposalCard({ proposal, busyId, isConfirming, onConfirm, onCancelConfirm, onSend, onUpdateStatus, customerId }: { proposal: ProposalDTO; busyId: string | null; isConfirming: boolean; onConfirm: () => void; onCancelConfirm: () => void; onSend: () => Promise<void>; onUpdateStatus: (status: ProposalStatus) => Promise<void>; customerId: string; }) {
  const router = useRouter();
  const style = getProposalStatusDisplay(proposal.status);
  const isBusy = busyId?.includes(proposal.id) || false;
  const canSend = proposal.status === 'DRAFT';
  const canMarkAccepted = proposal.status === 'SENT' || proposal.status === 'VIEWED';
  const canMarkExpired = proposal.status === 'SENT' || proposal.status === 'VIEWED';
  const [contractBusy, setContractBusy] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const contractStatus = proposal.contractStatus;
  const contractRef = proposal.contractReference;
  const contractStyle = contractStatus ? getContractStatusDisplay(contractStatus) : null;
  const canGenerateContract = proposal.status === 'ACCEPTED' && !contractStatus;
  const canSendContract = contractStatus === 'DRAFT';
  const canMarkSigned = contractStatus === 'SENT';

  const generateContract = async () => { setContractBusy(true); setContractError(null); try { const res = await fetchWithCsrf(`/api/admin/proposals/${proposal.id}/contract`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); if (!res.ok) { const payload = await res.json().catch(() => ({})); throw new Error(payload?.error || 'Error generant contracte'); } const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `contracte-${res.headers.get('X-Contract-Reference') || proposal.reference}.pdf`; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 10000); router.refresh(); } catch (err) { setContractError(err instanceof Error ? err.message : 'Error'); } finally { setContractBusy(false); } };
  const sendContractEmail = async () => { setContractBusy(true); setContractError(null); try { const res = await fetchWithCsrf(`/api/admin/proposals/${proposal.id}/contract/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); const payload = await res.json().catch(() => ({})); if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Error enviant contracte'); router.refresh(); } catch (err) { setContractError(err instanceof Error ? err.message : 'Error'); } finally { setContractBusy(false); } };
  const updateContractStatus = async (status: 'SIGNED' | 'CANCELLED') => { setContractBusy(true); setContractError(null); try { const res = await fetchWithCsrf(`/api/admin/proposals/${proposal.id}/contract`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); const payload = await res.json().catch(() => ({})); if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'Error actualitzant contracte'); router.refresh(); } catch (err) { setContractError(err instanceof Error ? err.message : 'Error'); } finally { setContractBusy(false); } };

  return (
    <div className="ch__proposal-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.card(proposal.reference))}>
      <div className="ch__proposal-card-head">
        <div>
          <div className="ch__proposal-ref-row">
            <p className="ch__proposal-ref">{proposal.reference}</p>
            <span className={`ch__proposal-status ${style.bg} ${style.text} ${style.border}`}>{labelEstatPressupost(proposal.status)}</span>
          </div>
          <p className="ch__proposal-meta">Creat {formatDateSimple(proposal.createdAt)} ·<span> {formatCurrency(proposal.total)}</span></p>
          {proposal.sentAt && <p className="ch__proposal-meta">Enviat {formatDateSimple(proposal.sentAt)}</p>}
          {proposal.acceptedAt && <p className="ch__proposal-meta">✓ Acceptat {formatDateSimple(proposal.acceptedAt)}</p>}
        </div>
        <div className="ch__proposal-total">{formatCurrency(proposal.total)}</div>
      </div>
      <div className="ch__proposal-actions">
        <Link href={buildCustomerProposalHref(customerId, proposal.id)} className="ch__proposal-action">✏️ Editar</Link>
        {canSend && !isConfirming && <button type="button" onClick={onConfirm} disabled={isBusy} className="ch__proposal-action">📤 Enviar</button>}
        {canSend && isConfirming && (
          <div className="ch__proposal-confirm">
            <span>Confirmes l'enviament?</span>
            <button type="button" onClick={onSend} disabled={isBusy} className="ch__proposal-action ch__proposal-action--strong">{isBusy ? '...' : 'Sí'}</button>
            <button type="button" onClick={onCancelConfirm} disabled={isBusy} className="ch__proposal-action ch__proposal-action--plain">No</button>
          </div>
        )}
        {canMarkAccepted && <button type="button" onClick={() => onUpdateStatus('ACCEPTED')} disabled={isBusy} className="ch__proposal-action">{busyId === `status-${proposal.id}-ACCEPTED` ? '...' : '✅ Acceptat'}</button>}
        {canMarkExpired && <button type="button" onClick={() => onUpdateStatus('EXPIRED')} disabled={isBusy} className="ch__proposal-action">{busyId === `status-${proposal.id}-EXPIRED` ? '...' : '⏰ Caducat'}</button>}
        {proposal.status === 'SENT' && <button type="button" onClick={() => onUpdateStatus('REJECTED')} disabled={isBusy} className="ch__proposal-action">{busyId === `status-${proposal.id}-REJECTED` ? '...' : '❌ Rebutjat'}</button>}
      </div>
      {proposal.status === 'ACCEPTED' && (
        <div className="ch__proposal-contract" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.contract)}>
          <div className="ch__proposal-actions">
            {contractStatus && contractRef && contractStyle && <span className="ch__proposal-contract-ref">📄 Contracte {contractRef}<span className={`ch__proposal-status ${contractStyle.bg} ${contractStyle.text} ${contractStyle.border}`}>{contractStyle.label}</span></span>}
            {canGenerateContract && <button type="button" onClick={generateContract} disabled={contractBusy} className="ch__proposal-action ch__proposal-action--strong">{contractBusy ? '...' : '📄 Generar contracte'}</button>}
            {canSendContract && <button type="button" onClick={sendContractEmail} disabled={contractBusy} className="ch__proposal-action">📧 Enviar contracte</button>}
            {canMarkSigned && <button type="button" onClick={() => updateContractStatus('SIGNED')} disabled={contractBusy} className="ch__proposal-action">✍️ Marcar signat</button>}
            {contractStatus && contractStatus !== 'CANCELLED' && contractStatus !== 'SIGNED' && <button type="button" onClick={() => updateContractStatus('CANCELLED')} disabled={contractBusy} className="ch__proposal-action">🚫 Cancel·lar</button>}
          </div>
          {contractError && <p className="ch__proposal-error">{contractError}</p>}
        </div>
      )}
    </div>
  );
}
