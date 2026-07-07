import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockClipboardWriteText } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockClipboardWriteText: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

import StripePaymentPanel from '@/app/admin/bookings/[id]/StripePaymentPanel';

const baseProps = {
  bookingId: 'booking-1',
  depositPaid: false,
  depositPaymentUrl: null,
  depositBizumDeclaredAt: null,
  remainingPaid: false,
  remainingPaymentUrl: null,
  remainingBizumDeclaredAt: null,
  depositAmount: 300,
  remainingAmount: 700,
  stripeConfigured: true,
};

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('StripePaymentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockClipboardWriteText },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('amaga link i generació quan el tram té efectiu parcial', () => {
    render(
      <StripePaymentPanel
        {...baseProps}
        depositPaymentUrl="https://checkout.stripe.com/c/old_deposit"
        depositAmount={175}
        depositOnlineBlocked
      />,
    );

    expect(screen.getByText('Import parcial')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Obrir' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Regenerar|Generar link/ })).not.toBeInTheDocument();
  });

  it('marca tot pagat si els trams arriben liquidats', () => {
    render(
      <StripePaymentPanel
        {...baseProps}
        depositPaid
        remainingPaid
      />,
    );

    expect(screen.getByText('✓ Tot pagat')).toBeInTheDocument();
  });

  it('no mostra Bizum pendent si la declaracio antiga ja correspon a un tram liquidat', () => {
    render(
      <StripePaymentPanel
        {...baseProps}
        depositPaid
        depositBizumDeclaredAt={new Date('2026-07-07T08:00:00Z')}
      />,
    );

    expect(screen.queryByText('● Bizum pendent')).not.toBeInTheDocument();
    expect(screen.queryByText(/El client declara que ha fet el Bizum de la paga i senyal/)).not.toBeInTheDocument();
  });

  it('mostra alerta accessible si Stripe rebutja generar link', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'STRIPE_NOT_CONFIGURED' }),
    } as Response);

    render(<StripePaymentPanel {...baseProps} />);

    const button = screen.getByRole('button', { name: 'Generar link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Stripe no està configurat en aquest entorn. Falta STRIPE_SECRET_KEY.');
    });

    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/bookings/booking-1/stripe-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentType: 'deposit' }),
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('mostra alerta accessible si confirmar Bizum falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: 'ALREADY_PAID' }),
    } as Response);

    render(
      <StripePaymentPanel
        {...baseProps}
        depositBizumDeclaredAt={new Date('2026-07-07T08:00:00Z')}
      />,
    );

    const button = screen.getByRole('button', { name: 'Confirmar' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('El pagament ja estava confirmat.');
    });

    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/bookings/booking-1/confirm-bizum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentType: 'deposit' }),
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('marca nomes el tram Bizum que falla quan hi ha dos pendents', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'CONFIRM_FAILED' }),
    } as Response);

    render(
      <StripePaymentPanel
        {...baseProps}
        depositBizumDeclaredAt={new Date('2026-07-07T08:00:00Z')}
        remainingBizumDeclaredAt={new Date('2026-07-07T08:05:00Z')}
      />,
    );

    const [depositButton, remainingButton] = screen.getAllByRole('button', { name: 'Confirmar' });
    fireEvent.click(remainingButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s\'ha pogut confirmar. Recarrega i torna a intentar-ho.');
    });

    expect(depositButton).not.toHaveAttribute('aria-invalid');
    expect(remainingButton).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/bookings/booking-1/confirm-bizum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentType: 'remaining' }),
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('mostra alerta accessible si no pot copiar el link Stripe', async () => {
    mockClipboardWriteText.mockRejectedValueOnce(new Error('clipboard denied'));

    render(
      <StripePaymentPanel
        {...baseProps}
        depositPaymentUrl="https://checkout.stripe.com/c/deposit"
      />,
    );

    const copyButton = screen.getByRole('button', { name: /Copiar/ });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No s\'ha pogut copiar el link de pagament.');
    });

    expect(copyButton).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute('aria-invalid');
    expect(mockClipboardWriteText).toHaveBeenCalledWith('https://checkout.stripe.com/c/deposit');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
