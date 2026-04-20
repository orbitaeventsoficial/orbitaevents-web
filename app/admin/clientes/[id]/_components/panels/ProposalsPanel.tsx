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
    <section className="space-y-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.root)}>
      <div className="rounded-2xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pressupostos</h2>
            <p className="text-sm">{data.proposals.length} pressupost{data.proposals.length !== 1 ? 's' : ''} ·{drafts.length > 0 && ` ${drafts.length} esborrany`}{sent.length > 0 && ` · ${sent.length} pendent${sent.length !== 1 ? 's' : ''}`}</p>
          </div>
          <Link href={customerProposalHref} className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.newProposal)}>+ Nou pressupost</Link>
        </div>
        {error && <div className="mt-3 rounded-xl border px-3 py-2 text-sm">{error}</div>}
      </div>
      {drafts.length > 0 && <ProposalGroup title="Esborranys" icon="📝" proposals={drafts} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} />}
      {sent.length > 0 && <ProposalGroup title="Pendents de resposta" icon="📤" proposals={sent} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} />}
      {closed.length > 0 && <ProposalGroup title="Històric" icon="📚" proposals={closed} busyId={busyId} confirmingId={confirmingId} setConfirmingId={setConfirmingId} onSend={sendProposal} onUpdateStatus={updateStatus} customerId={data.customer.id} collapsed />}
      {data.proposals.length === 0 && <div className="rounded-2xl border border-dashed p-8 text-center"><p>No hi ha pressupostos per aquest client.</p><Link href={customerProposalHref} className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold text-white">Crear primer pressupost</Link></div>}
    </section>
  );
}

function ProposalGroup({ title, icon, proposals, busyId, confirmingId, setConfirmingId, onSend, onUpdateStatus, customerId, collapsed = false }: { title: string; icon: string; proposals: ProposalDTO[]; busyId: string | null; confirmingId: string | null; setConfirmingId: (id: string | null) => void; onSend: (id: string) => Promise<void>; onUpdateStatus: (id: string, status: ProposalStatus) => Promise<void>; customerId: string; collapsed?: boolean; }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  return (
    <div className="overflow-hidden rounded-2xl border" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.group(title))}>
      <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors">
        <span className="flex items-center gap-2 text-sm font-medium"><span>{icon}</span>{title}<span className="rounded-full px-2 py-0.5 text-xs">{proposals.length}</span></span>
        <span className={`text-white/40 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>▾</span>
      </button>
      {!isCollapsed && <div className="space-y-2 border-t p-3">{proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} busyId={busyId} isConfirming={confirmingId === proposal.id} onConfirm={() => setConfirmingId(proposal.id)} onCancelConfirm={() => setConfirmingId(null)} onSend={() => onSend(proposal.id)} onUpdateStatus={(status) => onUpdateStatus(proposal.id, status)} customerId={customerId} />)}</div>}
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
    <div className="rounded-xl border p-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.card(proposal.reference))}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><p className="text-sm font-semibold">{proposal.reference}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text} ${style.border}`}>{labelEstatPressupost(proposal.status)}</span></div><p className="mt-1 text-xs">Creat {formatDateSimple(proposal.createdAt)} ·<span className="font-medium"> {formatCurrency(proposal.total)}</span></p>{proposal.sentAt && <p className="text-[11px]">Enviat {formatDateSimple(proposal.sentAt)}</p>}{proposal.acceptedAt && <p className="text-[11px]">✓ Acceptat {formatDateSimple(proposal.acceptedAt)}</p>}</div><div className="text-lg font-semibold">{formatCurrency(proposal.total)}</div></div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><Link href={buildCustomerProposalHref(customerId, proposal.id)} className="rounded border px-2.5 py-1.5 text-xs transition-colors">✏️ Editar</Link>{canSend && !isConfirming && <button type="button" onClick={onConfirm} disabled={isBusy} className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50">📤 Enviar</button>}{canSend && isConfirming && <div className="flex items-center gap-1 rounded-xl border px-2 py-1"><span className="text-xs">Confirmes l'enviament?</span><button type="button" onClick={onSend} disabled={isBusy} className="rounded px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50">{isBusy ? '...' : 'Sí'}</button><button type="button" onClick={onCancelConfirm} disabled={isBusy} className="rounded px-2 py-0.5 text-xs">No</button></div>}{canMarkAccepted && <button type="button" onClick={() => onUpdateStatus('ACCEPTED')} disabled={isBusy} className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50">{busyId === `status-${proposal.id}-ACCEPTED` ? '...' : '✅ Acceptat'}</button>}{canMarkExpired && <button type="button" onClick={() => onUpdateStatus('EXPIRED')} disabled={isBusy} className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50">{busyId === `status-${proposal.id}-EXPIRED` ? '...' : '⏰ Caducat'}</button>}{proposal.status === 'SENT' && <button type="button" onClick={() => onUpdateStatus('REJECTED')} disabled={isBusy} className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50">{busyId === `status-${proposal.id}-REJECTED` ? '...' : '❌ Rebutjat'}</button>}</div>
      {proposal.status === 'ACCEPTED' && <div className="mt-3 border-t pt-3" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_2.proposals.contract)}><div className="flex flex-wrap items-center gap-2">{contractStatus && contractRef && contractStyle && <span className="flex items-center gap-1.5 text-xs">📄 Contracte {contractRef}<span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${contractStyle.bg} ${contractStyle.text} ${contractStyle.border}`}>{contractStyle.label}</span></span>}{canGenerateContract && <button type="button" onClick={generateContract} disabled={contractBusy} className="rounded border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50">{contractBusy ? '...' : '📄 Generar contracte'}</button>}{canSendContract && <button type="button" onClick={sendContractEmail} disabled={contractBusy} className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50">{contractBusy ? '...' : '📧 Enviar contracte'}</button>}{canMarkSigned && <button type="button" onClick={() => updateContractStatus('SIGNED')} disabled={contractBusy} className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50">{contractBusy ? '...' : '✍️ Marcar signat'}</button>}{contractStatus && contractStatus !== 'CANCELLED' && contractStatus !== 'SIGNED' && <button type="button" onClick={() => updateContractStatus('CANCELLED')} disabled={contractBusy} className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50">{contractBusy ? '...' : '🚫 Cancel·lar'}</button>}</div>{contractError && <p className="mt-2 text-xs">{contractError}</p>}</div>}
    </div>
  );
}
