import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookingCustomerPreview } from '@/lib/services/bookings/bookingCustomerLinkService';

const { mockFetchWithCsrf, mockRefresh, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => toastApi,
}));

import BookingCustomerLinkPanel from '@/app/admin/bookings/[id]/BookingCustomerLinkPanel';

const matchPreview: BookingCustomerPreview = {
  kind: 'matches-found',
  matches: [
    {
      customerId: 'customer-1',
      customerName: 'Client Existing',
      customerEmail: 'client@example.com',
      customerPhone: '600000000',
      matchedBy: ['email'],
      confidence: 'strong',
    },
  ],
};

const multiMatchPreview: BookingCustomerPreview = {
  kind: 'matches-found',
  matches: [
    ...matchPreview.matches,
    {
      customerId: 'customer-2',
      customerName: 'Client Similar',
      customerEmail: 'similar@example.com',
      customerPhone: '600000001',
      matchedBy: ['name'],
      confidence: 'medium',
    },
  ],
};

describe('BookingCustomerLinkPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mostra error visible si vincular a un client existent falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Client no trobat' }),
    } as Response);

    render(<BookingCustomerLinkPanel bookingId="booking-1" preview={matchPreview} />);

    fireEvent.click(screen.getByRole('button', { name: 'Vincular' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Client no trobat');
    });

    expect(toastApi.error).toHaveBeenCalledWith('Client no trobat');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Vincular' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('marca nomes la coincidencia de client que ha fallat', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: 'Client similar bloquejat' }),
    } as Response);

    render(<BookingCustomerLinkPanel bookingId="booking-1" preview={multiMatchPreview} />);

    const firstMatch = screen.getByText('Client Existing').closest('li');
    const secondMatch = screen.getByText('Client Similar').closest('li');
    expect(firstMatch).not.toBeNull();
    expect(secondMatch).not.toBeNull();

    const firstButton = within(firstMatch as HTMLElement).getByRole('button', { name: 'Vincular' });
    const secondButton = within(secondMatch as HTMLElement).getByRole('button', { name: 'Vincular' });

    fireEvent.click(secondButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Client similar bloquejat');
    });

    expect(firstButton).not.toHaveAttribute('aria-invalid');
    expect(secondButton).toHaveAttribute('aria-invalid', 'true');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('captura error de xarxa en crear client nou i desbloqueja el boto', async () => {
    mockFetchWithCsrf.mockRejectedValueOnce(new Error('Sense xarxa'));

    render(<BookingCustomerLinkPanel bookingId="booking-2" preview={{ kind: 'no-match' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear client' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Sense xarxa');
    });

    expect(toastApi.error).toHaveBeenCalledWith('Sense xarxa');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Crear client' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Crear client' })).toHaveAttribute('aria-invalid', 'true');
  });
});
