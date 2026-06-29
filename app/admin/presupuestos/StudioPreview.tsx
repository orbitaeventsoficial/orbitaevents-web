import { type Locale, type ServiceSlug, SERVICE_LABEL, STUDIO_COPY, formatEUR } from './studio-utils';

export type StudioPreviewProps = {
  brandName: string;
  brandWebsite: string;
  brandEmail: string;
  brandPhone: string;
  clientName: string;
  clientContact: string;
  clientEmail: string;
  clientPhone: string;
  eventType: ServiceSlug;
  eventDate: string;
  guests: number;
  eventSchedule: string;
  eventLocation: string;
  validityDays: number;
  whyChooseUs: string;
  packName: string;
  selectedPackName?: string;
  durationHours: number;
  basePrice: number;
  extrasPrice: number;
  travelCharge: number;
  travelKm: number;
  billableTravelKm: number;
  travelBlocks: number;
  seasonSurcharge?: number;
  seasonLabel?: string;
  seasonPct?: number;
  discount: number;
  total: number;
  directCost?: number;
  netMargin?: number;
  marginPct?: number;
  marginTone?: 'emerald' | 'amber' | 'orange' | 'rose';
  acquisitionCost?: number;
  locale: Locale;
};

export default function StudioPreview(props: StudioPreviewProps) {
  const t = STUDIO_COPY[props.locale];
  const marginToneClass =
    props.marginTone === 'emerald'
      ? 'text-emerald-300 border-emerald-400/30 bg-emerald-950/20'
      : props.marginTone === 'amber'
        ? 'text-amber-300 border-amber-400/30 bg-amber-950/20'
        : props.marginTone === 'orange'
          ? 'text-orange-300 border-orange-400/30 bg-orange-950/20'
          : props.marginTone === 'rose'
            ? 'text-rose-300 border-rose-400/30 bg-rose-950/20'
            : 'text-[var(--t)] border-[var(--line)] bg-[var(--panel)]';

  return (
    <aside className="admin-quote-studio-preview h-fit rounded-2xl border p-5">
      <h2 className="ap-h2">Vista ràpida</h2>
      <p className="mt-1 text-sm">Resum del que sortirà al PDF.</p>

      <div className="mt-4 space-y-3 text-sm">
        <div className="rounded-xl border p-3">
          <p className="">Marca</p>
          <p className="font-semibold">{props.brandName || 'Marca'}</p>
          <p className="">{props.brandWebsite || '-'}</p>
          <p className="">{props.brandEmail || '-'} · {props.brandPhone || '-'}</p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="">{t.clientLabel}</p>
          <p className="font-semibold">{props.clientName || t.defaultClientName}</p>
          <p className="">{props.clientContact || '-'}</p>
          <p className="">{props.clientEmail || '-'} · {props.clientPhone || '-'}</p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="">Esdeveniment</p>
          <p className="font-semibold">{SERVICE_LABEL[props.eventType]}</p>
          <p className="">{props.eventDate || t.noDate} · {props.guests} convidats</p>
          <p className="">{props.eventSchedule || t.noSchedule} · {props.eventLocation || t.noLocation}</p>
          <p className="">Validesa: {props.validityDays} dies</p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="">Narrativa comercial</p>
          <p className="line-clamp-3">{props.whyChooseUs || '-'}</p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="">Pack</p>
          <p className="font-semibold">{props.packName || props.selectedPackName || '-'}</p>
          <p className="">{props.durationHours}h</p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="mb-2">Costos</p>
          <div className="flex items-center justify-between">
            <span>Base</span>
            <span>{formatEUR(props.basePrice)}</span>
          </div>
          {props.seasonSurcharge && props.seasonSurcharge > 0 && props.seasonLabel ? (
            <>
              <div className="flex items-center justify-between">
                <span>{props.seasonLabel}</span>
                <span>+{formatEUR(props.seasonSurcharge)}</span>
              </div>
              {typeof props.seasonPct === 'number' && (
                <div className="text-xs">+{props.seasonPct.toFixed(0)}% sobre el preu base</div>
              )}
            </>
          ) : null}
          <div className="flex items-center justify-between">
            <span>Extres</span>
            <span>{formatEUR(props.extrasPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Desplaçament</span>
            <span>{formatEUR(props.travelCharge)}</span>
          </div>
          {props.travelCharge > 0 && (
            <div className="text-xs">
              {props.travelKm.toFixed(1)} km totals · {props.billableTravelKm.toFixed(1)} km extra · {props.travelBlocks} trams
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Descompte</span>
            <span>-{formatEUR(props.discount)}</span>
          </div>
          <div className="mt-2 border-t pt-2 flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatEUR(props.total)}</span>
          </div>
        </div>

        {typeof props.directCost === 'number' &&
        typeof props.netMargin === 'number' &&
        typeof props.marginPct === 'number' ? (
          <div className={`rounded-xl border p-3 ${marginToneClass}`}>
            <p className="mb-2">Marge viu</p>
            <div className="flex items-center justify-between">
              <span>Cost directe</span>
              <span>{formatEUR(props.directCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Marge net</span>
              <span>{formatEUR(props.netMargin)}</span>
            </div>
            <div className="mt-2 border-t pt-2 flex items-center justify-between font-semibold">
              <span>% marge</span>
              <span>{props.marginPct.toFixed(1)}%</span>
            </div>
            {typeof props.acquisitionCost === 'number' ? (
              <p className="mt-1 text-xs">Inclou CAC estimat de {formatEUR(props.acquisitionCost)}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
