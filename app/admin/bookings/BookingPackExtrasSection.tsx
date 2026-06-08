/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Secció Pack + Extres (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Reescrit al sistema visual nb-* (Canvi #842). Packs amb jerarquia clara
   (preu daurat prominent, descripció en t3), extres com a llista compacta.
============================================================================ */

import { SERVICE_LABELS } from '@/lib/constants';
import { VAT_RATE_INVOICE } from '@/lib/constants/pricing';
import type { ServiceSlug } from '@/app/config/packs-config';
import type { BookingExtra, BookingPack, BookingSelectedExtras } from './booking-form.types';

// Etiqueta humana del servei del pack (Bodes/Discomòbil/Empreses/...).
// Retorna null si el servei no és reconegut → no es prefixa.
function serviceLabelOf(service?: string | null): string | null {
  if (!service) return null;
  return (SERVICE_LABELS as Record<string, string>)[service as ServiceSlug] ?? null;
}

interface BookingPackExtrasSectionProps {
  packs: BookingPack[];
  displayExtras: BookingExtra[];
  selectedExtras: BookingSelectedExtras;
  selectedPackId: string;
  extraHours: string;
  customPackPrice: string;
  manualTotalPrice: string;
  invoiceRequired: boolean;
  onPackSelect: (packId: string) => void;
  onExtraHoursChange: (value: string) => void;
  onCustomPackPriceChange: (value: string) => void;
  onManualTotalPriceChange: (value: string) => void;
  onInvoiceRequiredChange: (value: boolean) => void;
  onToggleExtra: (extra: BookingExtra) => void;
  onUpdateExtraQuantity: (extraId: string, qty: number) => void;
}

export default function BookingPackExtrasSection({
  packs,
  displayExtras,
  selectedExtras,
  selectedPackId,
  extraHours,
  customPackPrice,
  manualTotalPrice,
  invoiceRequired,
  onPackSelect,
  onExtraHoursChange,
  onCustomPackPriceChange,
  onManualTotalPriceChange,
  onInvoiceRequiredChange,
  onToggleExtra,
  onUpdateExtraQuantity,
}: BookingPackExtrasSectionProps) {
  return (
    <>
      <section className="nb__panel">
        <div className="nb__phead">
          <h2 className="nb__h2">Pack <span className="nb__req">*</span></h2>
          <span className="nb__pintro">Tria 1</span>
        </div>
        <div className="nb__packs">
          {packs.map((pack) => {
            const name = pack.translations[0]?.name || pack.slug;
            const desc = pack.translations[0]?.description || '';
            const serviceLbl = serviceLabelOf(pack.service);
            const isSelected = selectedPackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => onPackSelect(pack.id)}
                aria-pressed={isSelected}
                className={`nb__pack${isSelected ? ' is-on' : ''}`}
              >
                {serviceLbl && <span className="nb__packservice">{serviceLbl}</span>}
                <span className="nb__packname">{name}</span>
                <span className="nb__packprice">{pack.price}€</span>
                {desc && <span className="nb__packdesc">{desc}</span>}
                <span className="nb__packmeta">
                  <span>{pack.djHours}h</span>
                  <span>·</span>
                  <span>{pack.soundWatts}W</span>
                  {pack.includesFog && <><span>·</span><span>Fum</span></>}
                  {pack.includesMic && <><span>·</span><span>Micro</span></>}
                  <span>·</span>
                  <span>+{pack.extraHourPrice}€/h extra</span>
                </span>
              </button>
            );
          })}
        </div>

        {selectedPackId && (
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <div className="nb__field" style={{ maxWidth: 180 }}>
              <label htmlFor="nb-extra-hours" className="nb__label">Hores extra</label>
              <input
                id="nb-extra-hours"
                type="number"
                min={0}
                max={10}
                value={extraHours}
                onChange={(e) => onExtraHoursChange(e.target.value)}
                className="nb__input"
              />
            </div>
            <div className="nb__field" style={{ maxWidth: 180 }}>
              <label htmlFor="nb-custom-price" className="nb__label">
                Preu base pactat <span className="text-[11px] font-normal text-[var(--t3)]">(només pack)</span>
              </label>
              <input
                id="nb-custom-price"
                type="number"
                min={0}
                placeholder="Preu del pack"
                value={customPackPrice}
                onChange={(e) => onCustomPackPriceChange(e.target.value)}
                className="nb__input"
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <div className="nb__field" style={{ maxWidth: 190 }}>
            <label htmlFor="nb-manual-total" className="nb__label">
              Total final acordat <span className="text-[11px] font-normal text-[var(--t3)]">(guanya sobre tot)</span>
            </label>
            <input
              id="nb-manual-total"
              type="number"
              min={0}
              placeholder="Ex. 340"
              value={manualTotalPrice}
              onChange={(e) => onManualTotalPriceChange(e.target.value)}
              className="nb__input"
            />
          </div>
        </div>

        {selectedPackId && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--t2)]">
              <input
                type="checkbox"
                checked={invoiceRequired}
                onChange={(e) => onInvoiceRequiredChange(e.target.checked)}
                role="switch"
                aria-checked={invoiceRequired}
              />
              Vol factura
              {invoiceRequired && <span className="ml-1 text-[11px] text-[var(--o-warning)]">+{VAT_RATE_INVOICE}% IVA</span>}
            </label>
          </div>
        )}
      </section>

      {displayExtras.length > 0 && (
        <section className="nb__panel">
          <div className="nb__phead">
            <h2 className="nb__h2">Extres</h2>
            <span className="nb__pintro">Opcionals</span>
          </div>
          <div className="nb__extras">
            {displayExtras.map((extra) => {
              const name = extra.translations[0]?.name || extra.slug;
              const isSelected = !!selectedExtras[extra.id];
              return (
                <label key={extra.id} className="nb__extra">
                  <input
                    type="checkbox"
                    className="nb__extra-cbx"
                    checked={isSelected}
                    onChange={() => onToggleExtra(extra)}
                    aria-label={`Afegir ${name}`}
                  />
                  <span className="nb__extra-name">
                    {name}
                    {extra.isOperatorExtra && <small>Preu per hora extra</small>}
                  </span>
                  <span className="nb__extra-price">{extra.price}€{extra.isOperatorExtra ? '/h' : ''}</span>
                  {isSelected && !extra.isOperatorExtra && (
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedExtras[extra.id].quantity}
                      onChange={(e) => onUpdateExtraQuantity(extra.id, parseInt(e.target.value, 10) || 1)}
                      className="nb__extra-qty"
                      aria-label={`Quantitat de ${name}`}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
