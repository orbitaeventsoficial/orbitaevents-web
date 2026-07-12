import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
            ? <p>Inclou {routeSummaryItems.map((item) => item.label.toLowerCase().replace('equip ruta', 'equip')).join(', ').replace(/, ([^,]*)$/, ' i $1')}. Detall de liquidació a la reserva.</p>
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

  it('mostra el cost col·laborador abans de formalitzar reserva', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Cost col·laborador')).toBeInTheDocument();
    });

    const panel = screen.getByLabelText('Cost col·laborador al lead');
    expect(panel).toHaveAttribute('id', 'lead-repartiment');
    expect(panel).toHaveClass('ap-ledger-budget--repartiment');
    // Microcopy útil (#1752, Manolo): la nota diu QUÈ és l'import i ON viu el
    // detall complet, no descriu l'estat de la UI.
    expect(screen.getByText('segons tarifa Òrbita · liquidació final a la reserva')).toBeInTheDocument();
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

  it('quan el lead ja és reserva, mostra lectura formalitzada i no editor', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
        formalizedBooking={{ href: '/admin/bookings/booking-1', reference: 'OE-2026-001' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Bolo formalitzat')).toBeInTheDocument();
    });

    expect(screen.getByText('Bolo formalitzat a reserva')).toBeInTheDocument();
    expect(screen.getByText('Bingo Musical (Masquerade)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir reserva OE-2026-001' })).toHaveAttribute('href', '/admin/bookings/booking-1');
    expect(screen.queryByTestId('service-lines')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Desar bolo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Crear dossier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Crear pressupost' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Crear reserva' })).not.toBeInTheDocument();
  });

  it('manté ruta i dieta al cost col·laborador sense ensenyar auditoria interna al lead', async () => {
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
      expect(screen.getByText('Cost col·laborador')).toBeInTheDocument();
    });

    expect(screen.queryByText('Transport client')).not.toBeInTheDocument();
    expect(screen.queryByText('Temps ruta conductor · Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Temps ruta passatger')).not.toBeInTheDocument();
    expect(screen.queryByText('Peatges ruta · Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Dieta desplaçament · Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Dieta desplaçament')).not.toBeInTheDocument();
    expect(screen.queryByText('Què cobra Masquerade')).not.toBeInTheDocument();
    expect(screen.getByText((text) => text.includes('Total ruta') && text.includes('340.22'))).toBeInTheDocument();
    expect(screen.getByText('Inclou vehicle, equip, dietes i peatges. Detall de liquidació a la reserva.')).toBeInTheDocument();
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
    expect(screen.getByRole('link', { name: 'Crear dossier' })).toHaveClass('ap-btn--primary');
    expect(screen.queryByRole('button', { name: 'Validar pacte' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Desfer validació' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear reserva' })).not.toHaveClass('ap-btn--primary');
    expect(screen.queryByText('Operari Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost intern Òrbita')).not.toBeInTheDocument();
    expect(screen.queryByText('Benefici net Òrbita')).not.toBeInTheDocument();
  });

  it('aplica el canvi de cotxe i conductor al cost col·laborador', async () => {
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
      expect(screen.getByText('Cost col·laborador')).toBeInTheDocument();
    });

    expect(screen.getByText('temps 83 € + dieta 30 €')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Qui posa el cotxe'), { target: { value: 'masquerade' } });
    fireEvent.change(screen.getByLabelText('Qui condueix'), { target: { value: 'masquerade' } });

    await waitFor(() => {
      expect(screen.getByText('vehicle 90 € + temps 165 € + dieta 60 €')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Cost col·laborador al lead').textContent).toContain('315');
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
      expect(screen.getByText('Cost col·laborador')).toBeInTheDocument();
    });

    expect(screen.queryByText('peatges no informats')).not.toBeInTheDocument();
  });

  it('no aplica cap recàrrec automàtic per temporada a la base neta del bolo', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Juliol', eventLocation: 'Cornellà', eventDate: '2026-07-17' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Cost col·laborador')).toBeInTheDocument();
    });

    const budget = screen.getByLabelText('Resum net del bolo');
    expect(budget.textContent).toContain('Serveis');
    expect(budget.textContent).toContain('240');
    expect(budget.textContent).not.toContain('Recàrrec');
    expect(budget.textContent).not.toContain('temporada');
    expect(budget.textContent).not.toContain('+15%');
    expect(budget.textContent).toContain('Base neta');
    expect(budget.textContent).toContain('abans d\'IVA');
    expect(budget.textContent).not.toContain('Total client');
    expect(budget.textContent).toContain('240');
  });

  it('obre accions solidàries amb el generador de dossiers des del lead', async () => {
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
            costAmount: 160,
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
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Cost col·laborador')).toBeInTheDocument();
    });

    const dossierLink = screen.getByRole('link', { name: 'Crear dossier' });
    const dossierPreviewLink = screen.getByRole('link', { name: 'Previsualitzar dossier' });
    expect(dossierLink).toHaveAttribute('href', '/admin/dossiers?leadId=lead-1');
    expect(dossierPreviewLink).toHaveAttribute('href', '/api/admin/leads/lead-1/dossier-preview');
    dossierLink.addEventListener('click', (event) => event.preventDefault(), { once: true });
    dossierPreviewLink.addEventListener('click', (event) => event.preventDefault(), { once: true });
    fireEvent.click(dossierLink);
    fireEvent.click(dossierPreviewLink);

    expect(mockFetchWithCsrf).not.toHaveBeenCalledWith(
      '/api/admin/dossiers',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('manté el cost col·laborador com a lectura i no com a validació persistent (#1755)', async () => {
    render(
      <LeadBoloSection
        leadId="lead-1"
        documentContext={{ name: 'Lead Andorra', eventLocation: 'Andorra' }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Cost col·laborador')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Validar pacte' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Desfer validació' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear dossier' })).toHaveClass('ap-btn--primary');
    expect(screen.getByText('Dossier primer; pressupost i reserva quan el bolo està clar.')).toBeInTheDocument();
    expect(screen.getAllByText('tarifa Òrbita').length).toBeGreaterThan(0);
  });
});
