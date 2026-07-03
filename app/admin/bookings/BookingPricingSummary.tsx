/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Resum de preus
   ----------------------------------------------------------------------------
   Canònic: .ap-card + Tailwind/tokens (canonització 2026-06-30, sistema
   propi `nb-*` eradicat). Viu dins la sidebar sticky — total daurat i
   daurat prominent, marge resumit a sota.
============================================================================ */

import { formatCurrency, formatCurrencyExact } from '@/lib/constants';
import { DEPOSIT_PERCENT } from '@/lib/constants/pricing';

interface BookingPricingSummaryProps {
  pricing: {
    packPrice: number;
    extraHoursPrice: number;
    extrasPrice: number;
    travelCharge: number;
    subtotal: number;
    discount: number;
    vatRate: number;
    vatAmount: number;
    total: number;
    deposit: number;
  };
  travelBlocks: number;
  internalTravelCost: number;
  defaultVehicleCostPerKm: number;
  marginEstimate: {
    directCost: number;
    netMargin: number;
    marginPct: number;
    tone: 'emerald' | 'amber' | 'orange' | 'rose';
    label: string;
  } | null;
}

const ROW = 'flex items-baseline justify-between gap-3.5 border-b border-[color-mix(in_oklab,var(--line)_50%,transparent)] py-1.5 text-sm text-[var(--t2)] last:border-b-0';
const ROW_VAL = 'font-mono font-bold tabular-nums text-[var(--t)]';
const ROW_MUTED = 'flex items-baseline justify-between gap-3.5 py-1.5 text-xs text-[var(--t3)]';

const MARGIN_TONE: Record<'emerald' | 'amber' | 'orange' | 'rose', string> = {
  emerald: 'text-[var(--o-success)]',
  amber: 'text-[var(--o-warning)]',
  orange: 'text-[var(--o-stage-new)]',
  rose: 'text-[var(--o-danger)]',
};

export default function BookingPricingSummary({
  pricing,
  travelBlocks,
  internalTravelCost,
  defaultVehicleCostPerKm,
  marginEstimate,
}: BookingPricingSummaryProps) {
  return (
    <div className="ap-card ap-card-body bg-[color-mix(in_oklab,var(--gold)_4%,var(--panel))]">
      <div className="mb-3.5 flex items-baseline justify-between">
        <h3 className="text-base font-bold text-[var(--t)]">Resum de preus</h3>
        <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--t3)]">Live</span>
      </div>
      <div className="flex flex-col">
        <div className={ROW}>
          <span>Pack</span>
          <b className={ROW_VAL}>{formatCurrencyExact(pricing.packPrice)}</b>
        </div>
        {pricing.extraHoursPrice > 0 && (
          <div className={ROW}>
            <span>Hores extra</span>
            <b className={ROW_VAL}>+{formatCurrencyExact(pricing.extraHoursPrice)}</b>
          </div>
        )}
        {pricing.extrasPrice > 0 && (
          <div className={ROW}>
            <span>Extres</span>
            <b className={ROW_VAL}>+{formatCurrencyExact(pricing.extrasPrice)}</b>
          </div>
        )}
        {pricing.travelCharge > 0 && (
          <div className={ROW}>
            <span>Desplaçament (transport real)</span>
            <b className={ROW_VAL}>+{formatCurrencyExact(pricing.travelCharge)}</b>
          </div>
        )}
        <div className={ROW}>
          <span>Subtotal</span>
          <b className={ROW_VAL}>{formatCurrencyExact(pricing.subtotal)}</b>
        </div>
        {pricing.discount > 0 && (
          <div className={ROW}>
            <span>Descompte</span>
            <b className={ROW_VAL}>−{formatCurrencyExact(pricing.discount)}</b>
          </div>
        )}
        <div className={ROW}>
          <span>IVA ({pricing.vatRate}%)</span>
          <b className={ROW_VAL}>+{formatCurrencyExact(pricing.vatAmount)}</b>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3.5 border-t border-[var(--hair-gold)] pb-1 pt-3 text-base font-bold text-[var(--gold-bright)]">
          <span>Total</span>
          <b className="text-xl font-extrabold tabular-nums tracking-tight text-[var(--gold-bright)]">{formatCurrencyExact(pricing.total)}</b>
        </div>
        <div className={ROW_MUTED}>
          <span>Senyal ({DEPOSIT_PERCENT}%)</span>
          <b className="font-mono font-bold tabular-nums text-[var(--t2)]">{formatCurrencyExact(pricing.deposit)}</b>
        </div>
      </div>
      {internalTravelCost > 0 && (
        <p className="py-2 font-mono text-xs leading-snug text-[var(--t3)]">
          Cost intern transport estimat · {formatCurrencyExact(internalTravelCost)} (vehicle {defaultVehicleCostPerKm.toFixed(2)} €/km + temps de ruta si aplica)
        </p>
      )}
      {marginEstimate && (
        <>
          <div className={ROW_MUTED}>
            <span>Cost directe</span>
            <b className="font-mono font-bold tabular-nums text-[var(--t2)]">{formatCurrencyExact(marginEstimate.directCost)}</b>
          </div>
          <div className="mt-2 flex items-baseline justify-between rounded-[var(--o-r-md)] border border-dashed border-[var(--hair-gold)] bg-[color-mix(in_oklab,var(--gold)_4%,transparent)] px-3.5 py-3">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--t3)]">Marge net · {marginEstimate.label}</span>
            <b className={`text-lg font-bold tabular-nums ${MARGIN_TONE[marginEstimate.tone]}`}>
              {formatCurrency(marginEstimate.netMargin)} <small className="text-xs font-semibold text-[var(--t3)]">· {marginEstimate.marginPct.toFixed(0)}%</small>
            </b>
          </div>
        </>
      )}
    </div>
  );
}
