import { describe, it, expect } from 'vitest';
import { detectCapacityConflicts, type CapacityBookingInput, type CapacityConflictInput } from '@/lib/services/capacityConflictService';

const NOW = new Date('2026-04-11T09:00:00Z');

function makeBooking(id: string, date: string, items: Array<{ itemId: string; name: string; code: string; stock: number; qty: number }>, client = 'Client'): CapacityBookingInput {
  return {
    bookingId: id,
    clientName: `${client} ${id}`,
    eventDate: date,
    items: items.map((i) => ({
      itemId: i.itemId,
      itemName: i.name,
      itemCode: i.code,
      stock: i.stock,
      quantity: i.qty,
    })),
  };
}

function makeInput(bookings: CapacityBookingInput[], overrides: Partial<CapacityConflictInput> = {}): CapacityConflictInput {
  return { bookings, now: NOW, windowDays: 14, ...overrides };
}

describe('detectCapacityConflicts', () => {
  it('retorna 0 conflictes quan no hi ha reserves', () => {
    const result = detectCapacityConflicts(makeInput([]));
    expect(result.conflicts).toHaveLength(0);
    expect(result.verdict).toContain('Cap conflicte');
  });

  it('retorna 0 conflictes quan la demanda no supera stock', () => {
    const result = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-15', [{ itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 4, qty: 2 }]),
      makeBooking('b2', '2026-04-15', [{ itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 4, qty: 2 }]),
    ]));
    expect(result.conflicts).toHaveLength(0);
  });

  it('detecta conflicte quan 2 reserves superen stock', () => {
    const result = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-15', [{ itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 3, qty: 2 }]),
      makeBooking('b2', '2026-04-15', [{ itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 3, qty: 2 }]),
    ]));
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].deficit).toBe(1);
    expect(result.conflicts[0].totalDemanded).toBe(4);
    expect(result.conflicts[0].stockAvailable).toBe(3);
    expect(result.conflicts[0].bookings).toHaveLength(2);
  });

  it('no genera conflicte amb una sola reserva encara que superi stock', () => {
    const result = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-15', [{ itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 1, qty: 3 }]),
    ]));
    expect(result.conflicts).toHaveLength(0);
  });

  it('gestiona múltiples ítems i múltiples dies', () => {
    const result = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-15', [
        { itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 2, qty: 2 },
        { itemId: 'i2', name: 'Fum', code: 'FUM-001', stock: 1, qty: 1 },
      ]),
      makeBooking('b2', '2026-04-15', [
        { itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 2, qty: 1 },
        { itemId: 'i2', name: 'Fum', code: 'FUM-001', stock: 1, qty: 1 },
      ]),
      makeBooking('b3', '2026-04-16', [
        { itemId: 'i1', name: 'Altaveu', code: 'ALT-001', stock: 2, qty: 1 },
      ]),
    ]));
    // dia 15: ALT supera (2+1=3 > 2), FUM supera (1+1=2 > 1)
    // dia 16: ALT no supera (1 <= 2)
    expect(result.conflicts).toHaveLength(2);
    expect(result.conflicts[0].date).toBe('2026-04-15');
  });

  it('ordena per data i després per dèficit descendent', () => {
    const result = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-16', [{ itemId: 'i1', name: 'A', code: 'A', stock: 1, qty: 2 }]),
      makeBooking('b2', '2026-04-16', [{ itemId: 'i1', name: 'A', code: 'A', stock: 1, qty: 3 }]),
      makeBooking('b3', '2026-04-15', [{ itemId: 'i2', name: 'B', code: 'B', stock: 1, qty: 1 }]),
      makeBooking('b4', '2026-04-15', [{ itemId: 'i2', name: 'B', code: 'B', stock: 1, qty: 1 }]),
    ]));
    expect(result.conflicts[0].date).toBe('2026-04-15');
    expect(result.conflicts[1].date).toBe('2026-04-16');
  });

  it('verdict amb singular i plural correcte', () => {
    const one = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-15', [{ itemId: 'i1', name: 'A', code: 'A', stock: 1, qty: 1 }]),
      makeBooking('b2', '2026-04-15', [{ itemId: 'i1', name: 'A', code: 'A', stock: 1, qty: 1 }]),
    ]));
    expect(one.verdict).toContain('1 conflicte');
    expect(one.verdict).toContain('1 dia');

    const multi = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-15', [{ itemId: 'i1', name: 'A', code: 'A', stock: 1, qty: 1 }]),
      makeBooking('b2', '2026-04-15', [{ itemId: 'i1', name: 'A', code: 'A', stock: 1, qty: 1 }]),
      makeBooking('b3', '2026-04-16', [{ itemId: 'i2', name: 'B', code: 'B', stock: 1, qty: 1 }]),
      makeBooking('b4', '2026-04-16', [{ itemId: 'i2', name: 'B', code: 'B', stock: 1, qty: 1 }]),
    ]));
    expect(multi.verdict).toContain('conflictes');
    expect(multi.verdict).toContain('dies');
  });

  it('generatedAt és ISO i windowDays preservat', () => {
    const result = detectCapacityConflicts(makeInput([], { windowDays: 7 }));
    expect(result.generatedAt).toBe('2026-04-11T09:00:00.000Z');
    expect(result.windowDays).toBe(7);
  });

  it('3 reserves amb el mateix ítem acumulen correctament', () => {
    const result = detectCapacityConflicts(makeInput([
      makeBooking('b1', '2026-04-20', [{ itemId: 'i1', name: 'Bengala', code: 'BEN-001', stock: 5, qty: 2 }]),
      makeBooking('b2', '2026-04-20', [{ itemId: 'i1', name: 'Bengala', code: 'BEN-001', stock: 5, qty: 2 }]),
      makeBooking('b3', '2026-04-20', [{ itemId: 'i1', name: 'Bengala', code: 'BEN-001', stock: 5, qty: 2 }]),
    ]));
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].totalDemanded).toBe(6);
    expect(result.conflicts[0].deficit).toBe(1);
    expect(result.conflicts[0].bookings).toHaveLength(3);
  });
});
