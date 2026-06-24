import type { CustomerHubDTO, DiscountCodeDTO } from '@/lib/customer-hub/dto';
import { formatDateSimple, getDiscountSourceLabel } from '@/lib/constants';
import { ADMIN_CUSTOMER_PANEL_HELP_3, helpAttrs } from '@/app/admin/components/adminHelpContent';

function getStatus(dc: DiscountCodeDTO): { label: string; color: string } {
  if (!dc.isActive) return { label: 'Desactivat', color: 'ch__discount-status--muted' };
  if (dc.currentUses >= dc.maxUses) return { label: 'Esgotat', color: 'ch__discount-status--warning' };
  if (new Date(dc.validUntil) < new Date()) return { label: 'Caducat', color: 'ch__discount-status--danger' };
  return { label: 'Actiu', color: 'ch__discount-status--success' };
}

export default function DiscountsPanel({ data }: { data: CustomerHubDTO }) {
  const codes = data.discountCodes || [];

  return (
    <section className="ch__discounts-panel" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.discounts.root)}>
      <div className="ch__discounts-head">
        <div>
          <h2 className="ch__discounts-title">Descomptes</h2>
          <p className="ch__discounts-summary">Codis de descompte del client.</p>
        </div>
      </div>

      <div className="ch__discounts-list">
        {codes.length === 0 ? (
          <p className="ch__discounts-empty">Sense codis de descompte.</p>
        ) : (
          codes.map((dc) => {
            const status = getStatus(dc);
            return (
              <div key={dc.id} className="ch__discount-card" {...helpAttrs(ADMIN_CUSTOMER_PANEL_HELP_3.discounts.card(dc.code))}>
                <div className="ch__discount-card-head">
                  <div className="ch__discount-code-row">
                    <code className="ch__discount-code">{dc.code}</code>
                    <span className="ch__discount-percent">-{dc.discountPercent}%</span>
                  </div>
                  <span className={`ch__discount-status ${status.color}`}>{status.label}</span>
                </div>
                <div className="ch__discount-meta">
                  <span>Vàlid: {formatDateSimple(dc.validFrom)} – {formatDateSimple(dc.validUntil)}</span>
                  <span>Usos: {dc.currentUses}/{dc.maxUses}</span>
                  <span>Origen: {getDiscountSourceLabel(dc.sourceType)}</span>
                </div>
                {dc.usedAt && <p className="ch__discount-used">Últim ús: {formatDateSimple(dc.usedAt)}</p>}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
