import { describe, expect, it } from 'vitest';

import { buildLeadContinuity } from '@/lib/customer-hub/leadContinuity';
import type { LeadDTO } from '@/lib/customer-hub/dto';

function makeLead(overrides: Partial<LeadDTO> = {}): LeadDTO {
  return {
    id: 'lead-1',
    customerId: null,
    name: 'Anna',
    email: 'anna@example.com',
    phone: '+34 600 11 22 33',
    eventType: 'BODA',
    status: 'QUOTE_SENT',
    priority: 'HIGH',
    createdAt: '2026-04-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('buildLeadContinuity', () => {
  it('manté el clic principal dins del Customer Hub encara que la lead no porti customerId', () => {
    expect(buildLeadContinuity(makeLead(), 'cust-1')).toEqual({
      hubHref: '/admin/clientes/cust-1?tab=leads',
      technicalHref: '/admin/leads/lead-1',
      stageLabel: 'Pressupost enviat',
      narrative: 'Lead -> negociació -> reserva -> client recurrent',
    });
  });

  it('prioritza el customerId propi de la lead si existeix', () => {
    expect(buildLeadContinuity(makeLead({ customerId: 'cust-2' }), 'cust-1').hubHref).toBe(
      '/admin/clientes/cust-2?tab=leads'
    );
  });

  it('mostra reserva vinculada per damunt de l’estat comercial', () => {
    expect(
      buildLeadContinuity(
        makeLead({
          status: 'WON',
          booking: {
            id: 'book-1',
            reference: 'OE-1',
            status: 'CONFIRMED',
            total: 1200,
          },
        }),
        'cust-1'
      ).stageLabel
    ).toBe('Reserva vinculada');
  });
});
