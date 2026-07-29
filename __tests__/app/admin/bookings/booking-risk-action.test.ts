import { describe, expect, it } from 'vitest';

import {
  resolveBookingFinanceRiskAction,
  resolveBookingMarginRiskAction,
} from '@/app/admin/bookings/[id]/booking-risk-action';

describe('booking risk action', () => {
  it('no crea accio de finances quan no hi ha pendent de caixa', () => {
    expect(resolveBookingFinanceRiskAction({
      outstandingAmount: 0,
      outstandingBand: 'ok',
      depositPaid: true,
      remainingPaid: true,
      cashAmount: null,
      total: 500,
    })).toBeNull();
  });

  it('converteix pendent alt en CTA als controls de pagament', () => {
    const action = resolveBookingFinanceRiskAction({
      outstandingAmount: 500,
      outstandingBand: 'err',
      depositPaid: false,
      remainingPaid: false,
      cashAmount: null,
      total: 500,
    });

    expect(action).toMatchObject({
      key: 'finance',
      tone: 'danger',
      title: 'Risc alt de cobrament pendent',
      primaryHref: '#booking-payment-status',
      primaryLabel: 'Revisar pagaments',
      secondaryHref: '#booking-payment-links',
    });
    expect(action?.summary).toContain('Paga i senyal i resta');
  });

  it('explica la resta pendent quan la paga i senyal ja esta cobrada', () => {
    const action = resolveBookingFinanceRiskAction({
      outstandingAmount: 350,
      outstandingBand: 'warn',
      depositPaid: true,
      remainingPaid: false,
      cashAmount: null,
      total: 500,
    });

    expect(action).toMatchObject({
      tone: 'warning',
      title: 'Cobrament pendent a revisar',
    });
    expect(action?.summary).toContain('La resta continua pendent');
  });

  it('no crea accio de marge quan el marge es sa', () => {
    expect(resolveBookingMarginRiskAction({ marginBand: 'acceptable' })).toBeNull();
    expect(resolveBookingMarginRiskAction({ marginBand: 'excellent' })).toBeNull();
  });

  it('converteix marge critic en CTA al desglossament de costos', () => {
    const action = resolveBookingMarginRiskAction({ marginBand: 'critical' });

    expect(action).toMatchObject({
      key: 'margin',
      tone: 'danger',
      title: 'Marge crític a corregir',
      primaryHref: '#booking-margin-costs',
      secondaryHref: '#sec-finances',
    });
  });

  it('marca marge watch com a vigilancia i no com a critic', () => {
    const action = resolveBookingMarginRiskAction({ marginBand: 'watch' });

    expect(action).toMatchObject({
      key: 'margin',
      tone: 'warning',
      title: 'Marge just a vigilar',
    });
  });
});
