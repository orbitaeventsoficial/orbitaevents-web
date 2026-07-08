import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/app/admin/bookings/BookingServiceLinesSection', () => ({
  default: ({ lines }: { lines: unknown[] }) => (
    <div data-testid="service-lines">{lines.length}</div>
  ),
}));

vi.mock('@/app/admin/components/BoloTripCard', () => ({
  default: () => <div data-testid="trip-card" />,
  CROWDED_TRIP_THRESHOLD: 2,
}));

vi.mock('@/app/admin/bookings/useBookingDistance', () => ({
  useBookingDistance: () => ({ calculatingDistance: false, distanceMessage: null }),
}));

import LeadBoloSection from '@/app/admin/leads/[id]/LeadBoloSection';

describe('LeadBoloSection repartiment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: async () => ({
        internalTravelCost: 0,
        lines: [
          {
            collaboratorId: 'masquerade',
            kind: 'PROVIDER_SERVICE',
            label: 'Bingo Musical (Masquerade)',
            revenueAmount: 240,
            costAmount: 160,
            quantity: 1,
            notes: null,
          },
        ],
      }),
    });
  });

  it('mostra el repartiment estimat del lead abans de formalitzar reserva', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Repartiment estimat del lead')).toBeInTheDocument();
    });

    expect(screen.getByText('qui cobra què · abans de formalitzar reserva')).toBeInTheDocument();
    expect(screen.getAllByText('Masquerade')).toHaveLength(2);
    expect(screen.getByText('Bingo Musical (Masquerade)')).toBeInTheDocument();
  });
});
