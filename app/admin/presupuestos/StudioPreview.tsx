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
  serviceItems: string[];
  durationHours: number;
  basePrice: number;
  extrasPrice: number;
  travelCharge: number;
  travelKm: number;
  travelTollsEur: number;
  discount: number;
  taxableBase: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  directCost?: number;
  netMargin?: number;
  marginPct?: number;
  marginTone?: 'emerald' | 'amber' | 'orange' | 'rose';
  acquisitionCost?: number;
  locale: Locale;
};

export default function StudioPreview(props: StudioPreviewProps) {
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
  const serviceTotal = Math.max(0, props.basePrice + props.extrasPrice);
  const eventSummary = [
    props.eventDate || STUDIO_COPY[props.locale].noDate,
    props.eventSchedule || STUDIO_COPY[props.locale].noSchedule,
    props.eventLocation || STUDIO_COPY[props.locale].noLocation,
  ].join(' · ');

  return (
    <aside className="admin-quote-studio-preview h-fit rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="ap-h2">Pressupost viu</h2>
          <p className="mt-1 text-sm">{props.clientName || 'Client'} · {SERVICE_LABEL[props.eventType]}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide">Total client</p>
          <p className="text-2xl font-semibold">{formatEUR(props.total)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-3 text-sm">
        <p className="font-semibold">{props.packName || props.selectedPackName || 'Servei configurat'}</p>
        <p className="mt-1 text-xs">{eventSummary} · {props.guests} convidats · validesa {props.validityDays} dies</p>
        {props.serviceItems.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {props.serviceItems.slice(0, 5).map((item) => (
              <span key={item} className="rounded-full border px-2 py-1 text-xs">Serveis: {item}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wide">Serveis</p>
          <p className="mt-1 font-semibold">{formatEUR(serviceTotal)}</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wide">Transport</p>
          <p className="mt-1 font-semibold">{formatEUR(props.travelCharge)}</p>
          {props.travelCharge > 0 ? (
            <p className="mt-1 text-xs">
              {props.travelKm.toFixed(0)} km
              {props.travelTollsEur > 0 ? ` · peatges ${formatEUR(props.travelTollsEur)}` : ''}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wide">IVA {props.vatRate}%</p>
          <p className="mt-1 font-semibold">{formatEUR(props.vatAmount)}</p>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs uppercase tracking-wide">Descompte</p>
          <p className="mt-1 font-semibold">-{formatEUR(props.discount)}</p>
        </div>
      </div>

      {props.whyChooseUs ? (
        <p className="mt-3 line-clamp-2 rounded-xl border p-3 text-sm">{props.whyChooseUs}</p>
      ) : null}

      {typeof props.directCost === 'number' &&
      typeof props.netMargin === 'number' &&
      typeof props.marginPct === 'number' ? (
        <div className={`mt-3 rounded-xl border p-3 text-sm ${marginToneClass}`}>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide">Cost</p>
              <p className="font-semibold">{formatEUR(props.directCost)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">Marge</p>
              <p className="font-semibold">{formatEUR(props.netMargin)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">% marge</p>
              <p className="font-semibold">{props.marginPct.toFixed(1)}%</p>
            </div>
          </div>
          {typeof props.acquisitionCost === 'number' ? (
            <p className="mt-2 text-xs">Inclou CAC estimat de {formatEUR(props.acquisitionCost)}</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
