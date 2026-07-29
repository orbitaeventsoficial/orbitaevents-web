import { describe, expect, it } from 'vitest';
import {
  rankContractWorkflowSuggestions,
  type ContractWorkflowProposalInput,
} from '@/lib/services/contractWorkflowSuggestionService';

const NOW = new Date('2026-07-09T10:00:00Z');

function proposal(overrides: Partial<ContractWorkflowProposalInput> & { id: string; reference?: string }): ContractWorkflowProposalInput {
  return {
    id: overrides.id,
    reference: overrides.reference ?? `PROP-${overrides.id}`,
    customerId: Object.prototype.hasOwnProperty.call(overrides, 'customerId') ? overrides.customerId ?? null : 'cust-1',
    bookingId: Object.prototype.hasOwnProperty.call(overrides, 'bookingId') ? overrides.bookingId ?? null : 'book-1',
    status: overrides.status ?? 'ACCEPTED',
    total: overrides.total ?? 1200,
    acceptedAt: overrides.acceptedAt ?? new Date('2026-07-07T10:00:00Z'),
    createdAt: overrides.createdAt ?? new Date('2026-07-01T10:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-07-08T10:00:00Z'),
    contractReference: overrides.contractReference ?? null,
    contractStatus: overrides.contractStatus ?? null,
    contractSentAt: overrides.contractSentAt ?? null,
    contractSignedAt: overrides.contractSignedAt ?? null,
    customer: overrides.customer ?? { name: 'Anna' },
    booking: overrides.booking ?? { eventDate: new Date('2026-07-20T20:00:00Z'), clientName: 'Anna' },
  };
}

describe('rankContractWorkflowSuggestions', () => {
  it('exclou propostes no acceptades, sense client o ja tancades', () => {
    const suggestions = rankContractWorkflowSuggestions([
      proposal({ id: 'draft', status: 'DRAFT' }),
      proposal({ id: 'no-customer', customerId: null }),
      proposal({ id: 'no-booking', bookingId: null }),
      proposal({ id: 'signed', contractStatus: 'SIGNED', contractReference: 'CTR-1', contractSignedAt: NOW }),
      proposal({ id: 'cancelled', contractStatus: 'CANCELLED', contractReference: 'CTR-2' }),
      proposal({ id: 'candidate' }),
    ], 10, NOW);

    expect(suggestions.map((item) => item.proposalId)).toEqual(['candidate']);
  });

  it('marca com a generar un contracte acceptat sense referència', () => {
    const [suggestion] = rankContractWorkflowSuggestions([
      proposal({
        id: 'accepted',
        contractStatus: 'DRAFT',
        contractReference: null,
        acceptedAt: new Date('2026-07-06T10:00:00Z'),
      }),
    ], 1, NOW);

    expect(suggestion).toMatchObject({
      proposalId: 'accepted',
      action: 'GENERATE_CONTRACT',
      href: '/admin/clientes/cust-1?tab=proposals',
      contractStatus: 'DRAFT',
      contractReference: null,
    });
    expect(suggestion.reasons).toContain('DRAFT sense referència');
  });

  it('distingeix enviar contracte de seguir signatura', () => {
    const suggestions = rankContractWorkflowSuggestions([
      proposal({
        id: 'send',
        contractStatus: 'DRAFT',
        contractReference: 'CTR-2026-0001',
        acceptedAt: new Date('2026-07-08T10:00:00Z'),
      }),
      proposal({
        id: 'follow',
        contractStatus: 'SENT',
        contractReference: 'CTR-2026-0002',
        contractSentAt: new Date('2026-07-01T10:00:00Z'),
        booking: { eventDate: new Date('2026-08-30T20:00:00Z') },
      }),
    ], 10, NOW);

    expect(suggestions.map((item) => [item.proposalId, item.action])).toEqual([
      ['send', 'SEND_CONTRACT'],
      ['follow', 'FOLLOW_SIGNATURE'],
    ]);
    expect(suggestions[1].reasons.some((reason) => reason.includes('sense signatura'))).toBe(true);
  });

  it('prioritza el contracte amb bolo proper', () => {
    const suggestions = rankContractWorkflowSuggestions([
      proposal({ id: 'later', booking: { eventDate: new Date('2026-09-01T20:00:00Z') } }),
      proposal({ id: 'soon', booking: { eventDate: new Date('2026-07-12T20:00:00Z') } }),
    ], 2, NOW);

    expect(suggestions[0]).toMatchObject({
      proposalId: 'soon',
      band: 'ALTA',
      daysUntilEvent: 3,
    });
    expect(suggestions[0].reasons).toContain('Bolo proper');
  });

  it('no recomana contractes amb data de bolo passada', () => {
    const suggestions = rankContractWorkflowSuggestions([
      proposal({ id: 'past', booking: { eventDate: new Date('2026-07-01T20:00:00Z') } }),
      proposal({ id: 'future', booking: { eventDate: new Date('2026-07-30T20:00:00Z') } }),
    ], 10, NOW);

    expect(suggestions.map((item) => item.proposalId)).toEqual(['future']);
  });
});
