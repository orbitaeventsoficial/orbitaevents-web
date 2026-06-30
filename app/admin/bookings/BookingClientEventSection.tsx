/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Secció Client + Esdeveniment
   ----------------------------------------------------------------------------
   Canònic: AdminSection + .adm-input + Tailwind/tokens (canonització 2026-06-30,
   sistema propi `nb-*` eradicat). Chips de tipus d'event en una sola paleta daurada.
============================================================================ */

import { EVENT_TYPE_ICONS, EVENT_TYPE_PLAIN, EVENT_TYPE_VALUES } from '@/lib/constants';
import { AdminSection } from '../components/AdminPage';
import { NB_FIELD, NB_LABEL, NB_REQ, NB_HINT, NB_HINT_OK, NB_HINT_WARN, NB_HINT_INFO } from './booking-form-classes';

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

// Tradueix l'error tècnic GOOGLE_MAPS_API_KEY_NOT_CONFIGURED en un missatge usable.
function humaniseDistanceMessage(message: string | null): { text: string; tone: 'ok' | 'warn' | 'info' } | null {
  if (!message) return null;
  if (message.includes('GOOGLE_MAPS_API_KEY_NOT_CONFIGURED')) {
    return { text: "Google Maps no configurat — pots posar la distància manualment.", tone: 'warn' };
  }
  if (message.startsWith('Ruta calculada')) {
    return { text: message, tone: 'ok' };
  }
  return { text: message, tone: 'info' };
}

const DISTANCE_TONE: Record<'ok' | 'warn' | 'info', string> = {
  ok: NB_HINT_OK,
  warn: NB_HINT_WARN,
  info: NB_HINT_INFO,
};

