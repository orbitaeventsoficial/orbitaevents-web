import { describe, expect, it } from 'vitest';
import { buildClientPortalPaymentsPath, getClientPortalPaymentSummary } from '@/lib/clientPortalPayment';

describe('getClientPortalPaymentSummary', () => {
  it('marca la paga i senyal com a pagable online si hi ha link i encara no està pagada', () => {
    const result = getClientPortalPaymentSummary({
      depositAmount: 300,
      depositPaid: false,
      depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit',
      remainingAmount: 700,
      remainingPaid: false,
      remainingPaymentUrl: null,
    });

    expect(result.deposit.payableOnline).toBe(true);
    expect(result.deposit.paymentUrl).toBe('https://checkout.stripe.com/c/pay_deposit');
    expect(result.remaining.payableOnline).toBe(false);
    expect(result.nextPayment).toBe('deposit');
    expect(result.notice).toBe('deposit_payable');
  });

  it('només activa la resta online quan la paga i senyal ja està pagada', () => {
    const result = getClientPortalPaymentSummary({
      depositAmount: 300,
      depositPaid: true,
      depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit',
      remainingAmount: 700,
      remainingPaid: false,
      remainingPaymentUrl: 'https://checkout.stripe.com/c/pay_remaining',
    });

    expect(result.deposit.payableOnline).toBe(false);
    expect(result.remaining.payableOnline).toBe(true);
    expect(result.nextPayment).toBe('remaining');
    expect(result.notice).toBe('remaining_payable');
  });

  it('ignora links buits o no http per no exposar CTAs trencats', () => {
    const result = getClientPortalPaymentSummary({
      depositAmount: 300,
      depositPaid: false,
      depositPaymentUrl: '/checkout/local',
      remainingAmount: 700,
      remainingPaid: false,
      remainingPaymentUrl: '   ',
    });

    expect(result.deposit.paymentUrl).toBeNull();
    expect(result.deposit.payableOnline).toBe(false);
    expect(result.remaining.paymentUrl).toBeNull();
    expect(result.nextPayment).toBeNull();
    expect(result.notice).toBe('manual_pending');
  });

  it('explica que la paga i senyal ja està rebuda quan només queda resta sense link', () => {
    const result = getClientPortalPaymentSummary({
      depositAmount: 300,
      depositPaid: true,
      depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit',
      remainingAmount: 700,
      remainingPaid: false,
      remainingPaymentUrl: null,
    });

    expect(result.nextPayment).toBeNull();
    expect(result.notice).toBe('deposit_paid_remaining_pending');
  });

  it('marca el pagament com a complet quan no queda cap import pendent', () => {
    const result = getClientPortalPaymentSummary({
      depositAmount: 300,
      depositPaid: true,
      depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit',
      remainingAmount: 700,
      remainingPaid: true,
      remainingPaymentUrl: 'https://checkout.stripe.com/c/pay_remaining',
    });

    expect(result.deposit.payableOnline).toBe(false);
    expect(result.remaining.payableOnline).toBe(false);
    expect(result.nextPayment).toBeNull();
    expect(result.notice).toBe('all_paid');
  });

  it('tracta cashAmount complet com a pagament complet encara que els flags siguin falsos', () => {
    const result = getClientPortalPaymentSummary({
      total: 1000,
      depositAmount: 300,
      depositPaid: false,
      depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit',
      remainingAmount: 700,
      remainingPaid: false,
      remainingPaymentUrl: 'https://checkout.stripe.com/c/pay_remaining',
      cashAmount: 1000,
    });

    expect(result.deposit.paid).toBe(true);
    expect(result.remaining.paid).toBe(true);
    expect(result.deposit.payableOnline).toBe(false);
    expect(result.remaining.payableOnline).toBe(false);
    expect(result.nextPayment).toBeNull();
    expect(result.notice).toBe('all_paid');
  });

  it('si cashAmount cobreix la bestreta, activa la resta com a proper pagament', () => {
    const result = getClientPortalPaymentSummary({
      total: 1000,
      depositAmount: 300,
      depositPaid: false,
      depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit',
      remainingAmount: 700,
      remainingPaid: false,
      remainingPaymentUrl: 'https://checkout.stripe.com/c/pay_remaining',
      cashAmount: 300,
    });

    expect(result.deposit.paid).toBe(true);
    expect(result.remaining.paid).toBe(false);
    expect(result.deposit.payableOnline).toBe(false);
    expect(result.remaining.payableOnline).toBe(true);
    expect(result.nextPayment).toBe('remaining');
    expect(result.notice).toBe('remaining_payable');
  });

  it('no exposa un link online antic si cashAmount redueix parcialment la bestreta', () => {
    const result = getClientPortalPaymentSummary({
      total: 1000,
      depositAmount: 300,
      depositPaid: false,
      depositPaymentUrl: 'https://checkout.stripe.com/c/pay_deposit',
      remainingAmount: 700,
      remainingPaid: false,
      remainingPaymentUrl: 'https://checkout.stripe.com/c/pay_remaining',
      cashAmount: 100,
    });

    expect(result.deposit.amount).toBe(200);
    expect(result.deposit.paid).toBe(false);
    expect(result.deposit.payableOnline).toBe(false);
    expect(result.remaining.payableOnline).toBe(false);
    expect(result.nextPayment).toBeNull();
    expect(result.notice).toBe('manual_pending');
  });
});

describe('buildClientPortalPaymentsPath', () => {
  it('construeix la ruta interna de pagaments dins del portal', () => {
    expect(buildClientPortalPaymentsPath('ca', 'token-123')).toBe('/ca/portal/token-123/payments');
  });
});
