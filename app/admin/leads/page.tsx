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
import AdminLeadsClient, { type LeadData } from './LeadsSeasonClient';

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

function entryToLead(e: SeasonCalendarEntry): LeadData {
  return {
    id: e.id,
    name: e.name,
    type: e.eventType ?? 'Esdeveniment',
    dateISO: e.eventDate ? toDateISO(e.eventDate) : '',
    time: '',               // pendent #784 — no al servei actual
    location: e.eventLocation ?? '',
    pax: e.guestCount ?? 0,
    product: e.eventType ?? '',
    value: e.estimatedValue ?? 0,
    stage: e.type === 'booking' ? 'guanyat' : statusToStage(e.status),
    channel: '',            // pendent #784 — no al servei actual
    owner: '',              // pendent #784 — no al servei actual
    last: '',               // pendent #784 — no al servei actual
    wx: { kind: 'partly', tmax: 22, tmin: 14 }, // pendent integració meteo
  };
}

export default async function AdminLeadsPage() {
  const now = new Date();
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const data = await loadSeasonCalendar(windowStart, 6);

  const seen = new Set<string>();
  const leads = [
    ...data.weekends.flatMap((w) => w.entries),
    ...data.unscheduled,
  ]
    .filter((e) => e.type === 'lead')
    .filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
    .map(entryToLead);

  return (
    <AdminLeadsClient
      leads={leads}
      initialMonth={now.getUTCMonth() + 1}
      year={now.getUTCFullYear()}
    />
  );
}
