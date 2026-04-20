import { describe, it, expect } from 'vitest';
import { buildWeekCapacity, type BookingCapacityRaw, type BookingCapacityInput } from '@/lib/services/bookingCapacityService';

const START = new Date('2026-04-13T00:00:00Z'); // Monday

function makeBooking(overrides: Partial<BookingCapacityRaw> = {}): BookingCapacityRaw {
  return {
    id: overrides.id ?? 'b1',
    clientName: 'Maria',
    eventType: 'WEDDING',
    eventDate: new Date('2026-04-14T00:00:00Z'),
    eventLocation: 'Barcelona',
    guestCount: 100,
    status: 'CONFIRMED',
    eventStartTime: '20:00',
    eventEndTime: '03:00',
    packSlug: 'premium',
    ...overrides,
  };
}

function makeInput(bookings: BookingCapacityRaw[], overrides: Partial<BookingCapacityInput> = {}): BookingCapacityInput {
  return { bookings, startDate: START, days: 7, ...overrides };
}

describe('buildWeekCapacity', () => {
  it('retorna 7 dies sense bookings', () => {
    const result = buildWeekCapacity(makeInput([]));
    expect(result.days).toHaveLength(7);
    expect(result.totalBookings).toBe(0);
    expect(result.freeCount).toBe(7);
    expect(result.overloadedCount).toBe(0);
    expect(result.busiestDay).toBeNull();
  });

  it('weekStart i weekEnd correctes', () => {
    const result = buildWeekCapacity(makeInput([]));
    expect(result.weekStart).toBe('2026-04-13');
    expect(result.weekEnd).toBe('2026-04-19');
  });

  it('assigna booking al dia correcte', () => {
    const result = buildWeekCapacity(makeInput([makeBooking()]));
    const day = result.days.find((d) => d.date === '2026-04-14');
    expect(day).toBeDefined();
    expect(day!.count).toBe(1);
    expect(day!.bookings).toHaveLength(1);
    expect(day!.bookings[0].clientName).toBe('Maria');
  });

  it('FREE quan 0 bookings', () => {
    const result = buildWeekCapacity(makeInput([]));
    expect(result.days[0].loadLevel).toBe('FREE');
  });

  it('LIGHT quan 1 booking i max=2', () => {
    const result = buildWeekCapacity(makeInput([makeBooking()]));
    const day = result.days.find((d) => d.date === '2026-04-14')!;
    expect(day.loadLevel).toBe('LIGHT');
  });

  it('FULL quan count === maxPerDay', () => {
    const bookings = [
      makeBooking({ id: 'b1' }),
      makeBooking({ id: 'b2' }),
    ];
    const result = buildWeekCapacity(makeInput(bookings, { maxPerDay: 2 }));
    const day = result.days.find((d) => d.date === '2026-04-14')!;
    expect(day.loadLevel).toBe('FULL');
  });

  it('OVERLOADED quan count > maxPerDay', () => {
    const bookings = [
      makeBooking({ id: 'b1' }),
      makeBooking({ id: 'b2' }),
      makeBooking({ id: 'b3' }),
    ];
    const result = buildWeekCapacity(makeInput(bookings, { maxPerDay: 2 }));
    const day = result.days.find((d) => d.date === '2026-04-14')!;
    expect(day.loadLevel).toBe('OVERLOADED');
    expect(result.overloadedCount).toBe(1);
  });

  it('totalGuests suma correctament', () => {
    const bookings = [
      makeBooking({ id: 'b1', guestCount: 100 }),
      makeBooking({ id: 'b2', guestCount: 50 }),
    ];
    const result = buildWeekCapacity(makeInput(bookings));
    const day = result.days.find((d) => d.date === '2026-04-14')!;
    expect(day.totalGuests).toBe(150);
  });

  it('busiestDay és el dia amb més bookings', () => {
    const bookings = [
      makeBooking({ id: 'b1', eventDate: new Date('2026-04-14T00:00:00Z') }),
      makeBooking({ id: 'b2', eventDate: new Date('2026-04-14T00:00:00Z') }),
      makeBooking({ id: 'b3', eventDate: new Date('2026-04-16T00:00:00Z') }),
    ];
    const result = buildWeekCapacity(makeInput(bookings));
    expect(result.busiestDay).toBe('2026-04-14');
    expect(result.totalBookings).toBe(3);
  });

  it('isWeekend correcte (dissabte i diumenge)', () => {
    const result = buildWeekCapacity(makeInput([]));
    // 2026-04-13 = Monday(1), ..., 2026-04-18 = Saturday(6), 2026-04-19 = Sunday(0)
    const saturday = result.days.find((d) => d.date === '2026-04-18');
    const sunday = result.days.find((d) => d.date === '2026-04-19');
    const monday = result.days.find((d) => d.date === '2026-04-13');
    expect(saturday!.isWeekend).toBe(true);
    expect(sunday!.isWeekend).toBe(true);
    expect(monday!.isWeekend).toBe(false);
  });

  it('freeCount compta dies sense bookings', () => {
    const bookings = [
      makeBooking({ id: 'b1', eventDate: new Date('2026-04-14T00:00:00Z') }),
      makeBooking({ id: 'b2', eventDate: new Date('2026-04-16T00:00:00Z') }),
    ];
    const result = buildWeekCapacity(makeInput(bookings));
    expect(result.freeCount).toBe(5); // 7 dies - 2 amb bookings
  });

  it('14 dies amb days=14', () => {
    const result = buildWeekCapacity(makeInput([], { days: 14 }));
    expect(result.days).toHaveLength(14);
  });

  it('booking fora del rang no apareix', () => {
    const booking = makeBooking({ eventDate: new Date('2026-04-25T00:00:00Z') });
    const result = buildWeekCapacity(makeInput([booking]));
    expect(result.totalBookings).toBe(0);
  });

  it('preserva dades del booking (pack, start/end)', () => {
    const result = buildWeekCapacity(makeInput([makeBooking()]));
    const b = result.days.find((d) => d.date === '2026-04-14')!.bookings[0];
    expect(b.packSlug).toBe('premium');
    expect(b.startTime).toBe('20:00');
    expect(b.endTime).toBe('03:00');
  });

  it('maxPerDay configurable', () => {
    const bookings = [makeBooking({ id: 'b1' })];
    const r1 = buildWeekCapacity(makeInput(bookings, { maxPerDay: 1 }));
    expect(r1.days.find((d) => d.date === '2026-04-14')!.loadLevel).toBe('FULL');

    const r2 = buildWeekCapacity(makeInput(bookings, { maxPerDay: 3 }));
    expect(r2.days.find((d) => d.date === '2026-04-14')!.loadLevel).toBe('LIGHT');
  });
});
