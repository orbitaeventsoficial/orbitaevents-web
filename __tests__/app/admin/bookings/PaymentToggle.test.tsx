import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args) }));
vi.mock('@/app/admin/components/ToastProvider', () => ({ useToast: () => toastApi }));

import PaymentToggle from '@/app/admin/bookings/[id]/PaymentToggle';

describe('PaymentToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({ ok: true });
  });

  it('mostra «Marcar pagat» quan està pendent', () => {
    render(<PaymentToggle bookingId="b1" field="depositPaid" paid={false} />);
    expect(screen.getByRole('button', { name: 'Marcar pagat' })).toBeInTheDocument();
  });

  it('mostra «✓ Pagat» quan ja està pagat', () => {
    render(<PaymentToggle bookingId="b1" field="remainingPaid" paid={true} />);
    expect(screen.getByRole('button', { name: '✓ Pagat' })).toBeInTheDocument();
  });

  it('en marcar pagat fa PATCH amb el camp i la data correctes', async () => {
    render(<PaymentToggle bookingId="b1" field="depositPaid" paid={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar pagat' }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const [url, opts] = mockFetchWithCsrf.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/bookings/b1');
    expect(opts.method).toBe('PATCH');
    const body = JSON.parse(String(opts.body));
    expect(body.depositPaid).toBe(true);
    expect(typeof body.depositPaidAt).toBe('string');
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it('en desmarcar envia el camp a false i la data a null', async () => {
    render(<PaymentToggle bookingId="b2" field="remainingPaid" paid={true} />);
    fireEvent.click(screen.getByRole('button', { name: '✓ Pagat' }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String((mockFetchWithCsrf.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.remainingPaid).toBe(false);
    expect(body.remainingPaidAt).toBeNull();
  });

  it('reverteix l’estat òptim si el PATCH falla', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Pagament bloquejat' }),
    });
    render(<PaymentToggle bookingId="b3" field="depositPaid" paid={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar pagat' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Pagament bloquejat'));
    expect(toastApi.error).toHaveBeenCalledWith('Pagament bloquejat');
    expect(screen.getByRole('button', { name: 'Marcar pagat' })).toHaveAttribute('aria-invalid', 'true');
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
