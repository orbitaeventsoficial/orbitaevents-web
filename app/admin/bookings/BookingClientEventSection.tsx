/* ============================================================================
   ÒRBITA ADMIN — NewBookingForm · Secció Client + Esdeveniment (Brass & Obsidian)
   ----------------------------------------------------------------------------
   Reescrit al sistema visual nb-* (Canvi #842). Sense Tailwind, sense
   admin-tone-*. Chips de tipus d'event en una sola paleta daurada (no més
   colors primaris). Mateixos props que abans.
============================================================================ */

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
      <section className="nb__panel">
        <div className="nb__phead">
          <h2 className="nb__h2">Dades del client</h2>
        </div>
        <div className="nb__row nb__row--3">
          <div className="nb__field">
            <label htmlFor="nb-name" className="nb__label nb__label--req">Nom</label>
            <input
              id="nb-name"
              type="text"
              value={form.clientName}
              onChange={(e) => onFieldChange('clientName', e.target.value)}
              className="nb__input"
              autoComplete="name"
            />
          </div>
          <div className="nb__field">
            <label htmlFor="nb-email" className="nb__label nb__label--req">Email</label>
            <input
              id="nb-email"
              type="email"
              value={form.clientEmail}
              onChange={(e) => onFieldChange('clientEmail', e.target.value)}
              className="nb__input"
              autoComplete="email"
            />
          </div>
          <div className="nb__field">
            <label htmlFor="nb-phone" className="nb__label nb__label--req">Telèfon</label>
            <input
              id="nb-phone"
              type="tel"
              value={form.clientPhone}
              onChange={(e) => onFieldChange('clientPhone', e.target.value)}
              className="nb__input"
              autoComplete="tel"
            />
          </div>
        </div>
      </section>

      <section className="nb__panel">
        <div className="nb__phead">
          <h2 className="nb__h2">Detalls de l&apos;esdeveniment</h2>
        </div>

        <div className="nb__field" style={{ marginBottom: 16 }}>
          <span id="nb-event-type-label" className="nb__label">Tipus d&apos;event</span>
          <div role="group" aria-labelledby="nb-event-type-label" className="nb__chips" style={{ marginTop: 6 }}>
            {EVENT_TYPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onFieldChange('eventType', value)}
                aria-pressed={form.eventType === value}
                className={`nb__chip${form.eventType === value ? ' is-on' : ''}`}
              >
                <span className="nb__chipic" aria-hidden="true">{EVENT_TYPE_ICONS[value]}</span>
                {EVENT_TYPE_PLAIN[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="nb__row nb__row--4">
          <div className="nb__field">
            <label htmlFor="nb-date" className="nb__label nb__label--req">Data</label>
            <input
              id="nb-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => onFieldChange('eventDate', e.target.value)}
              className="nb__input"
            />
          </div>
          <div className="nb__field">
            <label htmlFor="nb-start-time" className="nb__label">Hora inici</label>
            <input
              id="nb-start-time"
              type="time"
              value={form.eventStartTime}
              onChange={(e) => onFieldChange('eventStartTime', e.target.value)}
              className="nb__input"
            />
          </div>
          <div className="nb__field">
            <label htmlFor="nb-end-time" className="nb__label">Hora final</label>
            <input
              id="nb-end-time"
              type="time"
              value={form.eventEndTime}
              onChange={(e) => onFieldChange('eventEndTime', e.target.value)}
              className="nb__input"
            />
          </div>
          <div className="nb__field">
            <label htmlFor="nb-guests" className="nb__label">Convidats</label>
            <input
              id="nb-guests"
              type="number"
              value={form.guestCount}
              onChange={(e) => onFieldChange('guestCount', e.target.value)}
              placeholder="100"
              min={1}
              className="nb__input"
            />
          </div>
        </div>

        {dateConflicts.length > 0 && (
          <div className="nb__conflict" role="alert">
            <div>
              <strong style={{ display: 'block', marginBottom: 4 }}>
                Ja {dateConflicts.length === 1 ? 'hi ha 1 reserva' : `hi ha ${dateConflicts.length} reserves`} aquest dia
              </strong>
              {dateConflicts.map((conflict) => (
                <div key={conflict.id} className="nb__conflict-ref">
                  {conflict.reference} · {conflict.clientName}{conflict.eventStartTime ? ` · ${conflict.eventStartTime}` : ''}
                </div>
              ))}
              <small className="nb__conflict-hint">Pots continuar si els horaris no es solapen.</small>
            </div>
          </div>
        )}

        <div className="nb__row" style={{ marginTop: 12 }}>
          <div className="nb__field">
            <label htmlFor="nb-location" className="nb__label nb__label--req">Ubicació</label>
            <input
              id="nb-location"
              type="text"
              value={form.eventLocation}
              onChange={(e) => onFieldChange('eventLocation', e.target.value)}
              placeholder="Ciutat o comarca"
              className="nb__input"
            />
          </div>
          <div className="nb__field">
            <label htmlFor="nb-venue" className="nb__label">Espai / Lloc concret</label>
            <input
              id="nb-venue"
              type="text"
              value={form.eventVenue}
              onChange={(e) => onFieldChange('eventVenue', e.target.value)}
              placeholder="Nom de la finca, restaurant…"
              className="nb__input"
            />
          </div>
        </div>

        {(calculatingDistance || distanceInfo) && (
          <p className={`nb__hint nb__hint--${distanceInfo?.tone ?? 'info'}`} style={{ marginTop: 10 }}>
            {calculatingDistance && '🛰  Calculant ruta automàticament…'}
            {!calculatingDistance && distanceInfo && distanceInfo.text}
          </p>
        )}
      </section>
    </>
  );
}
