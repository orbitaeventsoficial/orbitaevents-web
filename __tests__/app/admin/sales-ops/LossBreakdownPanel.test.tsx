import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LossBreakdownPanel from '@/app/admin/sales-ops/LossBreakdownPanel';
import type { LossSummary } from '@/lib/services/leadLossAnalyticsService';

function makeSummary(overrides: Partial<LossSummary> = {}): LossSummary {
  return {
    total: 6,
    uncategorized: 1,
    autoTotal: 1,
    commercialTotal: 4,
    byReason: [
      { key: 'PRICE_TOO_HIGH', label: 'Preu massa alt', count: 3, share: 50 },
      { key: 'NO_RESPONSE', label: 'Sense resposta', count: 1, share: 16.7 },
      { key: 'EVENT_PASSED', label: "Data d'esdeveniment passada sense conversió", count: 1, share: 16.7 },
    ],
    byEventType: [
      { key: 'WEDDING', label: 'Wedding', count: 4, share: 66.7 },
      { key: 'BIRTHDAY', label: 'Birthday', count: 2, share: 33.3 },
    ],
    bySource: [
      { key: 'WEBSITE', label: 'Website', count: 4, share: 66.7 },
      { key: 'INSTAGRAM', label: 'Instagram', count: 2, share: 33.3 },
    ],
    byMonth: [
      { monthIso: '2026-02', count: 1 },
      { monthIso: '2026-03', count: 2 },
      { monthIso: '2026-04', count: 3 },
    ],
    topReason: { reason: 'PRICE_TOO_HIGH', label: 'Preu massa alt', count: 3, share: 50 },
    ...overrides,
  };
}

describe('LossBreakdownPanel', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, sinceDays: 90, summary: makeSummary() }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renderitza el resum inicial i crida l’endpoint de pèrdues', async () => {
    render(<LossBreakdownPanel initialSummary={makeSummary()} days={90} />);

    expect(screen.getByText('Per què es refreda l\'embut')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getAllByText('Preu massa alt').length).toBeGreaterThan(0);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reports/lead-losses?days=90',
        expect.objectContaining({ credentials: 'include', cache: 'no-store' })
      )
    );

    const lostCard = screen.getByText('Leads perduts').closest('div');
    expect(lostCard).not.toBeNull();
    expect(within(lostCard as HTMLElement).getByText('6')).toBeInTheDocument();
  });

  it('actualitza la UI quan l’endpoint retorna una lectura més nova', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ok: true,
          sinceDays: 90,
          summary: makeSummary({
            total: 8,
            commercialTotal: 6,
            topReason: { reason: 'NO_RESPONSE', label: 'Sense resposta', count: 4, share: 50 },
            byReason: [
              { key: 'NO_RESPONSE', label: 'Sense resposta', count: 4, share: 50 },
              { key: 'PRICE_TOO_HIGH', label: 'Preu massa alt', count: 2, share: 25 },
            ],
            bySource: [{ key: 'REFERRAL', label: 'Referral', count: 5, share: 62.5 }],
          }),
        }),
      })
    );

    render(<LossBreakdownPanel initialSummary={makeSummary()} days={90} />);

    await waitFor(() => expect(screen.getAllByText('Sense resposta').length).toBeGreaterThan(0));
    expect(screen.getByText('Referral')).toBeInTheDocument();

    const lostCard = screen.getByText('Leads perduts').closest('div');
    expect(lostCard).not.toBeNull();
    expect(within(lostCard as HTMLElement).getByText('8')).toBeInTheDocument();
  });

  it('mostra fallback quan no hi ha pèrdues classificades', async () => {
    render(
      <LossBreakdownPanel
        initialSummary={makeSummary({
          total: 0,
          uncategorized: 0,
          autoTotal: 0,
          commercialTotal: 0,
          byReason: [],
          byEventType: [],
          bySource: [],
          byMonth: [],
          topReason: null,
        })}
        days={30}
      />
    );

    expect(screen.getByText('Sense patró comercial clar')).toBeInTheDocument();
    expect(screen.getByText('Encara no hi ha pèrdues classificades dins la finestra seleccionada.')).toBeInTheDocument();
    expect(screen.getByText('Sense fonts de pèrdua registrades encara.')).toBeInTheDocument();
    expect(screen.getByText('Encara no hi ha prou historial per dibuixar tendència.')).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });
});
