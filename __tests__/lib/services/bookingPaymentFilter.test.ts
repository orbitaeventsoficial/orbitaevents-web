import { describe, expect, it } from 'vitest';
import { buildBookingsWhere, getPaymentFilterLabel, resolvePaymentFilter } from '@/lib/services/bookingPaymentFilter';

function andClauses(where: unknown): any[] {
  return ((where as any).AND ?? []) as any[];
}

function fieldName(fieldRef: unknown): string | undefined {
  return (fieldRef as { name?: string })?.name;
}

describe('bookingPaymentFilter', () => {
  const now = new Date('2026-07-07T10:00:00.000Z');

  it('resol només filtres de pagament coneguts', () => {
    expect(resolvePaymentFilter('deposit-pending')).toBe('deposit-pending');
    expect(resolvePaymentFilter('overdue')).toBe('overdue');
    expect(resolvePaymentFilter('due-soon')).toBe('due-soon');
    expect(resolvePaymentFilter('unknown')).toBeNull();
    expect(getPaymentFilterLabel('overdue')).toBe('Cobraments vençuts');
  });

  it('ignora status i eventType invalids abans de construir el where', () => {
    const { where } = buildBookingsWhere({ status: 'INVALID', eventType: 'NOPE' }, now);
    expect(andClauses(where)).toEqual([]);
  });

  it('filtra bestreta pendent amb cashAmount inferior a depositAmount', () => {
    const { where } = buildBookingsWhere({ payment: 'deposit-pending' }, now);
    const [payment] = andClauses(where);

    expect(payment.depositPaid).toBe(false);
    expect(payment.OR[0]).toEqual({ cashAmount: null });
    expect(fieldName(payment.OR[1].cashAmount.lt)).toBe('depositAmount');
  });

  it('filtra vencuts amb pendent real de bestreta o saldo', () => {
    const { where } = buildBookingsWhere({ payment: 'overdue' }, now);
    const [payment] = andClauses(where);
    const [deposit, remaining] = payment.OR;

    expect(deposit.depositPaid).toBe(false);
    expect(fieldName(deposit.OR[1].cashAmount.lt)).toBe('depositAmount');
    expect(remaining.remainingPaid).toBe(false);
    expect(remaining.OR[0]).toEqual({ cashAmount: null });
    expect(remaining.OR[1].depositPaid).toBe(true);
    expect(fieldName(remaining.OR[1].cashAmount.lt)).toBe('remainingAmount');
    expect(remaining.OR[2].depositPaid).toBe(false);
    expect(fieldName(remaining.OR[2].cashAmount.lt)).toBe('total');
  });

  it('filtra propers amb les mateixes condicions cash-aware', () => {
    const { where } = buildBookingsWhere({ payment: 'due-soon' }, now);
    const [payment] = andClauses(where);
    const [deposit, remaining] = payment.OR;

    expect(deposit.eventDate).toMatchObject({
      gte: new Date('2026-08-06T10:00:00.000Z'),
      lte: new Date('2026-08-13T10:00:00.000Z'),
    });
    expect(fieldName(deposit.OR[1].cashAmount.lt)).toBe('depositAmount');
    expect(remaining.eventDate).toMatchObject({
      gte: new Date('2026-07-14T10:00:00.000Z'),
      lte: new Date('2026-07-21T10:00:00.000Z'),
    });
    expect(fieldName(remaining.OR[1].cashAmount.lt)).toBe('remainingAmount');
    expect(fieldName(remaining.OR[2].cashAmount.lt)).toBe('total');
  });
});
