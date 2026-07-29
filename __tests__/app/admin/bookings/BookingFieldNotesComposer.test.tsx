import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookingFieldNotesComposer from '@/app/admin/bookings/[id]/BookingFieldNotesComposer';
import { fetchWithCsrf } from '@/lib/csrf';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

const mockFetchWithCsrf = vi.mocked(fetchWithCsrf);
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockRefresh.mockReset();
  mockFetchWithCsrf.mockReset();
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('BookingFieldNotesComposer', () => {
  it('envia foto + nota com a captura interna i refresca la reserva', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, body: { id: 'photo-1' } }),
    } as Response);

    const appendSpy = vi.spyOn(FormData.prototype, 'append');

    render(<BookingFieldNotesComposer bookingId="booking-1" />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Muntatge complet abans de l’obertura' },
    });

    const file = new File(['fake-image'], 'bolo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/api/admin/bookings/booking-1/gallery',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(appendSpy).toHaveBeenCalledWith('file', file);
    expect(appendSpy).toHaveBeenCalledWith('caption', 'Muntatge complet abans de l’obertura');
    expect(appendSpy).toHaveBeenCalledWith('isPortal', 'false');
    expect(appendSpy).toHaveBeenCalledWith('isPortfolio', 'false');
    expect(mockRefresh).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Captura guardada al bolo');

    appendSpy.mockRestore();
  });

  it('mostra error si la pujada falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Fitxer massa gran' }),
    } as Response);

    render(<BookingFieldNotesComposer bookingId="booking-2" />);

    const file = new File(['fake-image'], 'bolo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Fitxer massa gran');
    });

    expect(screen.getByRole('button', { name: '+ Foto' })).toHaveAttribute('aria-invalid', 'true');
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
