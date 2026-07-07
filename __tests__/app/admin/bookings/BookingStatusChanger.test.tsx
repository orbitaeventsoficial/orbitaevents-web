import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { BookingStatusChanger } from '@/app/admin/bookings/[id]/BookingStatusChanger';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('BookingStatusChanger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('mostra alerta accessible si canviar estat falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Calendari bloquejat' }),
    } as Response);

    render(<BookingStatusChanger bookingId="booking-1" currentStatus="PENDING" guestCount={80} />);

    const trigger = screen.getByRole('button', { name: 'Pendent' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Confirmada' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Calendari bloquejat');
    });

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/bookings/booking-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
