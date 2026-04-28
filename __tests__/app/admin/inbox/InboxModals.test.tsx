import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComposeModal, QuoteModal } from '@/app/admin/inbox/InboxModals';
import type { UnifiedEmail } from '@/app/admin/inbox/inbox-types';
import { fetchWithCsrf } from '@/lib/csrf';

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
  },
}));

const mockFetchWithCsrf = vi.mocked(fetchWithCsrf);

function makeLeadEmail(overrides: Partial<UnifiedEmail> = {}): UnifiedEmail {
  return {
    id: 'lead-1',
    type: 'lead',
    from: 'maria@example.com',
    fromName: 'Maria',
    subject: 'Consulta boda',
    preview: 'Hola',
    date: new Date('2026-04-25T10:00:00.000Z'),
    read: false,
    leadData: {
      id: 'lead-1',
      customerId: 'cust-7',
      name: 'Maria',
      email: 'maria@example.com',
      phone: '600123123',
      message: 'Hola',
      eventType: 'BODA',
      status: 'NEW',
      preferredLocale: 'ca',
      interestedPackId: null,
      interestedExtras: [],
      budget: null,
      guestCount: 100,
      eventDate: new Date('2026-08-20T18:00:00.000Z'),
      eventLocation: 'Sitges',
      createdAt: new Date('2026-04-25T08:00:00.000Z'),
      updatedAt: new Date('2026-04-25T09:00:00.000Z'),
      source: 'web',
    },
    ...overrides,
  };
}

describe('InboxModals', () => {
  beforeEach(() => {
    mockFetchWithCsrf.mockReset();
  });

  it('ComposeModal envia leadId i customerId quan respon a un lead vinculat', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    render(
      <ComposeModal
        replyTo={makeLeadEmail()}
        packOptions={[{ id: 'pack-premium', label: 'Premium', price: 1500 }]}
        onClose={() => {}}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Escriu el teu missatge...'), {
      target: { value: 'Resposta comercial' },
    });
    fireEvent.click(screen.getByRole('button', { name: '📤 Envia' }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));

    const [, request] = mockFetchWithCsrf.mock.calls[0];
    expect(request).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(request?.body))).toMatchObject({
      to: 'maria@example.com',
      subject: 'Re: Consulta boda',
      body: 'Resposta comercial',
      leadId: 'lead-1',
      replyToId: 'lead-1',
      customerId: 'cust-7',
      locale: 'ca',
    });
  });

  it('QuoteModal envia customerId junt amb el lead vinculat', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, quoteNumber: 'Q-1' }),
    } as Response);

    render(
      <QuoteModal
        target={makeLeadEmail()}
        packOptions={[{ id: 'pack-premium', label: 'Premium', price: 1500 }]}
        onClose={() => {}}
        onSent={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Envia pressupost' }));

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledTimes(1));

    const [, request] = mockFetchWithCsrf.mock.calls[0];
    expect(request).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(request?.body))).toMatchObject({
      leadId: 'lead-1',
      customerId: 'cust-7',
      to: 'maria@example.com',
      packId: 'pack-premium',
      price: 1500,
      customMessage: '',
    });
  });
});
