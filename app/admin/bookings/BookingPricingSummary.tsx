/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Resum de preus (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Reescrit al sistema visual nb-* (Canvi #842). Pensat per viure dins la
   sidebar sticky (nb__side) — sense bordes ostentosos, tipografia mono
   tabular, total en daurat prominent, marge resumit a sota.
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
    tone: 'emerald' | 'amber' | 'rose';
  } | null;
}

export default function BookingPricingSummary({
  pricing,
  travelBlocks,
  internalTravelCost,
  defaultVehicleCostPerKm,
  marginEstimate,
}: BookingPricingSummaryProps) {
  return (
    <div className="nb__price">
      <div className="nb__pricehead">
        <h3>Resum de preus</h3>
        <span>Live</span>
      </div>
      <div className="nb__pricerows">
        <div className="nb__prow">
          <span>Pack</span>
          <b>{formatCurrencyExact(pricing.packPrice)}</b>
        </div>
        {pricing.extraHoursPrice > 0 && (
          <div className="nb__prow">
            <span>Hores extra</span>
            <b>+{formatCurrencyExact(pricing.extraHoursPrice)}</b>
          </div>
        )}
        {pricing.extrasPrice > 0 && (
          <div className="nb__prow">
            <span>Extres</span>
            <b>+{formatCurrencyExact(pricing.extrasPrice)}</b>
          </div>
        )}
        {pricing.travelCharge > 0 && (
          <div className="nb__prow">
            <span>Desplaçament ({travelBlocks} trams)</span>
            <b>+{formatCurrencyExact(pricing.travelCharge)}</b>
          </div>
        )}
        <div className="nb__prow">
          <span>Subtotal</span>
          <b>{formatCurrencyExact(pricing.subtotal)}</b>
        </div>
        {pricing.discount > 0 && (
          <div className="nb__prow">
            <span>Descompte</span>
            <b>−{formatCurrencyExact(pricing.discount)}</b>
          </div>
        )}
        <div className="nb__prow">
          <span>IVA ({pricing.vatRate}%)</span>
          <b>+{formatCurrencyExact(pricing.vatAmount)}</b>
        </div>
        <div className="nb__prow nb__prow--total">
          <span>Total</span>
          <b>{formatCurrencyExact(pricing.total)}</b>
        </div>
        <div className="nb__prow nb__prow--muted">
          <span>Senyal ({DEPOSIT_PERCENT}%)</span>
          <b>{formatCurrencyExact(pricing.deposit)}</b>
        </div>
      </div>
      {internalTravelCost > 0 && (
        <p className="nb__pricehint">
          Cost intern transport estimat · {formatCurrencyExact(internalTravelCost)} ({defaultVehicleCostPerKm.toFixed(2)} €/km sobre km extra)
        </p>
      )}
      {marginEstimate && (
        <div className="nb__pricemargin">
          <span>Marge net</span>
          <b>{formatCurrency(marginEstimate.netMargin)} <small className="nb__pricemargin-pct">· {marginEstimate.marginPct.toFixed(0)}%</small></b>
        </div>
      )}
    </div>
  );
}
