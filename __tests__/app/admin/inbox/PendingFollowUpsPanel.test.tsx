import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PendingFollowUpsPanel from '@/app/admin/inbox/PendingFollowUpsPanel';

const fetchMock = vi.fn();

Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true,
});

function makeSummary(customerId: string | null) {
  return {
    generatedAt: '2026-04-25T10:00:00.000Z',
    total: 1,
    urgent: 0,
    normal: 1,
    low: 0,
    items: [
      {
        leadId: 'lead-1',
        customerId,
        name: 'Maria Garcia',
        email: 'maria@example.com',
        phone: '+34600123123',
        eventType: 'WEDDING',
        status: 'CONTACTED',
        preferredLocale: 'ca',
        contactedAt: new Date('2026-04-20T10:00:00.000Z'),
        lastOutboundAt: new Date('2026-04-22T10:00:00.000Z'),
        daysSinceOutbound: 3,
        outboundCount: 1,
        hasInboundAfterOutbound: false,
        urgency: 'NORMAL' as const,
        suggestedAction: 'Enviar recordatori amable per email',
      },
    ],
  };
}

describe('PendingFollowUpsPanel', () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it('manté els enllaços de lead quan no hi ha customerId', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeSummary(null),
    });

    render(<PendingFollowUpsPanel />);

    const nameLink = await screen.findByRole('link', { name: 'Maria Garcia' });

    await waitFor(() => {
      expect(nameLink).toHaveAttribute('href', '/admin/leads/lead-1');
      expect(screen.getByRole('link', { name: '✉️ Email' })).toHaveAttribute(
        'href',
        '/admin/inbox/compose?leadId=lead-1&template=seguiment'
      );
      expect(screen.getByRole('link', { name: 'Obrir' })).toHaveAttribute(
        'href',
        '/admin/leads/lead-1'
      );
    });
  });

  it('redirigeix cap a Customer Hub quan el lead ja té customerId', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => makeSummary('cust-1'),
    });

    render(<PendingFollowUpsPanel />);

    const nameLink = await screen.findByRole('link', { name: 'Maria Garcia' });

    await waitFor(() => {
      expect(nameLink).toHaveAttribute('href', '/admin/clientes/cust-1?tab=comms');
      expect(screen.getByRole('link', { name: '✉️ Email' })).toHaveAttribute(
        'href',
        '/admin/inbox/compose?customerId=cust-1&template=seguiment'
      );
      expect(screen.getByRole('link', { name: 'Obrir' })).toHaveAttribute(
        'href',
        '/admin/clientes/cust-1?tab=comms'
      );
    });
  });
});
