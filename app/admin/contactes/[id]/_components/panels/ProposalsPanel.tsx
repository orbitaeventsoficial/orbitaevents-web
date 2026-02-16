'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { labelEstatPressupost } from '@/lib/customer-hub/labels';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProposalsPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateStatus = async (proposalId: string, status: 'ACCEPTED' | 'EXPIRED') => {
    try {
      setBusyId(proposalId + status);
      const payload: Record<string, unknown> = { status };
      if (status === 'ACCEPTED') payload.acceptedAt = new Date().toISOString();
      const res = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Pressupostos</h2>
          <p className="text-sm text-slate-400">Pressupostos vinculats a aquesta fitxa.</p>
        </div>
        <Link
          href={`/admin/presupuestos?customerId=${data.customer.id}`}
          className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600"
        >
          Nou pressupost
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {data.proposals.length === 0 ? (
          <Empty text="No hi ha pressupostos. Crea’n un des d’aquí." />
        ) : (
          data.proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100">{proposal.reference}</p>
                <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] text-slate-300">
                  {labelEstatPressupost(proposal.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(proposal.createdAt).toLocaleDateString('ca-ES')} · {proposal.total.toFixed(2)}€
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={`/admin/presupuestos?proposalId=${proposal.id}`}
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                >
                  Edita
                </Link>
                <form action={`/api/admin/proposals/${proposal.id}/send`} method="POST">
                  <button
                    type="submit"
                    className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    Envia
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => updateStatus(proposal.id, 'ACCEPTED')}
                  disabled={busyId === proposal.id + 'ACCEPTED'}
                  className="rounded border border-emerald-600/40 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60"
                >
                  {busyId === proposal.id + 'ACCEPTED' ? 'Guardant...' : 'Marcar acceptat'}
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(proposal.id, 'EXPIRED')}
                  disabled={busyId === proposal.id + 'EXPIRED'}
                  className="rounded border border-amber-600/40 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-60"
                >
                  {busyId === proposal.id + 'EXPIRED' ? 'Guardant...' : 'Marcar caducat'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-sm text-slate-400">{text}</p>;
}
