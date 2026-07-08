import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRouterRefresh, toastApi } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRouterRefresh: vi.fn(),
  toastApi: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => toastApi,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

vi.mock('@/app/admin/bookings/BookingServiceLinesSection', () => ({
  default: ({ lines }: { lines: unknown[] }) => (
    <div data-testid="service-lines">{lines.length}</div>
  ),
}));

vi.mock('@/app/admin/components/BoloTripCard', () => ({
  default: ({
    calculationNotes = [],
    routeSummaryItems = [],
    compactRouteSummary = false,
    effectiveTravelCost = 0,
  }: {
    calculationNotes?: string[];
    routeSummaryItems?: Array<{ label: string; amount: number }>;
    compactRouteSummary?: boolean;
    effectiveTravelCost?: number;
  }) => (
    <div data-testid="trip-card">
      {compactRouteSummary ? (
        <>
          <p>Total ruta {effectiveTravelCost}</p>
          {routeSummaryItems.map((item) => <p key={item.label}>{item.label}: {item.amount}</p>)}
        </>
      ) : (
        calculationNotes.map((note) => <p key={note}>{note}</p>)
      )}
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

  it('mostra el pacte curt amb partner abans de formalitzar reserva', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    const panel = screen.getByLabelText('Pacte amb partner al lead');
    expect(panel).toHaveAttribute('id', 'lead-repartiment');
    expect(panel).toHaveClass('ap-ledger-budget--repartiment');
    expect(screen.getByText('lead · import curt abans de formalitzar')).toBeInTheDocument();
    expect(screen.getByText('a validar')).toBeInTheDocument();
    expect(panel.textContent).toContain('Masquerade');
    expect(panel.textContent).not.toContain('Òrbita (tu)');
    expect(screen.queryByText('Òrbita (tu)')).not.toBeInTheDocument();
    expect(screen.queryByText('Detall intern de costos i ruta')).not.toBeInTheDocument();
    expect(screen.queryByText('Detall element a element')).not.toBeInTheDocument();
    expect(screen.getAllByText('Bingo Musical').length).toBeGreaterThan(0);
    expect(screen.queryByText('Client paga')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost/liquid.')).not.toBeInTheDocument();
    expect(screen.queryByText('Net Òrbita')).not.toBeInTheDocument();
  });

  it('manté ruta i dieta al pacte sense ensenyar auditoria interna al lead', async () => {
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

    expect(screen.queryByText('Transport client')).not.toBeInTheDocument();
    expect(screen.queryByText('Temps ruta conductor · Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Temps ruta passatger')).not.toBeInTheDocument();
    expect(screen.queryByText('Peatges ruta · Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Dieta desplaçament · Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Dieta desplaçament')).not.toBeInTheDocument();
    expect(screen.queryByText('Què cobra Masquerade')).not.toBeInTheDocument();
    expect(screen.getByText((text) => text.includes('Total ruta') && text.includes('340.22'))).toBeInTheDocument();
    expect(screen.getByText('Vehicle: 96.72')).toBeInTheDocument();
    expect(screen.getByText('Equip ruta: 165')).toBeInTheDocument();
    expect(screen.getByText('Dietes: 60')).toBeInTheDocument();
    expect(screen.getByText('Peatges: 18.5')).toBeInTheDocument();
    expect(screen.getByText('Ruta')).toBeInTheDocument();
    expect(screen.getByText('temps + dieta')).toBeInTheDocument();
    expect(screen.getByText('Compensació a Òrbita')).toBeInTheDocument();
    expect(screen.getByText('tècnic inclòs')).toBeInTheDocument();
    expect(screen.getByText('-40 €')).toBeInTheDocument();
    expect(screen.queryByText('Operari Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost intern Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Benefici net Òrbita')).not.toBeInTheDocument();
  });

  it('no embruta la lectura curta quan hi ha ruta sense peatges informats', async () => {
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

    expect(screen.queryByText('peatges no informats')).not.toBeInTheDocument();
  });

  it('crea el dossier directament des del lead i obre el PDF resultant', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    mockFetchWithCsrf
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, status: 'created', dossierId: 'dos-1' }),
      });

    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear dossier' }));

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/api/admin/dossiers/draft-from-lead',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ leadId: 'lead-1' }),
        }),
      );
    });
    expect(openSpy).toHaveBeenCalledWith('/api/admin/dossiers/dos-1/composite', '_blank', 'noopener,noreferrer');
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });
});
