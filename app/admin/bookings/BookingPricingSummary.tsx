import { formatCurrency, formatCurrencyExact } from '@/lib/constants';

interface BookingPricingSummaryProps {
  pricing: {
    packPrice: number;
    extraHoursPrice: number;
    extrasPrice: number;
    travelCharge: number;
    subtotal: number;
    discount: number;
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

function getToneClasses(tone: 'emerald' | 'amber' | 'rose') {
  return tone === 'emerald'
    ? {
        container: 'admin-tone-border-success admin-tone-bg-success',
        text: 'admin-tone-text-success',
        bar: 'admin-tone-bg-success',
      }
    : tone === 'amber'
      ? {
          container: 'admin-tone-border-warning admin-tone-bg-warning',
          text: 'admin-tone-text-warning',
          bar: 'admin-tone-bg-warning',
        }
      : {
          container: 'admin-tone-border-danger admin-tone-bg-danger',
          text: 'admin-tone-text-danger',
          bar: 'admin-tone-bg-danger',
        };
}

export default function BookingPricingSummary({
  pricing,
  travelBlocks,
  internalTravelCost,
  defaultVehicleCostPerKm,
  marginEstimate,
}: BookingPricingSummaryProps) {
  return (
    <>
      <div className="rounded-2xl border p-5">
        <h2 className="mb-3 text-sm font-semibold">Resum de preus</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span>Pack</span>
            <span>{formatCurrencyExact(pricing.packPrice)}</span>
          </div>
          {pricing.extraHoursPrice > 0 && (
            <div className="flex justify-between">
              <span>Hores extra</span>
              <span>+{formatCurrencyExact(pricing.extraHoursPrice)}</span>
            </div>
          )}
          {pricing.extrasPrice > 0 && (
            <div className="flex justify-between">
              <span>Extres</span>
              <span>+{formatCurrencyExact(pricing.extrasPrice)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1.5">
            <span>Subtotal</span>
            <span>{formatCurrencyExact(pricing.subtotal)}</span>
          </div>
          {pricing.discount > 0 && (
            <div className="flex justify-between">
              <span>Descompte</span>
              <span>-{formatCurrencyExact(pricing.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>IVA (21%)</span>
            <span>+{formatCurrencyExact(pricing.vatAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrencyExact(pricing.total)}</span>
          </div>
          {pricing.travelCharge > 0 && (
            <div className="flex justify-between">
              <span>🚗 Desplaçament ({travelBlocks} trams)</span>
              <span>+{formatCurrencyExact(pricing.travelCharge)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-xs">
            <span>Senyal (30%)</span>
            <span>{formatCurrencyExact(pricing.deposit)}</span>
          </div>
          {internalTravelCost > 0 && (
            <p className="border-t pt-1 text-[11px]">
              * Cost intern estimat de transport: {formatCurrencyExact(internalTravelCost)} (coeficient {defaultVehicleCostPerKm.toFixed(2)} €/km sobre km extra).
            </p>
          )}
        </div>
      </div>

      {marginEstimate && (() => {
        const tone = getToneClasses(marginEstimate.tone);
        return (
          <div className={`rounded-2xl border-2 p-5 ${tone.container}`}>
            <h2 className="mb-3 text-sm font-semibold">Rendibilitat estimada</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs opacity-60">Cost estimat</p>
                <p className="text-lg font-bold">{formatCurrency(marginEstimate.directCost)}</p>
              </div>
              <div>
                <p className="text-xs opacity-60">Marge net</p>
                <p className={`text-lg font-bold ${tone.text}`}>{formatCurrency(marginEstimate.netMargin)}</p>
              </div>
              <div>
                <p className="text-xs opacity-60">Marge %</p>
                <p className={`text-lg font-bold ${tone.text}`}>{marginEstimate.marginPct.toFixed(1)}%</p>
              </div>
            </div>
            <div className="admin-tone-bg-neutral mt-3 h-2 w-full overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all ${tone.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, marginEstimate.marginPct))}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] opacity-40">
              Estimació basada en ratis estàndard. El marge real es calcularà amb costos d&apos;inventari assignat.
            </p>
          </div>
        );
      })()}
    </>
  );
}
