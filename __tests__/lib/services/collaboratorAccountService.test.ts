import { describe, it, expect } from 'vitest';
import { composeCollaboratorAccount, type BilledBookingInput } from '@/lib/services/collaboratorAccountService';

function booking(over: Partial<BilledBookingInput> & { id: string }): BilledBookingInput {
  return {
    id: over.id,
    reference: over.reference ?? `OE-${over.id}`,
    clientName: over.clientName ?? 'Masquerade (Carlos Lucas)',
    eventDate: over.eventDate ?? new Date('2026-05-01T00:00:00Z'),
    total: over.total ?? 0,
    depositAmount: over.depositAmount ?? 0,
    depositPaid: over.depositPaid ?? false,
    remainingPaid: over.remainingPaid ?? false,
    cashAmount: over.cashAmount ?? null,
  };
}

const base = {
  collaboratorId: 'masq',
  collaboratorName: 'Carlos Lucas Fernández',
};

describe('composeCollaboratorAccount', () => {
  it('«em deu» = pendent de les reserves facturades al soci', () => {
    const account = composeCollaboratorAccount({
      ...base,
      payoutTotals: { previ: 0, aPagar: 0, pagat: 0 },
      billedBookings: [booking({ id: '1', total: 500, depositAmount: 150, depositPaid: true, remainingPaid: false })],
    });
    // Pagada la bestreta (150), queda el saldo restant 350.
    expect(account.owesMe.outstanding).toBe(350);
    expect(account.owesMe.billedTotal).toBe(500);
    expect(account.balance).toBe(350); // el soci em deu 350
  });

  it('saldo net creua les dues direccions (li dec vs em deu)', () => {
    const account = composeCollaboratorAccount({
      ...base,
      payoutTotals: { previ: 0, aPagar: 900, pagat: 0 }, // li dec 900
      billedBookings: [booking({ id: '1', total: 500 })], // em deu 500 (res pagat)
    });
    expect(account.iOwe.pending).toBe(900);
    expect(account.owesMe.outstanding).toBe(500);
    expect(account.balance).toBe(-400); // net: jo li dec 400
  });

  it('reserva totalment pagada no compta com a deute', () => {
    const account = composeCollaboratorAccount({
      ...base,
      payoutTotals: { previ: 0, aPagar: 0, pagat: 0 },
      billedBookings: [booking({ id: '1', total: 500, depositAmount: 150, depositPaid: true, remainingPaid: true })],
    });
    expect(account.owesMe.outstanding).toBe(0);
    expect(account.owesMe.bookings[0].paid).toBe(true);
    expect(account.balance).toBe(0);
  });

  it('bolo cobrat en EFECTIU el mateix dia no és deute (encara que els flags online siguin false)', () => {
    const account = composeCollaboratorAccount({
      ...base,
      payoutTotals: { previ: 0, aPagar: 0, pagat: 0 },
      // Pagat tot en efectiu: cashAmount = total, però depositPaid/remainingPaid = false.
      billedBookings: [booking({ id: '1', total: 500, cashAmount: 500 })],
    });
    expect(account.owesMe.outstanding).toBe(0);
    expect(account.owesMe.bookings[0].paid).toBe(true);
    expect(account.balance).toBe(0);
  });

  it('efectiu PARCIAL redueix el deute però no el tanca', () => {
    const account = composeCollaboratorAccount({
      ...base,
      payoutTotals: { previ: 0, aPagar: 0, pagat: 0 },
      billedBookings: [booking({ id: '1', total: 500, cashAmount: 200 })],
    });
    expect(account.owesMe.outstanding).toBe(300);
    expect(account.owesMe.bookings[0].paid).toBe(false);
  });

  it('sense moviments → tot a zero', () => {
    const account = composeCollaboratorAccount({
      ...base,
      payoutTotals: { previ: 0, aPagar: 0, pagat: 0 },
      billedBookings: [],
    });
    expect(account.balance).toBe(0);
    expect(account.owesMe.bookings).toHaveLength(0);
  });
});
