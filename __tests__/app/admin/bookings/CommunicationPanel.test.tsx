import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf, mockRefresh } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
vi.mock('@/lib/csrf', () => ({ fetchWithCsrf: (...args: unknown[]) => mockFetchWithCsrf(...args) }));

import CommunicationPanel from '@/app/admin/bookings/[id]/CommunicationPanel';

const INITIAL_STATUSES = {
  PAYMENT: { state: 'FALTA_ENVIAR', sentAt: null, respondedAt: null, lastChannel: null },
  POST_EVENT: { state: 'ENVIADO', sentAt: '2026-07-01T10:00:00.000Z', respondedAt: null, lastChannel: 'email' },
  GENERAL: { state: 'RESPONDIDO', sentAt: '2026-07-01T10:00:00.000Z', respondedAt: '2026-07-01T10:30:00.000Z', lastChannel: 'whatsapp' },
} as const;

describe('CommunicationPanel', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithCsrf.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('executa comunicacio i refresca si la resposta es OK', async () => {
    render(
      <CommunicationPanel
        bookingId="book-1"
        clientName="Maria"
        clientPhone="600111222"
        initialStatuses={INITIAL_STATUSES}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Correu' })[0]);

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));
    const [url, opts] = mockFetchWithCsrf.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/admin/bookings/book-1/communications');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(String(opts.body))).toEqual({
      action: 'send_email',
      flow: 'PAYMENT',
    });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it('mostra error i no refresca si comunicacions falla', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'SMTP no disponible' }),
    });
    render(
      <CommunicationPanel
        bookingId="book-2"
        clientName="Maria"
        clientPhone="600111222"
        initialStatuses={INITIAL_STATUSES}
      />,
    );

    const emailButtons = screen.getAllByRole('button', { name: 'Correu' });
    fireEvent.click(emailButtons[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('SMTP no disponible');
    expect(emailButtons[0]).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('button', { name: 'Envia per API de WhatsApp' })[0]).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getAllByRole('button', { name: 'Marcar enviat' })[0]).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('button', { name: 'Marcar respost' })[0]).toHaveAttribute('aria-invalid', 'true');
    expect(emailButtons[1]).not.toHaveAttribute('aria-invalid');
    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CommunicationPanel] Error executant comunicació de reserva',
        expect.objectContaining({
          bookingId: 'book-2',
          flow: 'PAYMENT',
          action: 'send_email',
          error: expect.any(Error),
        }),
      ),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
