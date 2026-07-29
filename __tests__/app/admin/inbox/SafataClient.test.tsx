import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SafataClient, { type SafataLead, type SafataStats } from '@/app/admin/inbox/SafataClient';
import { fetchWithCsrf } from '@/lib/csrf';

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

const lead: SafataLead = {
  id: 'lead-1',
  customerId: null,
  name: 'Lead Primera',
  email: 'primera@example.com',
  phone: '+34 600 111 111',
  message: 'Missatge del lead',
  eventType: 'Boda',
  status: 'CONTACTED',
  createdAt: '2026-07-07T08:00:00.000Z',
  updatedAt: '2026-07-07T08:30:00.000Z',
  preferredLocale: 'ca',
  interestedPackId: null,
  interestedExtras: [],
  budget: '900',
  guestCount: 80,
  eventDate: '2026-09-20T00:00:00.000Z',
  eventStartTime: '18:00',
  eventEndTime: '22:00',
  eventLocation: 'Girona',
  source: 'WEB',
};

const stats: SafataStats = {
  totalLeads: 1,
  unreadLeads: 0,
  todayLeads: 1,
};

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe('SafataClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('mostra error si marcar el lead com no llegit falla', async () => {
    vi.mocked(fetchWithCsrf).mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'No autoritzat' }),
    } as unknown as Response);

    render(<SafataClient leads={[lead]} stats={stats} emailSends={[]} imapConfigured={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Lead Primera/ }));
    const toggle = await screen.findByRole('button', { name: '● Llegit' });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No autoritzat');
    });

    expect(toggle).toHaveAttribute('aria-invalid', 'true');
    expect(fetchWithCsrf).toHaveBeenCalledWith(
      '/api/admin/leads/lead-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'NEW' }),
      })
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('avisa si el marcatge automatic del lead nou falla en seleccionar-lo', async () => {
    vi.mocked(fetchWithCsrf).mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Permís insuficient' }),
    } as unknown as Response);
    const newLead = { ...lead, status: 'NEW' };

    render(<SafataClient leads={[newLead]} stats={{ ...stats, unreadLeads: 1 }} emailSends={[]} imapConfigured={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Lead Primera/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Permís insuficient');
    });

    expect(screen.getByRole('button', { name: '○ No llegit' })).toBeInTheDocument();
    expect(fetchWithCsrf).toHaveBeenCalledWith(
      '/api/admin/leads/lead-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONTACTED' }),
      })
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("avisa si l'auto-refresh de leads falla", async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Refresh aturat' }),
    }));

    render(<SafataClient leads={[lead]} stats={stats} emailSends={[]} imapConfigured={false} />);

    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Refresh aturat');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/inbox/refresh-leads',
      { headers: { 'x-admin': '1' } }
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
