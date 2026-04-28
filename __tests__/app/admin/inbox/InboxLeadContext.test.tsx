import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InboxLeadContext from '@/app/admin/inbox/InboxLeadContext';
import type { LeadData } from '@/app/admin/inbox/inbox-types';

function makeLead(overrides: Partial<LeadData> = {}): LeadData {
  return {
    id: 'lead-1',
    customerId: null,
    name: 'Maria Serra',
    email: 'maria@example.com',
    phone: '600123123',
    message: 'Hola',
    eventType: 'BODA',
    status: 'NEW',
    preferredLocale: 'ca',
    interestedPackId: null,
    interestedExtras: [],
    budget: null,
    guestCount: 120,
    eventDate: new Date('2026-08-20T18:00:00.000Z'),
    eventLocation: 'Sitges',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
    source: 'web',
    ...overrides,
  };
}

describe('InboxLeadContext', () => {
  it('mostra sempre l enllac cap al workspace del lead', () => {
    render(<InboxLeadContext lead={makeLead()} />);

    const leadLink = screen.getByRole('link', { name: 'Obrir lead complet' });
    expect(leadLink).toHaveAttribute('href', '/admin/leads/lead-1');
    expect(screen.queryByRole('link', { name: 'Obrir Customer Hub' })).not.toBeInTheDocument();
  });

  it('afegeix l enllac al Customer Hub quan el lead ja esta vinculat a client', () => {
    render(<InboxLeadContext lead={makeLead({ customerId: 'cust-9' })} />);

    expect(screen.getByRole('link', { name: 'Obrir Customer Hub' })).toHaveAttribute(
      'href',
      '/admin/clientes/cust-9?tab=comms'
    );
  });
});
