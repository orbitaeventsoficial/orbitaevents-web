import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AvailabilityCalendar } from '../../../components/calendar/AvailabilityCalendar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      previousMonth: 'Mes anterior',
      nextMonth: 'Mes següent',
      loading: 'Carregant...',
      error: 'Error al carregar disponibilitat',
      'legend.available': 'Disponible',
      'legend.booked': 'Reservat',
      'legend.blocked': 'Bloquejat',
      'legend.noData': 'Sense dades',
    };
    return dict[key] ?? key;
  },
}));

vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));

describe('AvailabilityCalendar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('demana disponibilitat amb from/to del mes local complet', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          dates: [{ date: '2026-07-01', status: 'AVAILABLE' }],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AvailabilityCalendar initialMonth="2026-07" locale="ca" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/availability?from=2026-07-01&to=2026-07-31');
    });
  });

  it('no mostra el literal cru del backend quan falla la disponibilitat', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to load availability',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AvailabilityCalendar initialMonth="2026-07" locale="ca" />);

    expect(await screen.findByText('Error al carregar disponibilitat')).toBeInTheDocument();
    expect(screen.queryByText(/Failed to load availability/i)).not.toBeInTheDocument();
  });
});
