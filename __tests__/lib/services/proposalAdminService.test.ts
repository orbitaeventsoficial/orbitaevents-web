import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    proposal: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customer: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminProposals,
  createAdminProposal,
  getAdminProposalById,
  updateAdminProposal,
} from '@/lib/services/proposalAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.proposal.findMany.mockResolvedValue([]);
  mockPrisma.proposal.count.mockResolvedValue(0);
  mockPrisma.proposal.findUnique.mockResolvedValue(null);
  mockPrisma.proposal.findFirst.mockResolvedValue(null);
  mockPrisma.proposal.create.mockResolvedValue({ id: 'prop1', reference: 'PROP-2026-0001' });
  mockPrisma.proposal.update.mockResolvedValue({ id: 'prop1' });
  mockPrisma.customer.findUnique.mockResolvedValue(null);
});

describe('listAdminProposals', () => {
  it('retorna llista', async () => {
    const result = await listAdminProposals({});

    expect(result.ok).toBe(true);
    expect(result.proposals).toEqual([]);
    expect(result.pagination).toEqual({ page: 1, limit: 50, total: 0, pages: 1 });
  });

  it('filtra per customerId', async () => {
    await listAdminProposals({ customerId: 'c1' });

    expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customerId: 'c1' }),
      })
    );
    expect(mockPrisma.proposal.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customerId: 'c1' }),
      })
    );
  });

  it('filtra per status vàlid', async () => {
    await listAdminProposals({ status: 'DRAFT' });

    expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'DRAFT' }),
      })
    );
    expect(mockPrisma.proposal.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'DRAFT' }),
      })
    );
  });
});

describe('createAdminProposal', () => {
  it('crea proposta amb referència generada', async () => {
    const result = await createAdminProposal({
      customerId: 'c1',
      currency: 'EUR',
      validityDays: 30,
      subtotal: 1000,
      discount: 0,
      vatRate: 21,
      vatAmount: 210,
      total: 1210,
      snapshot: { packs: [] },
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.proposal.create).toHaveBeenCalled();
  });

  it('usa preferredLocale del client', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue({ preferredLocale: 'es' });

    await createAdminProposal({
      customerId: 'c1',
      currency: 'EUR',
      validityDays: 30,
      subtotal: 500,
      discount: 0,
      vatRate: 21,
      vatAmount: 105,
      total: 605,
      snapshot: {},
    });

    expect(mockPrisma.proposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locale: 'es' }),
      })
    );
  });
});

describe('getAdminProposalById', () => {
  it('retorna 404 si no existeix', async () => {
    const result = await getAdminProposalById('inexistent');

    expect(result.status).toBe(404);
  });

  it('retorna proposta', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({ id: 'prop1', reference: 'PROP-2026-0001' });

    const result = await getAdminProposalById('prop1');

    expect(result.status).toBe(200);
  });
});

describe('updateAdminProposal', () => {
  it('actualitza camp específic', async () => {
    const result = await updateAdminProposal('prop1', { status: 'SENT' });

    expect(result.status).toBe(200);
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop1' },
        data: expect.objectContaining({ status: 'SENT' }),
      })
    );
  });

  it('parseja dates sentAt/acceptedAt', async () => {
    await updateAdminProposal('prop1', {
      sentAt: '2026-03-15T10:00:00Z',
      acceptedAt: null,
    });

    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sentAt: expect.any(Date),
          acceptedAt: null,
        }),
      })
    );
  });
});
