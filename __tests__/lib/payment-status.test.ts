import { describe, it, expect } from 'vitest';
import {
  getPaymentBand, getPaymentLabel, getPaymentTextClass, getPaymentDotClass,
} from '@/lib/payment-status';

describe('payment-status — estat de pagament canònic', () => {
  it('banda segons depositPaid/remainingPaid (regla canònica)', () => {
    expect(getPaymentBand(true, true)).toBe('paid');
    expect(getPaymentBand(true, false)).toBe('partial');
    expect(getPaymentBand(false, false)).toBe('pending');
    // remainingPaid sense deposit no hauria de passar a la pràctica → pending
    expect(getPaymentBand(false, true)).toBe('pending');
  });

  it('label canònic unificat (abans «Completat» a la fitxa vs «Pagat» a la llista)', () => {
    expect(getPaymentLabel(true, true)).toBe('Pagat');
    expect(getPaymentLabel(true, false)).toBe('Parcial');
    expect(getPaymentLabel(false, false)).toBe('Pendent');
  });

  it('to de text canònic (admin-tone)', () => {
    expect(getPaymentTextClass(true, true)).toBe('admin-tone-text-success');
    expect(getPaymentTextClass(true, false)).toBe('admin-tone-text-warning');
    expect(getPaymentTextClass(false, false)).toBe('admin-tone-text-danger');
  });

  it('to de punt/fons canònic', () => {
    expect(getPaymentDotClass(true, true)).toBe('admin-tone-bg-success');
    expect(getPaymentDotClass(true, false)).toBe('admin-tone-bg-warning');
    expect(getPaymentDotClass(false, false)).toBe('admin-tone-bg-danger');
  });
});
