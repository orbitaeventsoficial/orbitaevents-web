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

import PaymentReminderActions from '@/app/admin/economia/PaymentReminderActions';

describe('PaymentReminderActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });
  });

  it('envia recordatori per email i refresca Economia quan communications respon OK', async () => {
    render(<PaymentReminderActions bookingId="booking-1" phone="+34 600 111 222" message="Recordatori pendent" />);

    fireEvent.click(screen.getByRole('button', { name: 'Email' }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const [url, opts] = mockFetchWithCsrf.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/bookings/booking-1/communications');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(String(opts.body))).toEqual({ action: 'send_email', flow: 'PAYMENT' });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra error visible i no refresca quan WhatsApp API torna ok:false', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: false, error: 'Canal WhatsApp no configurat' }),
    });

    render(<PaymentReminderActions bookingId="booking-2" phone="+34 600 111 222" message="Recordatori pendent" />);

    fireEvent.click(screen.getByRole('button', { name: 'WA API' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Canal WhatsApp no configurat');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'WA API' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Email' })).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: 'Marcar WA enviat' })).not.toHaveAttribute('aria-invalid');
  });
});
