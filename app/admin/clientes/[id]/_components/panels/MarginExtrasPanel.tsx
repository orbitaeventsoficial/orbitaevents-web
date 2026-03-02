import Link from 'next/link';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatNumber } from '@/lib/constants';

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
    <section className="rounded-2xl border p-5">
      <h2 className="text-lg font-semibold">Extres / Marge</h2>
      <p className="mt-1 text-sm">
        Document actiu: {data.active.source} {active?.reference ? `· ${active.reference}` : ''}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric label="Subtotal" value={money(subtotal)} />
        <Metric label="Descompte" value={money(discount)} />
        <Metric label="Total" value={money(total)} />
        <Metric label="Marge estimat" value={money(margin)} />
      </div>

      <div className="mt-4 rounded-xl border p-3 text-xs flex items-center justify-between">
        <span>Per editar extres i cost real, obre l&apos;Studio amb el proposal actiu.</span>
        {active && (
          <Link
            href={`/admin/presupuestos?proposalId=${active.id}&customerId=${data.customer.id}`}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ml-3 shrink-0"
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
    <div className="rounded-xl border p-3">
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function money(value?: number) {
  if (typeof value !== 'number') return '—';
  return `${formatNumber(value, { maximumFractionDigits: 2 })}€`;
}

