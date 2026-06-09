/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Secció Pack + Extres (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Reescrit al sistema visual nb-* (Canvi #842). Packs amb jerarquia clara
   (preu daurat prominent, descripció en t3), extres com a llista compacta.
============================================================================ */

import { SERVICE_LABELS } from '@/lib/constants';
import { CUSTOM_BOOKING_PACK_SLUG } from '@/lib/constants/pricing';
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
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onPackSelect: (packId: string) => void;
  onExtraHoursChange: (value: string) => void;
  onCustomPackPriceChange: (value: string) => void;
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
  collapsed,
  onToggleCollapsed,
  onPackSelect,
  onExtraHoursChange,
  onCustomPackPriceChange,
  onToggleExtra,
  onUpdateExtraQuantity,
}: BookingPackExtrasSectionProps) {
  const catalogPacks = packs.filter((pack) => pack.slug !== CUSTOM_BOOKING_PACK_SLUG);
  return (
    <>
      <section className="nb__panel">
        <div className="nb__phead nb__phead--toggle">
          <div>
            <h2 className="nb__h2">Partir d&apos;un pack</h2>
            <span className="nb__pintro">Opcional · una tarifa tancada de catàleg</span>
          </div>
          <button type="button" className="nb__toggle" onClick={onToggleCollapsed}>
            {collapsed ? 'Triar pack' : 'Amagar'}
          </button>
        </div>
        {!collapsed && (
        <div className="nb__packs">
          {catalogPacks.map((pack) => {
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
        )}

        {!collapsed && selectedPackId && (
          <div className="nb__pack-tune">
            <p className="nb__pack-tune-title">Personalitza aquest pack</p>
            <div className="nb__pack-tune-grid">
              <div className="nb__field nb__field--narrow">
                <label htmlFor="nb-extra-hours" className="nb__label">Hores extra</label>
                <input
                  id="nb-extra-hours" type="number" min={0} max={10}
                  value={extraHours} onChange={(e) => onExtraHoursChange(e.target.value)}
                  className="nb__input"
                />
              </div>
              <div className="nb__field nb__field--narrow">
                <label htmlFor="nb-custom-price" className="nb__label">Preu del pack</label>
                <input
                  id="nb-custom-price" type="number" min={0} placeholder="tarifa per defecte"
                  value={customPackPrice} onChange={(e) => onCustomPackPriceChange(e.target.value)}
                  className="nb__input"
                />
                <span className="nb__field-hint">si has pactat un preu diferent al de tarifa</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {displayExtras.length > 0 && (
        <section className="nb__panel">
          <div className="nb__phead nb__phead--toggle">
            <div>
              <h2 className="nb__h2">Extres</h2>
              <span className="nb__pintro">Opcionals</span>
            </div>
            <a href="/admin/packs/extras" target="_blank" rel="noopener noreferrer" className="nb__toggle">Gestionar extres ↗</a>
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
