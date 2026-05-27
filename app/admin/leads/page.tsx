/* ============================================================================
   ÒRBITA ADMIN — Leads · Temporada (server component)
   ----------------------------------------------------------------------------
   Carrega les dades reals de la temporada via loadSeasonCalendar i les passa
   al client component AdminLeadsClient.
   Canvi #783.
   Inventari de funcions pendents: docs/admin-leads-funcions-inventari.md
============================================================================ */

import { loadSeasonCalendar } from '@/lib/services/seasonCalendarService';
import type { SeasonCalendarEntry } from '@/lib/services/seasonCalendarService';
import { getWeatherForEvent, type EventWeather } from '@/lib/services/weatherService';
import { EVENT_TYPE_PLAIN, LEAD_STATUS_VALUES, PRIORITY_VALUES, SOURCE_LABELS } from '@/lib/constants';
import AdminLeadsClient, { type LeadData } from './LeadsSeasonClient';
import type { LeadStatus } from './leadStatusClient';

function toLeadStatus(status: string): LeadStatus | null {
  return (LEAD_STATUS_VALUES as readonly string[]).includes(status) ? (status as LeadStatus) : null;
}

function toLeadPriority(raw: string | null): LeadData['priority'] {
  if (raw && (PRIORITY_VALUES as readonly string[]).includes(raw)) return raw as LeadData['priority'];
  return 'MEDIUM';
}

function statusToStage(status: string): LeadData['stage'] {
  switch (status) {
    case 'NEW':         return 'nou';
    case 'WON':         return 'guanyat';
    case 'LOST':        return 'perdut';
    default:            return 'contactat'; // CONTACTED, QUOTE_SENT, NEGOTIATING
  }
}

function toDateISO(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function eventTypeLabel(raw: string | null): string {
  if (!raw) return 'Esdeveniment';
  return EVENT_TYPE_PLAIN[raw] ?? raw;
}

function sourceLabel(raw: string | null): string {
  if (!raw) return '';
  return SOURCE_LABELS[raw] ?? raw;
}

function relativeLastContact(d: Date | null): string {
  if (!d) return '';
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'avui';
  if (days === 1) return 'fa 1 dia';
  if (days < 7) return `fa ${days} dies`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return 'fa 1 setmana';
  if (weeks < 5) return `fa ${weeks} setmanes`;
  const months = Math.floor(days / 30);
  if (months === 1) return 'fa 1 mes';
  return `fa ${months} mesos`;
}

function entryToLead(e: SeasonCalendarEntry, weather: EventWeather | null): LeadData {
  const kind = e.type;
  const typeLabel = eventTypeLabel(e.eventType);
  return {
    id: e.id,
    name: e.name,
    type: typeLabel,
    dateISO: e.eventDate ? toDateISO(e.eventDate) : '',
    time: '',               // pendent — no al servei actual
    location: e.eventLocation ?? '',
    pax: e.guestCount ?? 0,
    product: typeLabel,
    value: e.estimatedValue ?? 0,
    stage: kind === 'booking' ? 'guanyat' : statusToStage(e.status),
    kind,
    realStatus: kind === 'lead' ? toLeadStatus(e.status) : null,
    lostReason: kind === 'lead' ? e.lostReason : null,
    phone: kind === 'lead' ? e.phone : null,
    email: kind === 'lead' ? e.email : null,
    priority: kind === 'lead' ? toLeadPriority(e.priority) : 'MEDIUM',
    channel: kind === 'lead' ? sourceLabel(e.source) : '',
    owner: kind === 'lead' ? (e.assignedTo ?? '') : '',
    last: kind === 'lead' ? relativeLastContact(e.contactedAt) : '',
    wx: weather
      ? { kind: weather.kind, tmax: weather.tempMax, tmin: weather.tempMin }
      : { kind: 'partly', tmax: 22, tmin: 14 }, // fallback si no hi ha API key o data fora del rang 5d
  };
}

export default async function AdminLeadsPage() {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const data = await loadSeasonCalendar(windowStart, 6);

  const seen = new Set<string>();
  const entries = [
    ...data.weekends.flatMap((w) => w.entries),
    ...data.unscheduled,
  ]
    .filter((e) => e.type === 'lead')
    .filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });

  // Carrega meteo real només per a entries amb data dins dels propers 5 dies
  // i amb ubicació. La resta cau al placeholder per defecte.
  const horizonMs = 5 * 86400000;
  const nowMs = now.getTime();
  const weatherCandidates = entries.filter((e) =>
    e.eventDate && e.eventLocation && e.eventDate.getTime() - nowMs <= horizonMs && e.eventDate.getTime() >= nowMs - 86400000,
  );

  const weatherResults = await Promise.allSettled(
    weatherCandidates.map(async (e) => ({
      id: e.id,
      weather: await getWeatherForEvent(e.eventLocation as string, e.eventDate as Date),
    })),
  );

  const weatherById = new Map<string, EventWeather>();
  for (const r of weatherResults) {
    if (r.status === 'fulfilled' && r.value.weather) {
      weatherById.set(r.value.id, r.value.weather);
    }
  }

  const leads = entries.map((e) => entryToLead(e, weatherById.get(e.id) ?? null));

  return (
    <AdminLeadsClient
      leads={leads}
      initialMonth={now.getUTCMonth() + 1}
      year={now.getUTCFullYear()}
    />
  );
}
