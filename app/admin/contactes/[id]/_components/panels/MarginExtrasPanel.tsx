import Link from 'next/link';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';

export default function MarginExtrasPanel({
  data,
  activeProposalId,
}: {
  data: CustomerHubDTO;
  activeProposalId?: string;
}) {
  const active = activeProposalId ? data.proposals.find((p) => p.id === activeProposalId) : undefined;
  const snapshot = (active?.snapshot || {}) as Record<string, unknown>;
  const subtotal = typeof snapshot.subtotal === 'number' ? snapshot.subtotal : undefined;
  const total = typeof snapshot.total === 'number' ? snapshot.total : undefined;
  const discount = typeof snapshot.discount === 'number' ? snapshot.discount : undefined;
  const margin = typeof subtotal === 'number' && typeof total === 'number' ? total - subtotal : undefined;

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Extres / Marge</h2>
      <p className="mt-1 text-sm text-slate-400">
        Document actiu: {data.active.source} {active?.reference ? `· ${active.reference}` : ''}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric label="Subtotal" value={money(subtotal)} />
        <Metric label="Descompte" value={money(discount)} />
        <Metric label="Total" value={money(total)} />
        <Metric label="Marge estimat" value={money(margin)} />
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between">
        <span>Per editar extres i cost real, obre l&apos;Studio amb el proposal actiu.</span>
        {active && (
          <Link
            href={`/admin/presupuestos?proposalId=${active.id}&customerId=${data.customer.id}`}
            className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors ml-3 shrink-0"
          >
            Obrir Studio →
          </Link>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function money(value?: number) {
  if (typeof value !== 'number') return '—';
  return `${value.toLocaleString('ca-ES', { maximumFractionDigits: 2 })}€`;
}

