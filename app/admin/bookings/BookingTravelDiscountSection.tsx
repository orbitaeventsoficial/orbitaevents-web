/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Secció Viatge + Descompte (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Reescrit al sistema visual nb-* (Canvi #842). Viatge resumit en una graella
   compacta de 3 cel·les; descompte amb codi i camp de notes.
============================================================================ */

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
  const enteredKm = parseFloat(form.distanceKm) || 0;

  return (
    <>
      <section className="nb__panel">
        <div className="nb__phead">
          <h2 className="nb__h2">Desplaçament</h2>
          <span className="nb__pintro">Opcional</span>
        </div>
        <div className="nb__row">
          <div className="nb__field">
            <label htmlFor="nb-km" className="nb__label">Km totals (anada + tornada)</label>
            <input
              id="nb-km"
              type="number"
              min={0}
              step={1}
              value={form.distanceKm}
              onChange={(e) => onFieldChange('distanceKm', e.target.value)}
              placeholder="0"
              className="nb__input"
            />
            <p className="nb__hint">Inclòs al pack: {includedTravelKm} km</p>
          </div>
          <div className="nb__field">
            <label className="nb__label">Resum del càrrec</label>
            <dl className="nb__travel" aria-label="Resum del cost de desplaçament">
              <div>
                <dt>Trams aplicats</dt>
                <dd>{travelBlocks}</dd>
              </div>
              <div>
                <dt>Km facturables</dt>
                <dd>{billableKm}</dd>
              </div>
              <div>
                <dt>Càrrec</dt>
                <dd>{travelCharge > 0 ? formatCurrencyExact(travelCharge) : '— €'}</dd>
              </div>
            </dl>
            {travelCharge > 0 && (
              <p className="nb__hint">{travelBlockEur} € per cada {travelBlockKm} km extra</p>
            )}
            {travelCharge === 0 && enteredKm > 0 && (
              <p className="nb__hint nb__hint--ok">Dins el tram inclòs · cap cost extra</p>
            )}
            {fuelReferenceInfo && <p className="nb__hint nb__hint--info">{fuelReferenceInfo}</p>}
          </div>
        </div>
      </section>

      <section className="nb__panel">
        <div className="nb__phead">
          <h2 className="nb__h2">Descompte i notes</h2>
        </div>
        <div className="nb__row">
          <div className="nb__field">
            <label htmlFor="nb-discount" className="nb__label">Descompte (€)</label>
            <input
              id="nb-discount"
              type="number"
              min={0}
              value={form.discount}
              onChange={(e) => onFieldChange('discount', e.target.value)}
              className="nb__input"
              placeholder="0"
            />
          </div>
          <div className="nb__field">
            <label htmlFor="nb-discount-code" className="nb__label">Codi descompte</label>
            <div className="nb__discount-code-row">
              <input
                id="nb-discount-code"
                type="text"
                value={form.discountCode}
                onChange={(e) => {
                  onFieldChange('discountCode', e.target.value.toUpperCase());
                  onResetDiscountValidation();
                }}
                placeholder="Ex: BODA2026"
                className="nb__input nb__input--code"
              />
              <button
                type="button"
                onClick={onValidateDiscountCode}
                disabled={validatingCode || !form.discountCode}
                className="nb__btn--sec nb__btn--compact"
              >
                {validatingCode ? 'Validant…' : 'Validar'}
              </button>
            </div>
            {discountValidation && (
              <p className={`nb__hint ${discountValidation.valid ? 'nb__hint--ok' : 'nb__hint--warn'}`}>
                {discountValidation.valid
                  ? `Vàlid · ${discountValidation.type === 'PERCENTAGE' ? `${discountValidation.value}%` : `${discountValidation.value}€`} (${discountValidation.source})`
                  : `Invàlid: ${discountValidation.reason}`}
              </p>
            )}
          </div>
        </div>
        <div className="nb__field nb__field--spaced">
          <label htmlFor="nb-notes" className="nb__label">Notes internes</label>
          <textarea
            id="nb-notes"
            value={form.notes}
            onChange={(e) => onFieldChange('notes', e.target.value)}
            rows={3}
            placeholder="Notes internes sobre la reserva (no es mostren al client)…"
            className="nb__textarea"
          />
        </div>
      </section>
    </>
  );
}
