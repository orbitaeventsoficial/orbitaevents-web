import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnsurePortfolioEventButton } from '@/app/admin/post-event/reports/EnsurePortfolioEventButton';
import { fetchWithCsrf } from '@/lib/csrf';

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

function jsonResponse(payload: unknown, ok: boolean): Response {
  return {
    ok,
    json: async () => payload,
  } as Response;
}

describe('EnsurePortfolioEventButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra enllaç si el portfolio ja existeix', () => {
    render(
      <EnsurePortfolioEventButton
        bookingId="booking-1"
        existingEvent={{ id: 'evt-1', title: 'Anna Garcia', adminHref: '/admin/portfolio#events' }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Obrir portfolio' })).toHaveAttribute('href', '/admin/portfolio#events');
    expect(screen.getByText('Anna Garcia')).toBeInTheDocument();
    expect(fetchWithCsrf).not.toHaveBeenCalled();
  });

  it('crea portfolio i mostra enllaç operatiu', async () => {
    vi.mocked(fetchWithCsrf).mockResolvedValueOnce(jsonResponse({
      ok: true,
      event: { title: 'Anna Garcia', adminHref: '/admin/portfolio#events' },
    }, true));

    render(<EnsurePortfolioEventButton bookingId="booking-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Crear portfolio' }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Obrir portfolio' })).toHaveAttribute('href', '/admin/portfolio#events');
    });
    expect(fetchWithCsrf).toHaveBeenCalledWith('/api/admin/post-event/portfolio-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: 'booking-1' }),
    });
  });

  it('mostra error funcional si falta media de portfolio', async () => {
    vi.mocked(fetchWithCsrf).mockResolvedValueOnce(jsonResponse({
      ok: false,
      message: 'Marca una foto de la galeria com a portfolio i assigna categoria',
    }, false));

    render(<EnsurePortfolioEventButton bookingId="booking-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Crear portfolio' }));

    await screen.findByText('Marca una foto de la galeria com a portfolio i assigna categoria');
    expect(screen.getByRole('button', { name: 'Crear portfolio' })).toBeEnabled();
  });
});
