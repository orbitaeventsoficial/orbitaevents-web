import { describe, it, expect } from 'vitest';
import {
  getPaymentBand, getPaymentLabel, getPaymentTextClass, getPaymentDotClass,
} from '@/lib/payment-status';

describe('payment-status — estat de pagament canònic', () => {
  it('banda segons depositPaid/remainingPaid (regla canònica)', () => {
    expect(getPaymentBand(true, true)).toBe('paid');
    expect(getPaymentBand(true, false)).toBe('partial');
    expect(getPaymentBand(false, false)).toBe('pending');
    // Trams independents: si la resta està pagada però la bestreta no, és parcial.
    expect(getPaymentBand(false, true)).toBe('partial');
  });

  it('reconeix efectiu registrat com a cobertura real del pagament', () => {
    expect(getPaymentBand(false, false, { cashAmount: 300, total: 300 })).toBe('paid');
    expect(getPaymentLabel(false, false, { cashAmount: 300, total: 300 })).toBe('Pagat');
    expect(getPaymentTextClass(false, false, { cashAmount: 300, total: 300 })).toBe('admin-tone-text-success');
    expect(getPaymentDotClass(false, false, { cashAmount: 300, total: 300 })).toBe('admin-tone-bg-success');
  });

  it('tracta efectiu parcial com a parcial sense marcar-ho pagat', () => {
    expect(getPaymentBand(false, false, { cashAmount: 100, total: 300 })).toBe('partial');
    expect(getPaymentLabel(false, false, { cashAmount: 100, total: 300 })).toBe('Parcial');
  });

  it('label canònic unificat (abans «Completat» a la fitxa vs «Pagat» a la llista)', () => {
    expect(getPaymentLabel(true, true)).toBe('Pagat');
    expect(getPaymentLabel(true, false)).toBe('Parcial');
    expect(getPaymentLabel(false, true)).toBe('Parcial');
    expect(getPaymentLabel(false, false)).toBe('Pendent');
  });

  it('to de text canònic (admin-tone)', () => {
    expect(getPaymentTextClass(true, true)).toBe('admin-tone-text-success');
    expect(getPaymentTextClass(true, false)).toBe('admin-tone-text-warning');
    expect(getPaymentTextClass(false, true)).toBe('admin-tone-text-warning');
    expect(getPaymentTextClass(false, false)).toBe('admin-tone-text-danger');
  });

  it('to de punt/fons canònic', () => {
    expect(getPaymentDotClass(true, true)).toBe('admin-tone-bg-success');
    expect(getPaymentDotClass(true, false)).toBe('admin-tone-bg-warning');
    expect(getPaymentDotClass(false, true)).toBe('admin-tone-bg-warning');
    expect(getPaymentDotClass(false, false)).toBe('admin-tone-bg-danger');
  });
});
