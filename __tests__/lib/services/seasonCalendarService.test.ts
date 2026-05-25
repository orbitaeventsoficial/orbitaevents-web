import { describe, it, expect } from 'vitest';
import {
  buildSeasonCalendar,
  type SeasonCalendarInput,
  type SeasonCalendarLeadRaw,
  type SeasonCalendarBookingRaw,
} from '@/lib/services/seasonCalendarService';

// 2026-06-01 és dilluns → primer divendres = 05/06/2026
const WINDOW_START = new Date('2026-06-01T00:00:00.000Z');
const MONTHS = 3;

function makeLead(overrides: Partial<SeasonCalendarLeadRaw> = {}): SeasonCalendarLeadRaw {
  return {
    id: 'l1',
    status: 'NEW',
    name: 'Anna García',
    eventDate: new Date('2026-06-20T00:00:00.000Z'), // dissabte
    eventType: 'BIRTHDAY',
    eventLocation: 'Barcelona',
    guestCount: 80,
    estimatedValue: 2000,
    ...overrides,
  };
}

function makeBooking(overrides: Partial<SeasonCalendarBookingRaw> = {}): SeasonCalendarBookingRaw {
  return {
    id: 'b1',
    status: 'CONFIRMED',
    clientName: 'Marc Puig',
    eventDate: new Date('2026-07-04T00:00:00.000Z'), // dissabte
    eventType: 'WEDDING',
    eventLocation: 'Girona',
    guestCount: 150,
    total: 5000,
    ...overrides,
  };
}

function makeInput(
  leads: SeasonCalendarLeadRaw[] = [],
  bookings: SeasonCalendarBookingRaw[] = [],
): SeasonCalendarInput {
  return { windowStart: WINDOW_START, months: MONTHS, leads, bookings };
}

