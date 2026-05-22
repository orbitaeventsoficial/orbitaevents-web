import { formatCurrencyExact } from '@/lib/constants';
import type { BookingDiscountValidation, BookingFormData } from './booking-form.types';

interface BookingTravelDiscountSectionProps {
  form: Pick<BookingFormData, 'distanceKm' | 'discount' | 'discountCode' | 'notes'>;
  travelBlocks: number;
  travelCharge: number;
  billableKm: number;
  includedTravelKm: number;
  travelBlockKm: number;
  travelBlockEur: number;
  fuelReferenceInfo: string | null;
  validatingCode: boolean;
  discountValidation: BookingDiscountValidation | null;
  onFieldChange: (field: 'distanceKm' | 'discount' | 'discountCode' | 'notes', value: string) => void;
  onResetDiscountValidation: () => void;
  onValidateDiscountCode: () => void;
}

export default function BookingTravelDiscountSection({
  form,
  travelBlocks,
  travelCharge,
  billableKm,
  includedTravelKm,
  travelBlockKm,
  travelBlockEur,
  fuelReferenceInfo,
  validatingCode,
  discountValidation,
  onFieldChange,
  onResetDiscountValidation,
  onValidateDiscountCode,
}: BookingTravelDiscountSectionProps) {
  return (
    <>
      <div className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Desplaçament</h2>
          <span className="text-xs">(opcional)</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nb-km" className="text-xs">Km totals (anada + tornada)</label>
            <div className="relative mt-1">
              <input
                id="nb-km"
                type="number"
                min="0"
                step="1"
                value={form.distanceKm}
                onChange={(e) => onFieldChange('distanceKm', e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">km</span>
            </div>
            <p className="mt-1 text-[10px]">Inclòs al pack: {includedTravelKm} km (anada + tornada)</p>
          </div>
          <div>
            <label className="text-xs">Trams aplicats</label>
            <div className="mt-1 flex h-[42px] items-center rounded-xl border px-3 py-2.5">
              <span className="text-sm font-semibold">{travelBlocks}</span>
            </div>
            <p className="mt-1 text-[10px]">{travelBlockEur} € per cada {travelBlockKm} km extra</p>
            {fuelReferenceInfo && <p className="mt-1 text-[10px]">{fuelReferenceInfo}</p>}
          </div>
          <div>
            <label className="text-xs">Cost desplaçament</label>
            <div className="mt-1 flex h-[42px] items-center rounded-xl border px-3 py-2.5">
              {travelCharge > 0 ? (
                <span className="text-sm font-semibold">{formatCurrencyExact(travelCharge)}</span>
              ) : (
                <span className="text-sm">— €</span>
              )}
            </div>
            {travelCharge > 0 && (
              <p className="mt-1 text-[10px]">{billableKm} km extra → {travelBlocks} trams × {travelBlockEur} €</p>
            )}
            {travelCharge === 0 && (parseFloat(form.distanceKm) || 0) > 0 && (
              <p className="mt-1 text-[10px]">Dins del tram inclòs ({includedTravelKm} km), cost extra 0 €</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Descompte i notes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nb-discount" className="text-xs">Descompte (€)</label>
            <input
              id="nb-discount"
              type="number"
              min="0"
              value={form.discount}
              onChange={(e) => onFieldChange('discount', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nb-discount-code" className="text-xs">Codi descompte</label>
            <div className="mt-1 flex gap-2">
              <input
                id="nb-discount-code"
                type="text"
                value={form.discountCode}
                onChange={(e) => {
                  onFieldChange('discountCode', e.target.value.toUpperCase());
                  onResetDiscountValidation();
                }}
                placeholder="Ex: BODA2026"
                className="font-mono flex-1 rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
              />
              <button
                type="button"
                onClick={onValidateDiscountCode}
                disabled={validatingCode || !form.discountCode}
                className="ap-btn ap-btn--secondary px-3 py-2 text-xs disabled:opacity-50"
              >
                {validatingCode ? '...' : 'Validar'}
              </button>
            </div>
            {discountValidation && (
              <p className={`mt-1 text-xs ${discountValidation.valid ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                {discountValidation.valid
                  ? `Vàlid: ${discountValidation.type === 'PERCENTAGE' ? `${discountValidation.value}%` : `${discountValidation.value}€`} (${discountValidation.source})`
                  : `Invàlid: ${discountValidation.reason}`}
              </p>
            )}
          </div>
          <div className="sm:col-span-1" />
        </div>
        <div>
          <label htmlFor="nb-notes" className="text-xs">Notes internes</label>
          <textarea
            id="nb-notes"
            value={form.notes}
            onChange={(e) => onFieldChange('notes', e.target.value)}
            rows={3}
            placeholder="Notes internes sobre la reserva..."
            className="mt-1 w-full resize-none rounded-xl border px-3 py-2.5 text-sm focus:ring-1"
          />
        </div>
      </div>
    </>
  );
}
