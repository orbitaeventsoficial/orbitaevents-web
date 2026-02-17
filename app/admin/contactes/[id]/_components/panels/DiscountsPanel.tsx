import type { CustomerHubDTO, DiscountCodeDTO } from '@/lib/customer-hub/dto';

const SOURCE_LABELS: Record<string, string> = {
  POST_EVENT: 'Post-event',
  TESTIMONIAL: 'Testimoni',
  REFERRAL: 'Recomanació',
  MANUAL: 'Manual',
};

function getStatus(dc: DiscountCodeDTO): { label: string; color: string } {
  if (!dc.isActive) return { label: 'Desactivat', color: 'border-slate-600 bg-slate-700/20 text-slate-400' };
  if (dc.currentUses >= dc.maxUses) return { label: 'Esgotat', color: 'border-violet-500/50 bg-violet-500/10 text-violet-300' };
  if (new Date(dc.validUntil) < new Date()) return { label: 'Caducat', color: 'border-rose-500/50 bg-rose-500/10 text-rose-300' };
  return { label: 'Actiu', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' };
}

export default function DiscountsPanel({ data }: { data: CustomerHubDTO }) {
  const codes = data.discountCodes || [];

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Descomptes</h2>
          <p className="text-sm text-slate-400">Codis de descompte del client.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {codes.length === 0 ? (
          <p className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-sm text-slate-400">
            Sense codis de descompte.
          </p>
        ) : (
          codes.map((dc) => {
            const status = getStatus(dc);
            return (
              <div key={dc.id} className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-slate-700/60 px-2 py-1 text-sm font-mono text-slate-100">{dc.code}</code>
                    <span className="text-lg font-semibold text-amber-300">-{dc.discountPercent}%</span>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>
                    Vàlid: {new Date(dc.validFrom).toLocaleDateString('ca-ES')} – {new Date(dc.validUntil).toLocaleDateString('ca-ES')}
                  </span>
                  <span>
                    Usos: {dc.currentUses}/{dc.maxUses}
                  </span>
                  <span>
                    Origen: {SOURCE_LABELS[dc.sourceType] || dc.sourceType}
                  </span>
                </div>

                {dc.usedAt && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Últim ús: {new Date(dc.usedAt).toLocaleDateString('ca-ES')}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
