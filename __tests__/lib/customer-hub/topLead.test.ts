import { describe, expect, it } from 'vitest';

import { getTopCustomerHubLead, sortCustomerHubLeads } from '@/lib/customer-hub/topLead';
import type { LeadDTO } from '@/lib/customer-hub/dto';

function makeLead(overrides: Partial<LeadDTO> = {}): LeadDTO {
  return {
    id: 'lead-1',
    name: 'Anna',
    email: 'anna@example.com',
    phone: null,
    eventType: 'BODA',
    status: 'QUOTE_SENT',
    priority: 'MEDIUM',
    createdAt: '2026-04-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('topLead helpers', () => {
  it('prioritza primer la prioritat i després l’estat', () => {
    const leads = sortCustomerHubLeads([
      makeLead({ id: 'lead-low', name: 'Baixa', priority: 'LOW', status: 'NEW' }),
      makeLead({ id: 'lead-high', name: 'Alta', priority: 'HIGH', status: 'QUOTE_SENT' }),
      makeLead({ id: 'lead-urgent', name: 'Urgent', priority: 'URGENT', status: 'NEGOTIATING' }),
    ]);

    expect(leads.map((lead) => lead.id)).toEqual(['lead-urgent', 'lead-high', 'lead-low']);
  });

  it('dins la mateixa prioritat prioritza l’estat més inicial', () => {
    const lead = getTopCustomerHubLead([
      makeLead({ id: 'lead-quote', status: 'QUOTE_SENT', priority: 'HIGH' }),
      makeLead({ id: 'lead-new', status: 'NEW', priority: 'HIGH' }),
    ]);

    expect(lead?.id).toBe('lead-new');
  });
});
