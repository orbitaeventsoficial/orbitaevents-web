'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CustomerHubDTO, ProposalDTO, ProposalStatus } from '@/lib/customer-hub/dto';
import { labelEstatPressupost } from '@/lib/customer-hub/labels';

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_STYLES: Record<ProposalStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40' },
  SENT: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40' },
  VIEWED: { bg: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/40' },
  ACCEPTED: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  REJECTED: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40' },
  EXPIRED: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ProposalsPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendProposal = useCallback(async (proposalId: string) => {
    setBusyId(`send-${proposalId}`);
    setError(null);
    setConfirmingId(null);

    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No s'ha pogut enviar el pressupost");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enviant pressupost');
    } finally {
      setBusyId(null);
    }
  }, [router]);

  const updateStatus = useCallback(async (proposalId: string, status: ProposalStatus) => {
    setBusyId(`status-${proposalId}-${status}`);
    setError(null);

    try {
      const payload: Record<string, unknown> = { status };
      if (status === 'ACCEPTED') payload.acceptedAt = new Date().toISOString();

      const res = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No s'ha pogut actualitzar l'estat");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualitzant');
    } finally {
      setBusyId(null);
    }
  }, [router]);

  // Separar per estat
  const drafts = data.proposals.filter((p) => p.status === 'DRAFT');
  const sent = data.proposals.filter((p) => p.status === 'SENT' || p.status === 'VIEWED');
  const closed = data.proposals.filter((p) => 
    p.status === 'ACCEPTED' || p.status === 'REJECTED' || p.status === 'EXPIRED'
  );

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pressupostos</h2>
            <p className="text-sm">
              {data.proposals.length} pressupost{data.proposals.length !== 1 ? 's' : ''} · 
              {drafts.length > 0 && ` ${drafts.length} esborrany`}
              {sent.length > 0 && ` · ${sent.length} pendent${sent.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href={`/admin/presupuestos?customerId=${data.customer.id}`}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            + Nou pressupost
          </Link>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border px-3 py-2 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Esborranys */}
      {drafts.length > 0 && (
        <ProposalGroup
          title="Esborranys"
          icon="📝"
          proposals={drafts}
          busyId={busyId}
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onSend={sendProposal}
          onUpdateStatus={updateStatus}
          customerId={data.customer.id}
        />
      )}

      {/* Pendents de resposta */}
      {sent.length > 0 && (
        <ProposalGroup
          title="Pendents de resposta"
          icon="📤"
          proposals={sent}
          busyId={busyId}
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onSend={sendProposal}
          onUpdateStatus={updateStatus}
          customerId={data.customer.id}
        />
      )}

      {/* Tancats */}
      {closed.length > 0 && (
        <ProposalGroup
          title="Històric"
          icon="📚"
          proposals={closed}
          busyId={busyId}
          confirmingId={confirmingId}
          setConfirmingId={setConfirmingId}
          onSend={sendProposal}
          onUpdateStatus={updateStatus}
          customerId={data.customer.id}
          collapsed
        />
      )}

      {/* Sense pressupostos */}
      {data.proposals.length === 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="">No hi ha pressupostos per aquest client.</p>
          <Link
            href={`/admin/presupuestos?customerId=${data.customer.id}`}
            className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Crear primer pressupost
          </Link>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ProposalGroup({
  title,
  icon,
  proposals,
  busyId,
  confirmingId,
  setConfirmingId,
  onSend,
  onUpdateStatus,
  customerId,
  collapsed = false,
}: {
  title: string;
  icon: string;
  proposals: ProposalDTO[];
  busyId: string | null;
  confirmingId: string | null;
  setConfirmingId: (id: string | null) => void;
  onSend: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: ProposalStatus) => Promise<void>;
  customerId: string;
  collapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  return (
    <div className="rounded-2xl border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <span>{icon}</span>
          {title}
          <span className="rounded-full px-2 py-0.5 text-xs">
            {proposals.length}
          </span>
        </span>
        <span className={`text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
          ▾
        </span>
      </button>

      {!isCollapsed && (
        <div className="border-t p-3 space-y-2">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              busyId={busyId}
              isConfirming={confirmingId === proposal.id}
              onConfirm={() => setConfirmingId(proposal.id)}
              onCancelConfirm={() => setConfirmingId(null)}
              onSend={() => onSend(proposal.id)}
              onUpdateStatus={(status) => onUpdateStatus(proposal.id, status)}
              customerId={customerId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalCard({
  proposal,
  busyId,
  isConfirming,
  onConfirm,
  onCancelConfirm,
  onSend,
  onUpdateStatus,
  customerId,
}: {
  proposal: ProposalDTO;
  busyId: string | null;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onSend: () => Promise<void>;
  onUpdateStatus: (status: ProposalStatus) => Promise<void>;
  customerId: string;
}) {
  const style = STATUS_STYLES[proposal.status];
  const isBusy = busyId?.includes(proposal.id) || false;
  const canSend = proposal.status === 'DRAFT';
  const canMarkAccepted = proposal.status === 'SENT' || proposal.status === 'VIEWED';
  const canMarkExpired = proposal.status === 'SENT' || proposal.status === 'VIEWED';

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{proposal.reference}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text} ${style.border}`}>
              {labelEstatPressupost(proposal.status)}
            </span>
          </div>
          <p className="mt-1 text-xs">
            Creat {new Date(proposal.createdAt).toLocaleDateString('ca-ES')} · 
            <span className="font-medium"> {proposal.total.toFixed(2)}€</span>
          </p>
          {proposal.sentAt && (
            <p className="text-[11px]">
              Enviat {new Date(proposal.sentAt).toLocaleDateString('ca-ES')}
            </p>
          )}
          {proposal.acceptedAt && (
            <p className="text-[11px]">
              ✓ Acceptat {new Date(proposal.acceptedAt).toLocaleDateString('ca-ES')}
            </p>
          )}
        </div>

        <div className="text-lg font-semibold">
          {proposal.total.toFixed(0)}€
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/presupuestos?proposalId=${proposal.id}&customerId=${customerId}`}
          className="rounded border px-2.5 py-1.5 text-xs transition-colors"
        >
          ✏️ Editar
        </Link>

        {canSend && !isConfirming && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            📤 Enviar
          </button>
        )}

        {canSend && isConfirming && (
          <div className="flex items-center gap-1 rounded-lg border px-2 py-1">
            <span className="text-xs">Confirmes l'enviament?</span>
            <button
              type="button"
              onClick={onSend}
              disabled={isBusy}
              className="rounded px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {isBusy ? '...' : 'Sí'}
            </button>
            <button
              type="button"
              onClick={onCancelConfirm}
              disabled={isBusy}
              className="rounded px-2 py-0.5 text-xs"
            >
              No
            </button>
          </div>
        )}

        {canMarkAccepted && (
          <button
            type="button"
            onClick={() => onUpdateStatus('ACCEPTED')}
            disabled={isBusy}
            className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            {busyId === `status-${proposal.id}-ACCEPTED` ? '...' : '✅ Acceptat'}
          </button>
        )}

        {canMarkExpired && (
          <button
            type="button"
            onClick={() => onUpdateStatus('EXPIRED')}
            disabled={isBusy}
            className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            {busyId === `status-${proposal.id}-EXPIRED` ? '...' : '⏰ Caducat'}
          </button>
        )}

        {proposal.status === 'SENT' && (
          <button
            type="button"
            onClick={() => onUpdateStatus('REJECTED')}
            disabled={isBusy}
            className="rounded border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            {busyId === `status-${proposal.id}-REJECTED` ? '...' : '❌ Rebutjat'}
          </button>
        )}
      </div>
    </div>
  );
}
