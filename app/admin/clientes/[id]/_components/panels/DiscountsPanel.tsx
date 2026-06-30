import type { CustomerHubDTO, DiscountCodeDTO } from '@/lib/customer-hub/dto';
import { formatDateSimple, getDiscountSourceLabel } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { AdminSection } from '@/app/admin/components/AdminPage';

const STATUS_BASE = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight';

function getStatus(dc: DiscountCodeDTO): { label: string; color: string } {
  if (!dc.isActive) return { label: 'Desactivat', color: 'border-[var(--line2)] bg-[var(--ax-fill-3)] text-[var(--t3)]' };
  if (dc.currentUses >= dc.maxUses) return { label: 'Esgotat', color: 'border-[var(--ax-warning-border)] bg-[var(--ax-warning-bg)] text-[var(--o-warning)]' };
  if (new Date(dc.validUntil) < new Date()) return { label: 'Caducat', color: 'border-[var(--ax-danger-border)] bg-[var(--ax-danger-bg)] text-[var(--o-danger)]' };
  return { label: 'Actiu', color: 'border-[var(--ax-success-border)] bg-[var(--ax-success-bg)] text-[var(--o-success)]' };
}

export default function DiscountsPanel({ data }: { data: CustomerHubDTO }) {
  const codes = data.discountCodes || [];

  return (
    <AdminSection title="Descomptes" description="Codis de descompte del client." help={ADMIN_CUSTOMER_PANEL_HELP_3.discounts.root}>
      <div className="flex flex-col gap-3">
        {codes.length === 0 ? (
          <p className="m-0 rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-3 text-sm text-[var(--t2)]">Sense codis de descompte.</p>
        ) : (
          codes.map((dc) => {
            const status = getStatus(dc);
            return (
              <div key={dc.id} className="rounded-[var(--o-r-xl)] border border-[var(--o-admin-line)] bg-[var(--raised)] p-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.discounts.card(dc.code))}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded-[var(--o-r-md)] bg-[var(--ax-fill-3)] px-2 py-1 font-mono text-sm text-[var(--t)]">{dc.code}</code>
                    <span className="text-lg font-semibold leading-tight text-[var(--t)]">-{dc.discountPercent}%</span>
                  </div>
                  <span className={`${STATUS_BASE} ${status.color}`}>{status.label}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-snug text-[var(--t2)]">
                  <span>Vàlid: {formatDateSimple(dc.validFrom)} – {formatDateSimple(dc.validUntil)}</span>
                  <span>Usos: {dc.currentUses}/{dc.maxUses}</span>
                  <span>Origen: {getDiscountSourceLabel(dc.sourceType)}</span>
                </div>
                {dc.usedAt && <p className="m-0 mt-1 text-xs leading-snug text-[var(--t2)]">Últim ús: {formatDateSimple(dc.usedAt)}</p>}
              </div>
            );
          })
        )}
      </div>
    </AdminSection>
  );
}
