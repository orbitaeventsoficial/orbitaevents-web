import Link from 'next/link';
import { EVENT_TYPE_ICONS, EVENT_TYPE_PLAIN, EVENT_TYPE_VALUES } from '@/lib/constants';

interface LeadData {
  id: string;
  name: string;
  email: string;
  budget: string | null;
}

interface DateConflict {
  id: string;
  reference: string;
  clientName: string;
  eventStartTime: string | null;
}

interface BookingClientEventSectionProps {
  leadData: LeadData | null;
  form: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    eventType: string;
    eventDate: string;
    eventStartTime: string;
    eventEndTime: string;
    eventLocation: string;
    eventVenue: string;
    guestCount: string;
  };
  calculatingDistance: boolean;
  distanceMessage: string | null;
  dateConflicts: DateConflict[];
  onFieldChange: (field: 'clientName' | 'clientEmail' | 'clientPhone' | 'eventType' | 'eventDate' | 'eventStartTime' | 'eventEndTime' | 'eventLocation' | 'eventVenue' | 'guestCount', value: string) => void;
}

export default function BookingClientEventSection({
  leadData,
  form,
  calculatingDistance,
  distanceMessage,
  dateConflicts,
  onFieldChange,
}: BookingClientEventSectionProps) {
  return (
    <>
      {leadData && (
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="text-sm">
            Entrada vinculada: <strong>{leadData.name}</strong> · {leadData.email}
            {leadData.budget && ` · Pressupost: ${leadData.budget}`}
          </div>
          <Link href={`/admin/leads/${leadData.id}`} className="text-xs">
            Veure entrada →
          </Link>
        </div>
      )}

      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Dades del client</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="nb-name" className="text-xs">Nom *</label>
            <input
              id="nb-name"
              type="text"
              value={form.clientName}
              onChange={(e) => onFieldChange('clientName', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nb-email" className="text-xs">Email *</label>
            <input
              id="nb-email"
              type="email"
              value={form.clientEmail}
              onChange={(e) => onFieldChange('clientEmail', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nb-phone" className="text-xs">Telèfon *</label>
            <input
              id="nb-phone"
              type="tel"
              value={form.clientPhone}
              onChange={(e) => onFieldChange('clientPhone', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {calculatingDistance && <p className="text-xs">Calculant ruta automàticament...</p>}
          {distanceMessage && <p className="text-xs">{distanceMessage}</p>}
        </div>
      </div>

      <div className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Detalls de l&apos;esdeveniment</h2>

        <div>
          <span id="nb-event-type-label" className="text-xs">Tipus</span>
          <div role="group" aria-labelledby="nb-event-type-label" className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {EVENT_TYPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onFieldChange('eventType', value)}
                aria-pressed={form.eventType === value}
                className={`rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
                  form.eventType === value
                    ? 'admin-tone-border-info admin-tone-bg-info admin-tone-text-info'
                    : 'admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral hover:brightness-105'
                }`}
              >
                <span className="text-base leading-none">{EVENT_TYPE_ICONS[value]}</span>
                <span className="mt-1 block leading-tight">{EVENT_TYPE_PLAIN[value]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="nb-date" className="text-xs">Data *</label>
            <input
              id="nb-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => onFieldChange('eventDate', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nb-start-time" className="text-xs">Hora inici</label>
            <input
              id="nb-start-time"
              type="time"
              value={form.eventStartTime}
              onChange={(e) => onFieldChange('eventStartTime', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nb-end-time" className="text-xs">Hora final</label>
            <input
              id="nb-end-time"
              type="time"
              value={form.eventEndTime}
              onChange={(e) => onFieldChange('eventEndTime', e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nb-guests" className="text-xs">Convidats</label>
            <input
              id="nb-guests"
              type="number"
              value={form.guestCount}
              onChange={(e) => onFieldChange('guestCount', e.target.value)}
              placeholder="100"
              min={1}
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {dateConflicts.length > 0 && (
          <div className="rounded-xl border-2 p-3">
            <p className="text-sm font-semibold">
              Ja {dateConflicts.length === 1 ? 'hi ha 1 reserva' : `hi ha ${dateConflicts.length} reserves`} el {form.eventDate}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {dateConflicts.map((conflict) => (
                <li key={conflict.id} className="text-xs">
                  {conflict.reference} · {conflict.clientName}{conflict.eventStartTime ? ` · ${conflict.eventStartTime}` : ''}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[10px]">Pots continuar si els horaris no es solapen.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nb-location" className="text-xs">Ubicació *</label>
            <input
              id="nb-location"
              type="text"
              value={form.eventLocation}
              onChange={(e) => onFieldChange('eventLocation', e.target.value)}
              placeholder="Ciutat o comarca"
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="nb-venue" className="text-xs">Espai / Lloc concret</label>
            <input
              id="nb-venue"
              type="text"
              value={form.eventVenue}
              onChange={(e) => onFieldChange('eventVenue', e.target.value)}
              placeholder="Nom de la finca, restaurant..."
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>
        </div>
      </div>
    </>
  );
}
