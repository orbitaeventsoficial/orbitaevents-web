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

import CalendarSyncButton from '@/app/admin/bookings/[id]/CalendarSyncButton';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('CalendarSyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('mostra alerta accessible si sincronitzar Google Calendar falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Calendar sense permisos' }),
    } as Response);

    render(<CalendarSyncButton bookingId="booking-1" />);

    const button = screen.getByRole('button', { name: 'Sincronitza Google Calendar ara' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Calendar sense permisos');
    });

    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/bookings/booking-1/calendar-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
