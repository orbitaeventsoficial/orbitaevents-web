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

  it('mostra el qui cobra que del lead abans de formalitzar reserva', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Qui cobra què')).toBeInTheDocument();
    });

    const panel = screen.getByLabelText('Qui cobra què al lead');
    expect(panel).toHaveAttribute('id', 'lead-repartiment');
    expect(panel).toHaveClass('ap-ledger-budget--repartiment');
    expect(screen.getByText('estimació pre-reserva · serveis, transport i dietes')).toBeInTheDocument();
    expect(screen.getAllByText('Masquerade')).toHaveLength(2);
    expect(screen.getByText('Bingo Musical (Masquerade)')).toBeInTheDocument();
    const firstRow = screen.getByText('Bingo Musical (Masquerade)').closest('.ap-rep-row');
    expect(firstRow?.querySelector('[data-label="Client paga"]')).not.toBeNull();
    expect(firstRow?.querySelector('[data-label="Cost/liquid."]')).not.toBeNull();
    expect(firstRow?.querySelector('[data-label="Qui cobra"]')).not.toBeNull();
    expect(firstRow?.querySelector('[data-label="Net Òrbita"]')).not.toBeNull();
  });

  it('inclou transport, hores de ruta, peatges i dietes al repartiment del lead', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
        initialDistanceKm={422}
        initialTollsEur={18.5}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Qui cobra què')).toBeInTheDocument();
    });

    expect(screen.getByText('Transport client')).toBeInTheDocument();
    expect(screen.getByText('Transport client').closest('.ap-rep-row')?.querySelector('[data-label="Net Òrbita"]')).not.toBeNull();
    expect(screen.getByText('Temps ruta conductor · Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Peatges ruta · Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Dieta desplaçament · Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Operari Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Cost intern Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Benefici net Òrbita')).toBeInTheDocument();
  });
});
