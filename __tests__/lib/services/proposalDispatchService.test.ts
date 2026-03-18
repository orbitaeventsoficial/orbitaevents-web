import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockEnsureFollowUp } = vi.hoisted(() => ({
  mockPrisma: {
    proposal: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    customerActivity: { create: vi.fn() },
  },
  mockEnsureFollowUp: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/quoteFollowUp', () => ({
  ensureQuoteFollowUpTask: mockEnsureFollowUp,
}));
vi.mock('@/lib/services/quotes/quoteParsing', () => ({
  mapLeadEventType: (t: string) => t || 'OTHER',
  normalizeQuoteLocale: (l: string) => l || 'es',
  parseDateOrNull: (d: unknown) => d instanceof Date ? d : null,
}));

import { sendAdminProposal } from '@/lib/services/proposalDispatchService';

const MOCK_PROPOSAL = {
  id: 'prop-1',
  reference: 'OE-Q-2026-001',
  customerId: 'cust-1',
  leadId: 'lead-1',
  bookingId: null,
  total: 1500,
  locale: 'ca',
  snapshot: {},
  customer: { id: 'cust-1', name: 'Maria', email: 'maria@test.com' },
  lead: { id: 'lead-1' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.proposal.findUnique.mockResolvedValue(MOCK_PROPOSAL);
  mockPrisma.proposal.update.mockResolvedValue(MOCK_PROPOSAL);
  mockPrisma.lead.findFirst.mockResolvedValue(null);
  mockPrisma.lead.create.mockResolvedValue({ id: 'new-lead' });
  mockPrisma.customerActivity.create.mockResolvedValue({});
  mockEnsureFollowUp.mockResolvedValue({});
});

describe('sendAdminProposal', () => {
  it('retorna 404 si no existeix', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue(null);
    const result = await sendAdminProposal('inexistent');
    expect(result.status).toBe(404);
  });

  it('envia pressupost i retorna 200', async () => {
    const result = await sendAdminProposal('prop-1');
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });

  it('actualitza status a SENT', async () => {
    await sendAdminProposal('prop-1');
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SENT',
          sentAt: expect.any(Date),
        }),
      })
    );
  });

  it('crea customerActivity', async () => {
    await sendAdminProposal('prop-1');
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        action: 'PROPOSAL_SENT',
      }),
    });
  });

  it('crea follow-up task', async () => {
    await sendAdminProposal('prop-1');
    expect(mockEnsureFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: 'prop-1',
        customerId: 'cust-1',
      })
    );
  });

  it('reutilitza lead existent si no té leadId', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      leadId: null,
    });
    mockPrisma.lead.findFirst.mockResolvedValue({ id: 'existing-lead' });

    await sendAdminProposal('prop-1');

    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'existing-lead',
        }),
      })
    );
    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
  });

  it('crea lead nou si no té leadId i no en troba', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      leadId: null,
    });

    await sendAdminProposal('prop-1');

    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-1',
          status: 'QUOTE_SENT',
          source: 'OTHER',
        }),
      })
    );
  });
});
