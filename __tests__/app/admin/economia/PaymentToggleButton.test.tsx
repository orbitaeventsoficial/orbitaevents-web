import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

import PaymentToggleButton from '@/app/admin/economia/PaymentToggleButton';

describe('PaymentToggleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({ ok: true });
  });

  it('actualitza el flag de pagament i refresca Economia quan el PATCH passa', async () => {
    render(<PaymentToggleButton bookingId="booking-1" field="depositPaid" currentValue={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pendent' }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const [url, opts] = mockFetchWithCsrf.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/bookings/booking-1');
    expect(opts.method).toBe('PATCH');
    expect(JSON.parse(String(opts.body))).toMatchObject({
      depositPaid: true,
    });
    expect(typeof JSON.parse(String(opts.body)).depositPaidAt).toBe('string');
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra error visible i no refresca si el PATCH falla', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Reserva bloquejada per permisos' }),
    });

    render(<PaymentToggleButton bookingId="booking-2" field="remainingPaid" currentValue={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pagat' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Reserva bloquejada per permisos');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pagat' })).toHaveAttribute('aria-invalid', 'true');
  });
});
