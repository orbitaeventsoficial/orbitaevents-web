import { describe, expect, it } from 'vitest';
import {
  rankProposalDraftSuggestions,
  type ProposalDraftInput,
} from '@/lib/services/proposalDraftSuggestionService';

const NOW = new Date('2026-07-09T10:00:00Z');

function proposal(overrides: Partial<ProposalDraftInput> & { id: string; reference?: string }): ProposalDraftInput {
  return {
    id: overrides.id,
    reference: overrides.reference ?? `PROP-${overrides.id}`,
    customerId: Object.prototype.hasOwnProperty.call(overrides, 'customerId') ? overrides.customerId ?? null : 'cust-1',
    leadId: overrides.leadId ?? null,
    bookingId: overrides.bookingId ?? null,
    status: overrides.status ?? 'DRAFT',
    total: overrides.total ?? 600,
    createdAt: overrides.createdAt ?? new Date('2026-07-01T10:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-07-08T10:00:00Z'),
    sentAt: overrides.sentAt ?? null,
    customer: overrides.customer ?? { name: 'Anna' },
    lead: overrides.lead ?? null,
    booking: overrides.booking ?? null,
  };
}

describe('rankProposalDraftSuggestions', () => {
  it('exclou pressupostos que no son DRAFT, sense client, enviats o amb bolo passat', () => {
    const suggestions = rankProposalDraftSuggestions([
      proposal({ id: 'sent-status', status: 'SENT' }),
      proposal({ id: 'no-customer', customerId: null }),
      proposal({ id: 'already-sent', sentAt: new Date('2026-07-08T10:00:00Z') }),
      proposal({ id: 'past-event', leadId: 'lead-1', lead: { name: 'Past', eventDate: new Date('2026-07-01T20:00:00Z') } }),
      proposal({ id: 'candidate' }),
    ], 10, NOW);

    expect(suggestions.map((item) => item.proposalId)).toEqual(['candidate']);
  });

  it('obre l Studio canonic amb customerId i proposalId', () => {
    const [suggestion] = rankProposalDraftSuggestions([
      proposal({
        id: 'draft',
        reference: 'PROP-2026-0027',
        leadId: 'lead-1',
        lead: { name: 'Cristina', eventDate: new Date('2026-07-17T20:30:00Z') },
        total: 302.5,
      }),
    ], 1, NOW);

    expect(suggestion).toMatchObject({
      proposalId: 'draft',
      reference: 'PROP-2026-0027',
      customerId: 'cust-1',
      name: 'Anna',
      band: 'ALTA',
      href: '/admin/presupuestos?customerId=cust-1&proposalId=draft',
      daysUntilEvent: 8,
    });
    expect(suggestion.reasons).toContain('Pressupost en esborrany');
    expect(suggestion.reasons).toContain('Data propera');
    expect(suggestion.reasons).toContain('Bolo vinculat');
  });

  it('prioritza data propera per sobre dun draft antic sense bolo', () => {
    const suggestions = rankProposalDraftSuggestions([
      proposal({
        id: 'old',
        reference: 'PROP-OLD',
        updatedAt: new Date('2026-06-20T10:00:00Z'),
        total: 1200,
      }),
      proposal({
        id: 'soon',
        reference: 'PROP-SOON',
        leadId: 'lead-2',
        lead: { name: 'Laia', eventDate: new Date('2026-07-12T20:00:00Z') },
        updatedAt: new Date('2026-07-09T08:00:00Z'),
        total: 300,
      }),
    ], 2, NOW);

    expect(suggestions.map((item) => item.proposalId)).toEqual(['soon', 'old']);
    expect(suggestions[0]).toMatchObject({ band: 'ALTA', daysUntilEvent: 3 });
    expect(suggestions[0].reasons).toContain('Actualitzat avui');
  });
});
