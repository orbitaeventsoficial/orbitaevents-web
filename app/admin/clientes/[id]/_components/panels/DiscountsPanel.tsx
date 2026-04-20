import type { CustomerHubDTO, DiscountCodeDTO } from '@/lib/customer-hub/dto';
import { formatDateSimple, getDiscountSourceLabel } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';

function getStatus(dc: DiscountCodeDTO): { label: string; color: string } {
  if (!dc.isActive) return { label: 'Desactivat', color: 'border-white/10 bg-white/5 text-white/40' };
  if (dc.currentUses >= dc.maxUses) return { label: 'Esgotat', color: 'border-violet-500/50 bg-violet-500/10 text-violet-300' };
  if (new Date(dc.validUntil) < new Date()) return { label: 'Caducat', color: 'border-rose-500/50 bg-rose-500/10 text-rose-300' };
  return { label: 'Actiu', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' };
}

export default function DiscountsPanel({ data }: { data: CustomerHubDTO }) {
  const codes = data.discountCodes || [];

  return (
    <section className="rounded-2xl border p-5" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.discounts.root)}>
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Descomptes</h2><p className="text-sm">Codis de descompte del client.</p></div></div>
      <div className="mt-4 space-y-3">{codes.length === 0 ? <p className="rounded-xl border p-3 text-sm">Sense codis de descompte.</p> : codes.map((dc) => { const status = getStatus(dc); return <div key={dc.id} className="rounded-xl border p-4" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.discounts.card(dc.code))}><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><code className="rounded px-2 py-1 text-sm font-mono">{dc.code}</code><span className="text-lg font-semibold">-{dc.discountPercent}%</span></div><span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${status.color}`}>{status.label}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><span>Vàlid: {formatDateSimple(dc.validFrom)} – {formatDateSimple(dc.validUntil)}</span><span>Usos: {dc.currentUses}/{dc.maxUses}</span><span>Origen: {getDiscountSourceLabel(dc.sourceType)}</span></div>{dc.usedAt && <p className="mt-1 text-[11px]">Últim ús: {formatDateSimple(dc.usedAt)}</p>}</div>; })}</div>
    </section>
  );
}
