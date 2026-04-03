import type { BookingExtra, BookingPack, BookingSelectedExtras } from './booking-form.types';

interface BookingPackExtrasSectionProps {
  packs: BookingPack[];
  displayExtras: BookingExtra[];
  selectedExtras: BookingSelectedExtras;
  selectedPackId: string;
  extraHours: string;
  onPackSelect: (packId: string) => void;
  onExtraHoursChange: (value: string) => void;
  onToggleExtra: (extra: BookingExtra) => void;
  onUpdateExtraQuantity: (extraId: string, qty: number) => void;
}

export default function BookingPackExtrasSection({
  packs,
  displayExtras,
  selectedExtras,
  selectedPackId,
  extraHours,
  onPackSelect,
  onExtraHoursChange,
  onToggleExtra,
  onUpdateExtraQuantity,
}: BookingPackExtrasSectionProps) {
  return (
    <>
      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Selecciona pack *</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => {
            const name = pack.translations[0]?.name || pack.slug;
            const desc = pack.translations[0]?.description || '';
            const isSelected = selectedPackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => onPackSelect(pack.id)}
                className={`rounded-xl border p-4 text-center transition-all ${
                  isSelected
                    ? 'admin-tone-border-info admin-tone-bg-info'
                    : 'admin-tone-border-neutral admin-tone-bg-neutral hover:brightness-105'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{name}</span>
                  <span className="text-sm font-bold">{pack.price}€</span>
                </div>
                <p className="mt-1 text-xs line-clamp-2">{desc}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded px-1.5 py-0.5 text-[10px]">{pack.djHours}h DJ</span>
                  <span className="rounded px-1.5 py-0.5 text-[10px]">{pack.soundWatts}W</span>
                  {pack.includesFog && <span className="rounded px-1.5 py-0.5 text-[10px]">Fum</span>}
                  {pack.includesMic && <span className="rounded px-1.5 py-0.5 text-[10px]">Micro</span>}
                  <span className="rounded px-1.5 py-0.5 text-[10px]">+{pack.extraHourPrice}€/h extra</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedPackId && (
          <div>
            <label htmlFor="nb-extra-hours" className="text-xs">Hores extra</label>
            <input
              id="nb-extra-hours"
              type="number"
              min="0"
              max="10"
              value={extraHours}
              onChange={(e) => onExtraHoursChange(e.target.value)}
              className="mt-1 w-24 rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
        )}
      </div>

      {displayExtras.length > 0 && (
        <div className="rounded-2xl border p-5 space-y-4">
          <h2 className="text-sm font-semibold">Extres</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {displayExtras.map((extra) => {
              const name = extra.translations[0]?.name || extra.slug;
              const isSelected = !!selectedExtras[extra.id];
              return (
                <div
                  key={extra.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'admin-tone-border-success admin-tone-bg-success'
                      : 'admin-tone-border-neutral admin-tone-bg-neutral'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleExtra(extra)}
                    className="flex-1 text-center"
                  >
                    <span className={`text-sm font-medium ${isSelected ? 'admin-tone-text-success' : 'admin-tone-text-neutral'}`}>
                      {isSelected ? '✓ ' : ''}{name}
                    </span>
                    <span className="ml-2 text-xs">{extra.price}€{extra.isOperatorExtra ? '/h' : ''}</span>
                  </button>
                  {isSelected && (
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={selectedExtras[extra.id].quantity}
                      onChange={(e) => onUpdateExtraQuantity(extra.id, parseInt(e.target.value, 10) || 1)}
                      className="w-14 rounded-xl border px-2 py-1 text-center text-xs"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
