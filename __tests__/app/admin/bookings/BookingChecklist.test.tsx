import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => toastApi,
}));

import BookingChecklist from '@/app/admin/bookings/[id]/BookingChecklist';

function okResponse(items: Array<{ id: string; label: string; checked: boolean }>) {
  return {
    ok: true,
    json: async () => ({ ok: true, items }),
  } as Response;
}

function errorResponse(message: string) {
  return {
    ok: false,
    json: async () => ({ ok: false, error: message }),
  } as Response;
}

describe('BookingChecklist', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('reverteix el toggle optimista si el PUT falla', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce(okResponse([{ id: 'contract', label: 'Contracte signat', checked: false }]))
      .mockResolvedValueOnce(errorResponse('Checklist bloquejada'));

    render(<BookingChecklist bookingId="booking-1" />);

    const toggle = await screen.findByRole('button', { name: 'Marcar: Contracte signat' });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Checklist bloquejada');
    });

    expect(screen.getByRole('button', { name: 'Marcar: Contracte signat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar: Contracte signat' })).toHaveAttribute('aria-invalid', 'true');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(toastApi.error).toHaveBeenCalledWith('Checklist bloquejada');
    const [, request] = mockFetchWithCsrf.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toEqual({
      items: [{ id: 'contract', label: 'Contracte signat', checked: true }],
    });
  });

  it('recupera el text del nou item si crear-lo no es desa', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce(okResponse([]))
      .mockResolvedValueOnce(errorResponse('No hi ha connexio'));

    render(<BookingChecklist bookingId="booking-2" />);

    fireEvent.click(await screen.findByRole('button', { name: '+ Afegir ítem' }));
    fireEvent.change(screen.getByPlaceholderText('Nou ítem...'), {
      target: { value: 'Trucar al client' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Afegir' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No hi ha connexio');
    });

    expect(screen.getByPlaceholderText('Nou ítem...')).toHaveValue('Trucar al client');
    expect(screen.getByPlaceholderText('Nou ítem...')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Afegir' })).toHaveAttribute('aria-invalid', 'true');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.queryByText('Trucar al client')).not.toBeInTheDocument();
  });
});
