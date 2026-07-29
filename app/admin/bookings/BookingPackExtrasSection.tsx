/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Secció Pack + Extres
   ----------------------------------------------------------------------------
   Canònic: AdminSection + .adm-input + .ap-btn + Tailwind/tokens (canonització
   2026-06-30, sistema propi `nb-*` eradicat). Packs amb jerarquia clara (preu daurat),
   extres com a llista compacta.
============================================================================ */

import { useState } from 'react';
import { SERVICE_LABELS } from '@/lib/constants';
import { CUSTOM_BOOKING_PACK_SLUG } from '@/lib/constants/pricing';
import type { ServiceSlug } from '@/app/config/packs-config';
import { AdminSection } from '../components/AdminPage';
import { NB_FIELD, NB_LABEL, NB_HINT } from './booking-form-classes';
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

const NARROW_FIELD = `${NB_FIELD} max-w-[12.5rem] flex-1 basis-40`;

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
  const selectedExtrasCount = Object.keys(selectedExtras).length;
  const [extrasOpen, setExtrasOpen] = useState(selectedExtrasCount > 0);
  return (
    <>
      {(!collapsed || selectedPackId) && <AdminSection
        title="Partir d'un pack"
        description="Opcional · una tarifa tancada de catàleg"
        actions={(
          <button type="button" className="ap-btn ap-btn--xs" onClick={onToggleCollapsed}>
            {collapsed ? 'Triar pack' : 'Amagar'}
          </button>
        )}
      >
        {!collapsed && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(11.25rem,1fr))] gap-2.5">
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
                className={`flex flex-col gap-1.5 rounded-[var(--o-r-md)] border px-3.5 py-3.5 text-left transition-colors ${
                  isSelected
                    ? 'border-[var(--gold)] bg-[var(--ax-gold-tint-1)]'
                    : 'border-[var(--line)] bg-[var(--sunk)] hover:border-[var(--hair-gold)]'
                }`}
              >
                {serviceLbl && <span className="font-mono text-[length:var(--o-text-2xs)] font-bold uppercase tracking-[0.13em] text-[var(--gold)]">{serviceLbl}</span>}
                <span className="text-base font-bold text-[var(--t)]">{name}</span>
                <span className="font-mono text-lg font-extrabold tabular-nums text-[var(--gold-bright)]">{pack.price}€</span>
                {desc && <span className="text-xs leading-snug text-[var(--t3)]">{desc}</span>}
                <span className="mt-1 flex flex-wrap gap-1.5 font-mono text-[length:var(--o-text-2xs)] text-[var(--t3)]">
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
          <div className="mt-4 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[color-mix(in_oklab,var(--panel)_60%,transparent)] p-3.5">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--t3)]">Personalitza aquest pack</p>
            <div className="flex flex-wrap gap-4">
              <div className={NARROW_FIELD}>
                <label htmlFor="nb-extra-hours" className={NB_LABEL}>Hores extra</label>
                <input
                  id="nb-extra-hours" type="number" min={0} max={10}
                  value={extraHours} onChange={(e) => onExtraHoursChange(e.target.value)}
                  className="adm-input"
                />
              </div>
              <div className={NARROW_FIELD}>
                <label htmlFor="nb-custom-price" className={NB_LABEL}>Preu del pack</label>
                <input
                  id="nb-custom-price" type="number" min={0} placeholder="tarifa per defecte"
                  value={customPackPrice} onChange={(e) => onCustomPackPriceChange(e.target.value)}
                  className="adm-input"
                />
                <span className={NB_HINT}>si has pactat un preu diferent al de tarifa</span>
              </div>
            </div>
          </div>
        )}
      </AdminSection>}

      {displayExtras.length > 0 && (
        <AdminSection
          title="Extres"
          description={selectedExtrasCount > 0 ? `${selectedExtrasCount} seleccionats` : 'Opcionals'}
          actions={(
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ap-btn ap-btn--xs" onClick={() => setExtrasOpen((value) => !value)}>
                {extrasOpen ? 'Amagar' : 'Veure extres'}
              </button>
              <a href="/admin/packs/extras" target="_blank" rel="noopener noreferrer" className="ap-btn ap-btn--xs">Gestionar extres ↗</a>
            </div>
          )}
        >
          {extrasOpen && <div className="flex flex-col overflow-hidden rounded-[var(--o-r-md)] border border-[var(--line)]">
            {displayExtras.map((extra) => {
              const name = extra.translations[0]?.name || extra.slug;
              const isSelected = !!selectedExtras[extra.id];
              return (
                <label
                  key={extra.id}
                  className="flex items-center gap-3 border-b border-[color-mix(in_oklab,var(--line)_50%,transparent)] bg-[var(--panel)] px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--ax-gold-tint-1)]"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--gold)]"
                    checked={isSelected}
                    onChange={() => onToggleExtra(extra)}
                    aria-label={`Afegir ${name}`}
                  />
                  <span className="min-w-0 flex-1 text-sm text-[var(--t)]">
                    {name}
                    {extra.isOperatorExtra && <small className="mt-0.5 block font-mono text-xs text-[var(--t3)]">Preu per hora extra</small>}
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[var(--gold-bright)]">{extra.price}€{extra.isOperatorExtra ? '/h' : ''}</span>
                  {isSelected && !extra.isOperatorExtra && (
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedExtras[extra.id].quantity}
                      onChange={(e) => onUpdateExtraQuantity(extra.id, parseInt(e.target.value, 10) || 1)}
                      className="adm-input w-16 text-center"
                      aria-label={`Quantitat de ${name}`}
                    />
                  )}
                </label>
              );
            })}
          </div>}
        </AdminSection>
      )}
    </>
  );
}
