import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh, mockLogError, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
  mockLogError: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/lib/logger', () => ({
  log: { error: (...args: unknown[]) => mockLogError(...args) },
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => toastApi,
}));

vi.mock('@/app/admin/components/Tooltip', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/app/admin/components/BoloTripCard', () => ({
  CROWDED_TRIP_THRESHOLD: 3,
  default: ({
    distanceKm,
    onDistanceChange,
  }: {
    distanceKm: string;
    onDistanceChange: (value: string) => void;
  }) => (
    <input
      aria-label="Distància transport"
      value={distanceKm}
      onChange={(event) => onDistanceChange(event.target.value)}
    />
  ),
}));

import BookingMarginCard from '@/app/admin/bookings/[id]/BookingMarginCard';

const baseProps = {
  bookingId: 'booking-1',
  total: 1200,
  packPrice: 900,
  extrasTotal: 0,
  extraHours: 0,
  extraHourPrice: 0,
  distanceKm: 20,
  vehicleCostPerKm: 0.45,
  storedTravelCost: null,
  tollsEur: null,
  eventLocation: null,
  eventVenue: null,
  inventoryCostReal: null,
  inventoryHours: null,
  inventoryRemainingHoursAvg: null,
  inventoryRemainingHoursMin: null,
  packCostRatio: 0.25,
  extraCostRatio: 0.15,
  extraHourCostRatio: 0.4,
  fixedOperationalCost: 60,
  targetMarginPct: 35,
};

describe('BookingMarginCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra alerta persistent si desar costos de viatge falla', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No es pot desar transport' }),
    } as Response);

    render(<BookingMarginCard {...baseProps} />);

    fireEvent.change(screen.getByLabelText('Distància transport'), {
      target: { value: '42' },
    });

    const saveButton = await screen.findByRole('button', { name: 'Desar canvis' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No es pot desar transport');
    });

    expect(saveButton).toHaveAttribute('aria-invalid', 'true');
    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/api/admin/bookings/booking-1', expect.objectContaining({
      method: 'PATCH',
    }));
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(toastApi.error).toHaveBeenCalledWith('No es pot desar transport');
    expect(mockLogError).toHaveBeenCalled();
  });

  it('el desglossament de costos va plegat per defecte (canon: detalls secundaris amb <details>)', () => {
    render(<BookingMarginCard {...baseProps} />);

    const summary = screen.getByText('Desglossament de costos');
    const details = summary.closest('details');

    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
  });
});