describe('buildSeasonCalendar', () => {
  it('retorna finestra correcta', () => {
    const result = buildSeasonCalendar(makeInput());
    expect(result.windowStart.toISOString().slice(0, 10)).toBe('2026-06-01');
    expect(result.windowEnd.toISOString().slice(0, 10)).toBe('2026-09-01');
  });

  it('genera caps de setmana (Dv/Ds/Dg) dins la finestra', () => {
    const result = buildSeasonCalendar(makeInput());
    // 3 mesos juny-agost = ~13 caps de setmana
    expect(result.weekends.length).toBeGreaterThan(10);
    // Tots els weekKey han de ser divendres (getUTCDay() === 5)
    for (const w of result.weekends) {
      expect(w.fri.getUTCDay()).toBe(5);
      expect(w.sat.getUTCDay()).toBe(6);
      expect(w.sun.getUTCDay()).toBe(0);
    }
  });

  it('retorna zero entrades sense dades', () => {
    const result = buildSeasonCalendar(makeInput());
    expect(result.stats.totalLeads).toBe(0);
    expect(result.stats.totalBookings).toBe(0);
    expect(result.stats.totalValue).toBe(0);
    expect(result.unscheduled).toHaveLength(0);
  });

  it('col·loca un lead amb eventDate al cap de setmana correcte', () => {
    // 20/06/2026 és dissabte → cap de setmana amb fri=2026-06-19
    const lead = makeLead({ eventDate: new Date('2026-06-20T00:00:00.000Z') });
    const result = buildSeasonCalendar(makeInput([lead]));
    const weekend = result.weekends.find((w) => w.weekKey === '2026-06-19');
    expect(weekend).toBeDefined();
    expect(weekend!.entries).toHaveLength(1);
    expect(weekend!.entries[0].id).toBe('l1');
    expect(weekend!.entries[0].type).toBe('lead');
  });

  it('col·loca un booking al cap de setmana correcte', () => {
    // 04/07/2026 és dissabte → cap de setmana amb fri=2026-07-03
    const booking = makeBooking({ eventDate: new Date('2026-07-04T00:00:00.000Z') });
    const result = buildSeasonCalendar(makeInput([], [booking]));
    const weekend = result.weekends.find((w) => w.weekKey === '2026-07-03');
    expect(weekend).toBeDefined();
    expect(weekend!.entries[0].type).toBe('booking');
    expect(weekend!.entries[0].estimatedValue).toBe(5000);
  });

  it('col·loca lead en divendres al cap de setmana correcte', () => {
    // 19/06/2026 és divendres
    const lead = makeLead({ eventDate: new Date('2026-06-19T00:00:00.000Z') });
    const result = buildSeasonCalendar(makeInput([lead]));
    const weekend = result.weekends.find((w) => w.weekKey === '2026-06-19');
    expect(weekend!.entries).toHaveLength(1);
  });

  it('col·loca lead en diumenge al cap de setmana correcte', () => {
    // 21/06/2026 és diumenge
    const lead = makeLead({ eventDate: new Date('2026-06-21T00:00:00.000Z') });
    const result = buildSeasonCalendar(makeInput([lead]));
    const weekend = result.weekends.find((w) => w.weekKey === '2026-06-19');
    expect(weekend!.entries).toHaveLength(1);
  });

  it('posa leads sense eventDate a "unscheduled"', () => {
    const lead = makeLead({ eventDate: null });
    const result = buildSeasonCalendar(makeInput([lead]));
    expect(result.unscheduled).toHaveLength(1);
    expect(result.unscheduled[0].id).toBe('l1');
    expect(result.stats.scheduledLeads).toBe(0);
    // No ha d'aparèixer en cap cap de setmana
    const allEntries = result.weekends.flatMap((w) => w.entries);
    expect(allEntries).toHaveLength(0);
  });

  it('calcula stats correctes amb leads i bookings mixtos', () => {
    const scheduledLead = makeLead({ id: 'l1', estimatedValue: 1500 });
    const unscheduledLead = makeLead({ id: 'l2', eventDate: null, estimatedValue: null });
    const booking = makeBooking({ total: 3000 });
    const result = buildSeasonCalendar(makeInput([scheduledLead, unscheduledLead], [booking]));
    expect(result.stats.totalLeads).toBe(2);
    expect(result.stats.totalBookings).toBe(1);
    expect(result.stats.scheduledLeads).toBe(1);
    expect(result.stats.scheduledBookings).toBe(1);
    expect(result.stats.totalValue).toBe(4500); // 1500 + 3000
  });

  it('sumar els valors per cap de setmana', () => {
    // Dos leads al mateix cap de setmana
    const lead1 = makeLead({ id: 'l1', eventDate: new Date('2026-06-19T00:00:00.000Z'), estimatedValue: 1000 });
    const lead2 = makeLead({ id: 'l2', eventDate: new Date('2026-06-20T00:00:00.000Z'), estimatedValue: 2000 });
    const result = buildSeasonCalendar(makeInput([lead1, lead2]));
    const weekend = result.weekends.find((w) => w.weekKey === '2026-06-19');
    expect(weekend!.entries).toHaveLength(2);
    expect(weekend!.totalValue).toBe(3000);
  });

  it('cap de setmana fora de la finestra no té entrades', () => {
    // Lead fora de la finestra (octubre, fora dels 3 mesos)
    const lead = makeLead({ eventDate: new Date('2026-10-03T00:00:00.000Z') });
    const result = buildSeasonCalendar(makeInput([lead]));
    const allEntries = result.weekends.flatMap((w) => w.entries);
    // No hi ha d'apareixer
    expect(allEntries.find((e) => e.id === 'l1')).toBeUndefined();
  });

  it('tractament correcte de estimatedValue null (booking val 0)', () => {
    const booking = makeBooking({ total: 0 });
    const result = buildSeasonCalendar(makeInput([], [booking]));
    expect(result.stats.totalValue).toBe(0);
  });

  it('weekKey és la data del divendres en format YYYY-MM-DD', () => {
    const result = buildSeasonCalendar(makeInput());
    const firstWeekend = result.weekends[0];
    // El primer divendres de juny 2026 és el 05/06/2026
    expect(firstWeekend.weekKey).toBe('2026-06-05');
  });
});
