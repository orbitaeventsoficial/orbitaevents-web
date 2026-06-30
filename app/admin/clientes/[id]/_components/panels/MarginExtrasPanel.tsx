import Link from 'next/link';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatNumber } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminSection } from '@/app/admin/components/AdminPage';
import { buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';

export default function MarginExtrasPanel({ data, activeProposalId }: { data: CustomerHubDTO; activeProposalId?: string; }) {
  const active = activeProposalId ? data.proposals.find((p) => p.id === activeProposalId) : undefined;
  const snapshot = (active?.snapshot || {}) as Record<string, unknown>;
  const subtotal = typeof snapshot.subtotal === 'number' ? snapshot.subtotal : undefined;
  const total = typeof snapshot.total === 'number' ? snapshot.total : undefined;
  const discount = typeof snapshot.discount === 'number' ? snapshot.discount : undefined;
  const margin = typeof subtotal === 'number' && typeof total === 'number' ? total - subtotal : undefined;

  return (
    <AdminSection
      title="Extres / Marge"
      description={`Document actiu: ${data.active.source} ${active?.reference ? `· ${active.reference}` : ''}`}
      help={ADMIN_CUSTOMER_PANEL_HELP_3.margin.root}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Subtotal" value={money(subtotal)} />
        <Metric label="Descompte" value={money(discount)} />
        <Metric label="Total" value={money(total)} />
        <Metric label="Marge estimat" value={money(margin)} />
      </div>
      <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-2)] p-3 text-xs leading-snug text-[var(--t2)] min-[521px]:flex-row min-[521px]:items-center" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.margin.studio)}>
        <span>Per editar extres i cost real, obre l&apos;Studio amb el proposal actiu.</span>
        {active && <Link href={buildCustomerProposalHref(data.customer.id, active.id)} className="ap-btn ap-btn--xs shrink-0" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.margin.openStudio)}>Obrir Studio →</Link>}
      </div>
    </AdminSection>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--ax-fill-2)] p-3" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.margin.metric(label))}>
      <p className="m-0 text-xs leading-tight text-[var(--t3)]">{label}</p>
      <p className="m-0 mt-1 text-lg font-semibold leading-tight text-[var(--t)]">{value}</p>
    </div>
  );
}

function money(value?: number) {
  if (typeof value !== 'number') return '—';
  return `${formatNumber(value, { maximumFractionDigits: 2 })}€`;
}