export default function BookingClientEventSection({
  form,
  calculatingDistance,
  distanceMessage,
  dateConflicts,
  onFieldChange,
}: BookingClientEventSectionProps) {
  const distanceInfo = humaniseDistanceMessage(distanceMessage);

  return (
    <>
      <AdminSection title="Dades del client">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div className={NB_FIELD}>
            <label htmlFor="nb-name" className={`${NB_LABEL} ${NB_REQ}`}>Nom</label>
            <input
              id="nb-name"
              type="text"
              value={form.clientName}
              onChange={(e) => onFieldChange('clientName', e.target.value)}
              className="adm-input"
              autoComplete="name"
            />
          </div>
          <div className={NB_FIELD}>
            <label htmlFor="nb-email" className={`${NB_LABEL} ${NB_REQ}`}>Email</label>
            <input
              id="nb-email"
              type="email"
              value={form.clientEmail}
              onChange={(e) => onFieldChange('clientEmail', e.target.value)}
              className="adm-input"
              autoComplete="email"
            />
          </div>
          <div className={NB_FIELD}>
            <label htmlFor="nb-phone" className={`${NB_LABEL} ${NB_REQ}`}>Telèfon</label>
            <input
              id="nb-phone"
              type="tel"
              value={form.clientPhone}
              onChange={(e) => onFieldChange('clientPhone', e.target.value)}
              className="adm-input"
              autoComplete="tel"
            />
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Detalls de l'esdeveniment">
        <div className={`${NB_FIELD} mb-4`}>
          <span id="nb-event-type-label" className={NB_LABEL}>Tipus d&apos;event</span>
          <div
            role="group"
            aria-labelledby="nb-event-type-label"
            className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-2"
          >
            {EVENT_TYPE_VALUES.map((value) => {
              const isOn = form.eventType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onFieldChange('eventType', value)}
                  aria-pressed={isOn}
                  className={`flex items-center justify-center gap-2 rounded-[var(--o-r-md)] border px-2.5 py-3 text-sm font-semibold transition-colors ${
                    isOn
                      ? 'border-[var(--gold)] bg-[var(--ax-gold-tint-1)] text-[var(--gold-bright)]'
                      : 'border-[var(--line)] bg-[var(--sunk)] text-[var(--t2)] hover:border-[var(--hair-gold)] hover:text-[var(--t)]'
                  }`}
                >
                  <span className={isOn ? 'text-[var(--gold-bright)]' : 'text-[var(--gold)]'} aria-hidden="true">{EVENT_TYPE_ICONS[value]}</span>
                  {EVENT_TYPE_PLAIN[value]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className={NB_FIELD}>
            <label htmlFor="nb-date" className={`${NB_LABEL} ${NB_REQ}`}>Data</label>
            <input
              id="nb-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => onFieldChange('eventDate', e.target.value)}
              className="adm-input"
            />
          </div>
          <div className={NB_FIELD}>
            <label htmlFor="nb-start-time" className={NB_LABEL}>Hora inici</label>
            <input
              id="nb-start-time"
              type="time"
              value={form.eventStartTime}
              onChange={(e) => onFieldChange('eventStartTime', e.target.value)}
              className="adm-input"
            />
          </div>
          <div className={NB_FIELD}>
            <label htmlFor="nb-end-time" className={NB_LABEL}>Hora final</label>
            <input
              id="nb-end-time"
              type="time"
              value={form.eventEndTime}
              onChange={(e) => onFieldChange('eventEndTime', e.target.value)}
              className="adm-input"
            />
          </div>
          <div className={NB_FIELD}>
            <label htmlFor="nb-guests" className={NB_LABEL}>Convidats</label>
            <input
              id="nb-guests"
              type="number"
              value={form.guestCount}
              onChange={(e) => onFieldChange('guestCount', e.target.value)}
              placeholder="100"
              min={1}
              className="adm-input"
            />
          </div>
        </div>

        {dateConflicts.length > 0 && (
          <div
            className="mt-2 flex gap-2.5 rounded-[var(--o-r-md)] border border-[var(--gold)] bg-[color-mix(in_oklab,var(--gold)_10%,var(--panel))] px-3.5 py-3 text-sm leading-snug text-[var(--t)]"
            role="alert"
          >
            <span className="shrink-0 text-[var(--gold-bright)]" aria-hidden="true">⚠</span>
            <div>
              <strong className="mb-1 block">
                Ja {dateConflicts.length === 1 ? 'hi ha 1 reserva' : `hi ha ${dateConflicts.length} reserves`} aquest dia
              </strong>
              {dateConflicts.map((conflict) => (
                <div key={conflict.id} className="text-xs text-[var(--t2)]">
                  {conflict.reference} · {conflict.clientName}{conflict.eventStartTime ? ` · ${conflict.eventStartTime}` : ''}
                </div>
              ))}
              <small className="mt-1.5 block text-[var(--t3)]">Pots continuar si els horaris no es solapen.</small>
            </div>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className={NB_FIELD}>
            <label htmlFor="nb-location" className={`${NB_LABEL} ${NB_REQ}`}>Ubicació</label>
            <input
              id="nb-location"
              type="text"
              value={form.eventLocation}
              onChange={(e) => onFieldChange('eventLocation', e.target.value)}
              placeholder="Ciutat o comarca"
              className="adm-input"
            />
          </div>
          <div className={NB_FIELD}>
            <label htmlFor="nb-venue" className={NB_LABEL}>Espai / Lloc concret</label>
            <input
              id="nb-venue"
              type="text"
              value={form.eventVenue}
              onChange={(e) => onFieldChange('eventVenue', e.target.value)}
              placeholder="Nom de la finca, restaurant…"
              className="adm-input"
            />
          </div>
        </div>

        {(calculatingDistance || distanceInfo) && (
          <p className={`mt-2.5 ${NB_HINT} ${!calculatingDistance && distanceInfo ? DISTANCE_TONE[distanceInfo.tone] : ''}`}>
            {calculatingDistance && '🛰  Calculant ruta automàticament…'}
            {!calculatingDistance && distanceInfo && distanceInfo.text}
          </p>
        )}
      </AdminSection>
    </>
  );
}
