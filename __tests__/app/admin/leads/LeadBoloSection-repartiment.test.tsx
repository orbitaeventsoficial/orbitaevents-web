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
  default: ({ calculationNotes = [] }: { calculationNotes?: string[] }) => (
    <div data-testid="trip-card">
      {calculationNotes.map((note) => <p key={note}>{note}</p>)}
    </div>
  ),
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
      expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    const panel = screen.getByLabelText('Qui cobra què al lead');
    expect(panel).toHaveAttribute('id', 'lead-repartiment');
    expect(panel).toHaveClass('ap-ledger-budget--repartiment');
    expect(screen.getByText('pre-proposta · import a validar abans de crear dossier o pressupost')).toBeInTheDocument();
    expect(screen.getByText('Sense restar costos interns davant del partner.')).toBeInTheDocument();
    expect(screen.getByText('import a validar · 1 línia')).toBeInTheDocument();
    const peopleSummary = panel.querySelector('.ap-rep-people');
    expect(peopleSummary?.textContent).toContain('Masquerade');
    expect(peopleSummary?.textContent).not.toContain('Òrbita');
    expect(screen.queryByText('Òrbita (tu)')).not.toBeInTheDocument();
    expect(screen.getByText('Detall intern de costos i ruta').closest('details')).not.toHaveAttribute('open');
    expect(screen.getAllByText('Bingo Musical (Masquerade)').length).toBeGreaterThan(0);
    const firstRow = screen.getAllByText('Bingo Musical (Masquerade)').find((node) => node.closest('.ap-rep-row'))?.closest('.ap-rep-row');
    expect(firstRow?.querySelector('[data-label="Client paga"]')).not.toBeNull();
    expect(firstRow?.querySelector('[data-label="Cost/liquid."]')).not.toBeNull();
    expect(firstRow?.querySelector('[data-label="Qui cobra"]')).not.toBeNull();
    expect(firstRow?.querySelector('[data-label="Net Òrbita"]')).not.toBeNull();
  });

  it('inclou transport, hores de ruta, peatges i dietes al repartiment del lead', async () => {
    mockFetchWithCsrf.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        internalTravelCost: 0,
        lines: [
          {
            collaboratorId: 'masquerade',
            kind: 'PROVIDER_SERVICE',
            label: 'Bingo Musical (Masquerade)',
            revenueAmount: 240,
            costAmount: 200,
            quantity: 1,
            notes: null,
          },
          {
            collaboratorId: 'masquerade',
            kind: 'SOUND_TECH',
            label: 'Tècnic de so inclòs · 1h 30',
            revenueAmount: 0,
            costAmount: -40,
            quantity: 1,
            notes: null,
          },
          {
            kind: 'DJ',
            label: 'DJ · 1a hora',
            revenueAmount: 150,
            costAmount: 0,
            quantity: 1,
            notes: null,
          },
        ],
      }),
    });

    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
        initialDistanceKm={422}
        initialTollsEur={18.5}
      />,
    );

    await waitFor(() => {
    expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    expect(screen.getByText('Transport client')).toBeInTheDocument();
    expect(screen.getByText('Transport client').closest('.ap-rep-row')?.querySelector('[data-label="Net Òrbita"]')).not.toBeNull();
    expect(screen.getByText('Temps ruta conductor · Òrbita')).toBeInTheDocument();
    expect(screen.getAllByText('Temps ruta passatger · Masquerade').length).toBeGreaterThan(0);
    expect(screen.getByText('Peatges ruta · Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Dieta desplaçament · Òrbita')).toBeInTheDocument();
    expect(screen.getAllByText('Dieta desplaçament · Masquerade').length).toBeGreaterThan(0);
    expect(screen.getByText('Detall a validar amb Masquerade')).toBeInTheDocument();
    expect(screen.getAllByText('Hores ruta: 422 km / 65 km/h = 6,49 h.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Temps cobrable: 6,49 h - 1 h inclosa = 5,5 h.').length).toBeGreaterThan(0);
    expect(screen.getAllByText((text) => text.includes('Hores de cotxe: 5,5 h x 15,00') && text.includes('82,50') && text.includes('2 persones = 165,00')).length).toBeGreaterThan(0);
    expect(screen.getAllByText((text) => text.includes('Dietes: ruta > 3 h; 30,00') && text.includes('2 persones = 60,00')).length).toBeGreaterThan(0);
    expect(screen.getByText('Compensació a Òrbita · Tècnic de so inclòs · 1h 30')).toBeInTheDocument();
    expect(screen.getByText('Operari Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Cost intern Òrbita')).toBeInTheDocument();
    expect(screen.getByText('Benefici net Òrbita')).toBeInTheDocument();
  });

  it('fa explícit quan hi ha ruta però els peatges no estan informats', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
        initialDistanceKm={411.4}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    expect(screen.getByText('peatges no informats')).toBeInTheDocument();
  });
});
