import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: (...a: unknown[]) => mockFetchWithCsrf(...a) }));
vi.mock('@/app/admin/components/ToastProvider', () => ({ useToast: () => toastApi }));

import CashPaymentButton from '@/app/admin/bookings/[id]/CashPaymentButton';

describe('CashPaymentButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({ ok: true });
  });

  it('mostra el botó quan no està tot pagat', () => {
    render(<CashPaymentButton bookingId="b1" total={340} fullyPaid={false} />);
    expect(screen.getByRole('button', { name: /Cobrat en efectiu/ })).toBeInTheDocument();
  });

  it('NO mostra el botó si ja està tot pagat', () => {
    const { container } = render(<CashPaymentButton bookingId="b1" total={340} fullyPaid={true} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('en clicar, fa PATCH que marca dipòsit+resta pagats, CASH i cashAmount=total', async () => {
    render(<CashPaymentButton bookingId="b9" total={340} fullyPaid={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Cobrat en efectiu/ }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const [url, opts] = mockFetchWithCsrf.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/bookings/b9');
    expect(opts.method).toBe('PATCH');
    const body = JSON.parse(String(opts.body));
    expect(body.depositPaid).toBe(true);
    expect(body.remainingPaid).toBe(true);
    expect(body.paymentMethod).toBe('CASH');
    expect(body.cashAmount).toBe(340);
    expect(typeof body.depositPaidAt).toBe('string');
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it('mostra la nota «Cobrat en efectiu» després de registrar-ho', async () => {
    render(<CashPaymentButton bookingId="b1" total={500} fullyPaid={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Cobrat en efectiu/ }));
    await waitFor(() => expect(screen.getByText(/Cobrat en efectiu ·/)).toBeInTheDocument());
  });

  it('mostra error i no canvia si el PATCH falla', async () => {
    mockFetchWithCsrf.mockResolvedValue({ ok: false });
    render(<CashPaymentButton bookingId="b1" total={500} fullyPaid={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Cobrat en efectiu/ }));
    await waitFor(() => expect(toastApi.error).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /Cobrat en efectiu/ })).toBeInTheDocument();
  });
});
