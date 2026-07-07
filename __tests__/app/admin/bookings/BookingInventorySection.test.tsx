import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

import BookingInventorySection from '@/app/admin/bookings/[id]/BookingInventorySection';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

const inventoryPayload = {
  assigned: [],
  available: [
    {
      id: 'item-1',
      code: 'SON-001',
      name: 'Altaveu principal',
      category: 'SOUND',
      status: 'AVAILABLE',
      condition: 'GOOD',
      watts: 500,
      value: 1200,
    },
  ],
  packTemplate: { items: [] },
  bundles: [],
};

const inventoryPayloadTwoItems = {
  ...inventoryPayload,
  available: [
    ...inventoryPayload.available,
    {
      id: 'item-2',
      code: 'MIC-001',
      name: 'Micròfon sense fils',
      category: 'SOUND',
      status: 'AVAILABLE',
      condition: 'GOOD',
      watts: null,
      value: 250,
    },
  ],
};

describe('BookingInventorySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('mostra alerta accessible si assignar inventari falla', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce({
        ok: true,
        json: async () => inventoryPayload,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Ocupat en una altra reserva activa' }),
      } as Response);

    render(<BookingInventorySection bookingId="booking-1" />);

    expect(await screen.findByText('Encara no hi ha equipament assignat')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ Afegir element' }));
    const addButton = screen.getByRole('button', { name: /^Afegir$/ });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Ocupat en una altra reserva activa');
    });

    expect(addButton).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenLastCalledWith('/api/admin/bookings/booking-1/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'item-1' }),
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('marca nomes l item disponible que no es pot assignar', async () => {
    mockFetchWithCsrf
      .mockResolvedValueOnce({
        ok: true,
        json: async () => inventoryPayloadTwoItems,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Micròfon ocupat' }),
      } as Response);

    render(<BookingInventorySection bookingId="booking-1" />);

    expect(await screen.findByText('Encara no hi ha equipament assignat')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ Afegir element' }));
    const addButtons = screen.getAllByRole('button', { name: /^Afegir$/ });
    fireEvent.click(addButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Micròfon ocupat');
    });

    expect(addButtons[0]).not.toHaveAttribute('aria-invalid');
    expect(addButtons[1]).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: '+ Afegir inventari del pack' })).not.toHaveAttribute('aria-invalid');
    expect(mockFetchWithCsrf).toHaveBeenLastCalledWith('/api/admin/bookings/booking-1/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'item-2' }),
    });
  });
});
