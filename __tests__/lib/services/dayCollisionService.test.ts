import { describe, it, expect } from 'vitest';
import { detectDayCollisions, type DayCollisionInput } from '@/lib/services/dayCollisionService';

function bk(over: Omit<Partial<DayCollisionInput>, 'eventDate'> & { id: string; eventDate: string }): DayCollisionInput {
  return {
    id: over.id,
    reference: over.reference ?? `OE-${over.id}`,
    clientName: over.clientName ?? `Client ${over.id}`,
    eventDate: new Date(over.eventDate),
    eventStartTime: over.eventStartTime ?? null,
    eventLocation: over.eventLocation ?? null,
  };
}

describe('detectDayCollisions', () => {
  it('detecta un dia amb 2+ bolos', () => {
    const collisions = detectDayCollisions([
      bk({ id: '1', eventDate: '2026-09-05T10:00:00Z' }),
      bk({ id: '2', eventDate: '2026-09-05T18:00:00Z' }),
      bk({ id: '3', eventDate: '2026-09-06T10:00:00Z' }),
    ]);
    expect(collisions).toHaveLength(1);
    expect(collisions[0].date).toBe('2026-09-05');
    expect(collisions[0].count).toBe(2);
  });

  it('marca cap de setmana (dissabte 2026-09-05)', () => {
    const collisions = detectDayCollisions([
      bk({ id: '1', eventDate: '2026-09-05T10:00:00Z' }),
      bk({ id: '2', eventDate: '2026-09-05T18:00:00Z' }),
    ]);
    expect(collisions[0].isWeekend).toBe(true);
    expect(collisions[0].weekday).toBe(6);
  });

  it('un sol bolo per dia no és col·lisió', () => {
    const collisions = detectDayCollisions([
      bk({ id: '1', eventDate: '2026-09-05T10:00:00Z' }),
      bk({ id: '2', eventDate: '2026-09-06T10:00:00Z' }),
    ]);
    expect(collisions).toHaveLength(0);
  });

  it('ordena els bolos del dia per hora d\'inici', () => {
    const collisions = detectDayCollisions([
      bk({ id: 'tarda', eventDate: '2026-09-05T00:00:00Z', eventStartTime: '19:00' }),
      bk({ id: 'mati', eventDate: '2026-09-05T00:00:00Z', eventStartTime: '10:00' }),
    ]);
    expect(collisions[0].bookings.map((b) => b.bookingId)).toEqual(['mati', 'tarda']);
  });
});
