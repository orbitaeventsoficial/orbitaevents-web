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
    routeSummaryDensity = 'items',
    controlsAlwaysVisible = false,
    travelCollaborators = [],
    vehicleOwnerId = '',
    onVehicleOwnerChange,
    driverId = '',
    onDriverChange,
  }: {
    calculationNotes?: string[];
    routeSummaryItems?: Array<{ label: string; amount: number }>;
    compactRouteSummary?: boolean;
    effectiveTravelCost?: number;
    routeSummaryDensity?: 'items' | 'sentence';
    controlsAlwaysVisible?: boolean;
    travelCollaborators?: Array<{ id: string; name: string }>;
    vehicleOwnerId?: string;
    onVehicleOwnerChange?: (value: string) => void;
    driverId?: string;
    onDriverChange?: (value: string) => void;
  }) => (
    <div data-testid="trip-card" data-controls-always-visible={controlsAlwaysVisible ? 'true' : 'false'}>
      {travelCollaborators.length > 0 && (
        <div>
          <select aria-label="Qui posa el cotxe" value={vehicleOwnerId} onChange={(event) => onVehicleOwnerChange?.(event.target.value)}>
            <option value="">Òrbita</option>
            {travelCollaborators.map((collaborator) => (
              <option key={collaborator.id} value={collaborator.id}>{collaborator.name}</option>
            ))}
          </select>
          <select aria-label="Qui condueix" value={driverId} onChange={(event) => onDriverChange?.(event.target.value)}>
            <option value="">Òrbita</option>
            {travelCollaborators.map((collaborator) => (
              <option key={collaborator.id} value={collaborator.id}>{collaborator.name}</option>
            ))}
          </select>
        </div>
      )}
      {compactRouteSummary ? (
        <>
          <p>Total ruta {effectiveTravelCost}</p>
          {routeSummaryDensity === 'sentence'
            ? <p>Inclou {routeSummaryItems.map((item) => item.label.toLowerCase()).join(', ')}.</p>
            : routeSummaryItems.map((item) => <p key={item.label}>{item.label}: {item.amount}</p>)}
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
    // Microcopy útil (#1752, Manolo): la nota diu QUÈ és l'import i ON viu el
    // detall complet, no descriu l'estat de la UI.
    expect(screen.getByText('import a validar amb el partner · la liquidació completa viu a la reserva')).toBeInTheDocument();
    expect(panel.textContent).toContain('Masquerade');
    const partnerDetails = panel.querySelector('.ap-rep-partner-card') as HTMLDetailsElement | null;
    expect(partnerDetails?.tagName).toBe('DETAILS');
    expect(partnerDetails?.open).toBe(true);
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
    expect(screen.getByText('Inclou vehicle, equip ruta, dietes, peatges.')).toBeInTheDocument();
    expect(screen.queryByText('Vehicle: 96.72')).not.toBeInTheDocument();
    expect(screen.queryByText('Equip ruta: 165')).not.toBeInTheDocument();
    expect(screen.queryByText('Dietes: 60')).not.toBeInTheDocument();
    expect(screen.queryByText('Peatges: 18.5')).not.toBeInTheDocument();
    expect(screen.getByText('Ruta')).toBeInTheDocument();
    expect(screen.getByText('temps 83 € + dieta 30 €')).toBeInTheDocument();
    expect(screen.getByTestId('trip-card')).toHaveAttribute('data-controls-always-visible', 'true');
    expect(screen.getByText('Compensació a Òrbita')).toBeInTheDocument();
    expect(screen.getByText('tècnic inclòs')).toBeInTheDocument();
    expect(screen.getByText('-40 €')).toBeInTheDocument();
    expect(screen.getByText('Següent pas')).toBeInTheDocument();
    // Amb partner PENDENT de validar (#1753), el dossier encara no és el pas primari.
    expect(screen.getByRole('button', { name: 'Crear dossier' })).not.toHaveClass('ap-btn--primary');
    expect(screen.getByRole('button', { name: 'Validar pacte' })).toHaveClass('ap-btn--primary');
    expect(screen.getByRole('link', { name: 'Crear reserva' })).not.toHaveClass('ap-btn--primary');
    expect(screen.queryByText('Operari Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost intern Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Benefici net Òrbita')).not.toBeInTheDocument();
  });

  it('aplica el canvi de cotxe i conductor al pacte del partner', async () => {
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
        initialDistanceKm={411.4}
        vehicleCostPerKm={0.25}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    expect(screen.getByText('temps 83 € + dieta 30 €')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Qui posa el cotxe'), { target: { value: 'masquerade' } });
    fireEvent.change(screen.getByLabelText('Qui condueix'), { target: { value: 'masquerade' } });

    await waitFor(() => {
      expect(screen.getByText('vehicle 90 € + temps 165 € + dieta 60 €')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Pacte amb partner al lead').textContent).toContain('315');
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
        '/api/admin/dossiers',
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

  it('valida el pacte amb UNA acció i encén el dossier com a pas primari (#1753)', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    // Pendent: la validació és el pas manat; el dossier encara no és primari.
    expect(screen.getByText('Valida el pacte amb el partner; el dossier és el pas següent.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear dossier' })).not.toHaveClass('ap-btn--primary');

    fireEvent.click(screen.getByRole('button', { name: 'Validar pacte' }));

    await waitFor(() => {
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/api/admin/leads/lead-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ partnerPactValidated: true }),
        }),
      );
    });

    // Validat: acció única resolta, dossier primari i estat visible al bloc.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Desfer validació' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Validar pacte' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear dossier' })).toHaveClass('ap-btn--primary');
    expect(screen.getByText('Dossier primer; pressupost i reserva quan el pacte ja està clar.')).toBeInTheDocument();
    expect(screen.getByText((text) => text.startsWith('validat el '))).toBeInTheDocument();
  });

  it('arrenca en estat validat quan el lead ja porta la validació persistida (#1753)', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
        initialPartnerPactValidatedAt="2026-07-08T12:00:00.000Z"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Pacte amb partner')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Desfer validació' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Validar pacte' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear dossier' })).toHaveClass('ap-btn--primary');
    // La fila del partner no contradiu el head: amb pacte validat diu «import validat».
    expect(screen.getByText('import validat')).toBeInTheDocument();
    expect(screen.queryByText('import a validar')).not.toBeInTheDocument();
  });
});
