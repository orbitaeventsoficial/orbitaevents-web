import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args) }));
vi.mock('@/app/admin/components/ToastProvider', () => ({ useToast: () => toastApi }));

import BookingTotalEditor from '@/app/admin/bookings/[id]/BookingTotalEditor';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('BookingTotalEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({ ok: true });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('desa el total pactat per PATCH i refresca si la resposta es OK', async () => {
    render(<BookingTotalEditor bookingId="book-1" total={1200} costFloor={700} />);

    fireEvent.click(screen.getByTitle('Clic per editar el total'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1500' } });
    fireEvent.click(screen.getByRole('button', { name: '✓' }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const [url, opts] = mockFetchWithCsrf.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/bookings/book-1');
    expect(opts.method).toBe('PATCH');
    expect(JSON.parse(String(opts.body))).toEqual({ totalPrice: 1500 });
    await waitFor(() => expect(toastApi.success).toHaveBeenCalledWith('Total actualitzat.'));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('no canta exit ni refresca si el PATCH del total falla', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Total rebutjat per l’API' }),
    });
    render(<BookingTotalEditor bookingId="book-2" total={1200} costFloor={700} />);

    fireEvent.click(screen.getByTitle('Clic per editar el total'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1500' } });
    fireEvent.click(screen.getByRole('button', { name: '✓' }));

    await waitFor(() => expect(toastApi.error).toHaveBeenCalledWith('Total rebutjat per l’API'));
    expect(screen.getByRole('alert')).toHaveTextContent('Total rebutjat per l’API');
    expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: '✓' })).toHaveAttribute('aria-invalid', 'true');
    expect(toastApi.success).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
