/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Secció Viatge + Descompte
   ----------------------------------------------------------------------------
   Canònic: AdminSection + .adm-input + .ap-btn + Tailwind/tokens (canonització
   2026-06-30, sistema propi `nb-*` eradicat). Viatge resumit en una graella de 3 cel·les.
============================================================================ */

import { formatCurrencyExact } from '@/lib/constants';
import { AdminSection } from '../components/AdminPage';
import { NB_FIELD, NB_LABEL, NB_HINT, NB_HINT_OK, NB_HINT_WARN, NB_HINT_INFO } from './booking-form-classes';
import type { BookingDiscountValidation, BookingFormData } from './booking-form.types';

interface BookingTravelDiscountSectionProps {
  form: Pick<BookingFormData, 'distanceKm' | 'discount' | 'discountCode' | 'notes'>;
  travelCharge: number;
  travelHeadcount: number;
  chargeableHours: number;
  includedTravelKm: number;
  fuelReferenceInfo: string | null;
  validatingCode: boolean;
  discountValidation: BookingDiscountValidation | null;
  onFieldChange: (field: 'distanceKm' | 'discount' | 'discountCode' | 'notes', value: string) => void;
  onResetDiscountValidation: () => void;
  onValidateDiscountCode: () => void;
}

export default function BookingTravelDiscountSection({
  form,
  travelCharge,
  travelHeadcount,
  chargeableHours,
  includedTravelKm,
  fuelReferenceInfo,
  validatingCode,
  discountValidation,
  onFieldChange,
  onResetDiscountValidation,
  onValidateDiscountCode,
}: BookingTravelDiscountSectionProps) {
  const enteredKm = parseFloat(form.distanceKm) || 0;

  return (
    <>
      <AdminSection title="Desplaçament" description="Opcional">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className={NB_FIELD}>
            <label htmlFor="nb-km" className={NB_LABEL}>Km totals (anada + tornada)</label>
            <input
              id="nb-km"
              type="number"
              min={0}
              step={1}
              value={form.distanceKm}
              onChange={(e) => onFieldChange('distanceKm', e.target.value)}
              placeholder="0"
              className="adm-input"
            />
            <p className={NB_HINT}>La 1a hora de ruta va inclosa</p>
          </div>
          <div className={NB_FIELD}>
            <span className={NB_LABEL}>Resum del càrrec</span>
            <dl
              className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3"
              aria-label="Resum del cost de desplaçament"
            >
              {[
                { dt: 'Persones', dd: travelHeadcount },
                { dt: 'Hores tripulació', dd: `${chargeableHours} h` },
                { dt: 'Càrrec', dd: travelCharge > 0 ? formatCurrencyExact(travelCharge) : '— €' },
              ].map((cell) => (
                <div key={cell.dt} className="flex flex-col gap-1 bg-[var(--panel)] px-3.5 py-3">
                  <dt className="font-mono text-[length:var(--o-text-2xs)] font-bold uppercase tracking-[0.09em] text-[var(--t3)]">{cell.dt}</dt>
                  <dd className="m-0 font-mono text-sm font-bold tabular-nums text-[var(--t)]">{cell.dd}</dd>
                </div>
              ))}
            </dl>
            {travelCharge > 0 && (
              <p className={NB_HINT}>Cost real: cotxe (km) + tripulació (15 €/h, 1a hora inclosa)</p>
            )}
            {travelCharge === 0 && enteredKm > 0 && (
              <p className={`${NB_HINT} ${NB_HINT_OK}`}>Dins la 1a hora inclosa · cap cost extra</p>
            )}
            {fuelReferenceInfo && <p className={`${NB_HINT} ${NB_HINT_INFO}`}>{fuelReferenceInfo}</p>}
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Descompte i notes">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className={NB_FIELD}>
            <label htmlFor="nb-discount" className={NB_LABEL}>Descompte (€)</label>
            <input
              id="nb-discount"
              type="number"
              min={0}
              value={form.discount}
              onChange={(e) => onFieldChange('discount', e.target.value)}
              className="adm-input"
              placeholder="0"
            />
          </div>
          <div className={NB_FIELD}>
            <label htmlFor="nb-discount-code" className={NB_LABEL}>Codi descompte</label>
            <div className="flex gap-2">
              <input
                id="nb-discount-code"
                type="text"
                value={form.discountCode}
                onChange={(e) => {
                  onFieldChange('discountCode', e.target.value.toUpperCase());
                  onResetDiscountValidation();
                }}
                placeholder="Ex: BODA2026"
                className="adm-input font-mono uppercase"
              />
              <button
                type="button"
                onClick={onValidateDiscountCode}
                disabled={validatingCode || !form.discountCode}
                className="ap-btn shrink-0 whitespace-nowrap"
              >
                {validatingCode ? 'Validant…' : 'Validar'}
              </button>
            </div>
            {discountValidation && (
              <p className={`${NB_HINT} ${discountValidation.valid ? NB_HINT_OK : NB_HINT_WARN}`}>
                {discountValidation.valid
                  ? `Vàlid · ${discountValidation.type === 'PERCENTAGE' ? `${discountValidation.value}%` : `${discountValidation.value}€`} (${discountValidation.source})`
                  : `Invàlid: ${discountValidation.reason}`}
              </p>
            )}
          </div>
        </div>
        <div className={`${NB_FIELD} mt-3`}>
          <label htmlFor="nb-notes" className={NB_LABEL}>Notes internes</label>
          <textarea
            id="nb-notes"
            value={form.notes}
            onChange={(e) => onFieldChange('notes', e.target.value)}
            rows={3}
            placeholder="Notes internes sobre la reserva (no es mostren al client)…"
            className="adm-input adm-input--textarea"
          />
        </div>
      </AdminSection>
    </>
  );
}
