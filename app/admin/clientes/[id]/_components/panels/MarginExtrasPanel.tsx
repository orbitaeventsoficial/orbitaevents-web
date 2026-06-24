import Link from 'next/link';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatNumber } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';

export default function MarginExtrasPanel({ data, activeProposalId }: { data: CustomerHubDTO; activeProposalId?: string; }) {
  const active = activeProposalId ? data.proposals.find((p) => p.id === activeProposalId) : undefined;
  const snapshot = (active?.snapshot || {}) as Record<string, unknown>;
  const subtotal = typeof snapshot.subtotal === 'number' ? snapshot.subtotal : undefined;
  const total = typeof snapshot.total === 'number' ? snapshot.total : undefined;
  const discount = typeof snapshot.discount === 'number' ? snapshot.discount : undefined;
  const margin = typeof subtotal === 'number' && typeof total === 'number' ? total - subtotal : undefined;

  return (
    <section className="ch__margin-panel" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.margin.root)}>
      <h2 className="ch__margin-heading">Extres / Marge</h2>
      <p className="ch__margin-summary">Document actiu: {data.active.source} {active?.reference ? `· ${active.reference}` : ''}</p>
      <div className="ch__margin-grid">
        <Metric label="Subtotal" value={money(subtotal)} />
        <Metric label="Descompte" value={money(discount)} />
        <Metric label="Total" value={money(total)} />
        <Metric label="Marge estimat" value={money(margin)} />
      </div>
      <div className="ch__margin-studio" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.margin.studio)}>
        <span>Per editar extres i cost real, obre l&apos;Studio amb el proposal actiu.</span>
        {active && <Link href={buildCustomerProposalHref(data.customer.id, active.id)} className="ch__margin-studio-link" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.margin.openStudio)}>Obrir Studio →</Link>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ch__margin-metric" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.margin.metric(label))}>
      <p className="ch__margin-metric-label">{label}</p>
      <p className="ch__margin-metric-value">{value}</p>
    </div>
  );
}

function money(value?: number) {
  if (typeof value !== 'number') return '—';
  return `${formatNumber(value, { maximumFractionDigits: 2 })}€`;
}
