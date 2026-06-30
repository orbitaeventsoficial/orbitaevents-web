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
    lead: { findUnique: vi.fn() },
    booking: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  listAdminProposals,
  createAdminProposal,
  getAdminProposalById,
  ProposalFinancialConsistencyError,
  updateAdminProposal,
  reassignProposalOwner,
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
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.booking.findUnique.mockResolvedValue(null);
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

  it('normalitza paginació a enters finits i limita el take', async () => {
    await listAdminProposals({ page: 2.9, limit: Number.POSITIVE_INFINITY });

    expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 50,
      })
    );

    vi.clearAllMocks();
    mockPrisma.proposal.findMany.mockResolvedValue([]);
    mockPrisma.proposal.count.mockResolvedValue(0);
    await listAdminProposals({ page: 3.7, limit: 999.9 });

    expect(mockPrisma.proposal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 400,
        take: 200,
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

  it('crea proposta sense customerId (orfe) — defaulteja locale a "ca" sense consultar customer', async () => {
    const result = await createAdminProposal({
      currency: 'EUR',
      validityDays: 30,
      subtotal: 500,
      discount: 0,
      vatRate: 21,
      vatAmount: 105,
      total: 605,
      snapshot: {},
    });

    expect(result.ok).toBe(true);
    expect(mockPrisma.customer.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.proposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locale: 'ca', customerId: undefined }),
      })
    );
  });

  it('rebutja totals econòmics incoherents abans de persistir', async () => {
    await expect(createAdminProposal({
      currency: 'EUR',
      validityDays: 30,
      subtotal: 500,
      discount: 0,
      vatRate: 21,
      vatAmount: 99,
      total: 605,
      snapshot: {},
    })).rejects.toBeInstanceOf(ProposalFinancialConsistencyError);

    expect(mockPrisma.proposal.create).not.toHaveBeenCalled();
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

  it('rebutja actualització econòmica parcial abans de persistir', async () => {
    await expect(updateAdminProposal('prop1', { total: 500 })).rejects.toBeInstanceOf(ProposalFinancialConsistencyError);

    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });

  it('rebutja actualització econòmica completa però incoherent abans de persistir', async () => {
    await expect(updateAdminProposal('prop1', {
      subtotal: 500,
      discount: 0,
      vatRate: 21,
      vatAmount: 99,
      total: 599,
    })).rejects.toBeInstanceOf(ProposalFinancialConsistencyError);

    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });
});

describe('reassignProposalOwner', () => {
  it('404 si pressupost no existeix', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue(null);
    const result = await reassignProposalOwner({
      proposalId: 'inexistent',
      customerId: 'c1',
    });
    expect(result).toEqual({ ok: false, error: 'Pressupost no trobat', status: 404 });
  });

  it('400 si no es passa cap canvi', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      customerId: 'c1',
      leadId: null,
      bookingId: null,
    });
    const result = await reassignProposalOwner({ proposalId: 'p1' });
    expect(result).toEqual({ ok: false, error: 'Cap canvi sol·licitat', status: 400 });
  });

  it('404 si client target no existeix', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      customerId: null,
      leadId: null,
      bookingId: null,
    });
    mockPrisma.customer.findUnique.mockResolvedValue(null);
    const result = await reassignProposalOwner({
      proposalId: 'p1',
      customerId: 'c-x',
    });
    expect(result).toEqual({ ok: false, error: 'Client no trobat', status: 404 });
  });

  it('happy path: connect customer + disconnect lead, retorna `changed`', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      customerId: null,
      leadId: 'l1',
      bookingId: null,
    });
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'c1' });
    mockPrisma.proposal.update.mockResolvedValue({ id: 'p1' });

    const result = await reassignProposalOwner({
      proposalId: 'p1',
      customerId: 'c1',
      leadId: null,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changed.customerId).toBe(true);
    expect(result.changed.leadId).toBe(true);
    expect(result.changed.bookingId).toBe(false);
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({
          customer: { connect: { id: 'c1' } },
          lead: { disconnect: true },
        }),
      })
    );
  });

  it('valida lead i booking quan es passen', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      customerId: 'c1',
      leadId: null,
      bookingId: null,
    });
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    const result = await reassignProposalOwner({
      proposalId: 'p1',
      leadId: 'lead-x',
    });
    expect(result).toEqual({ ok: false, error: 'Lead no trobat', status: 404 });
  });

  it('disconnect-only (passar null) no toca FKs no especificades', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      id: 'p1',
      customerId: 'c1',
      leadId: 'l1',
      bookingId: 'b1',
    });
    mockPrisma.proposal.update.mockResolvedValue({ id: 'p1' });

    await reassignProposalOwner({
      proposalId: 'p1',
      customerId: null,
    });

    const callArgs = mockPrisma.proposal.update.mock.calls[0][0];
    expect(callArgs.data).toEqual({
      customer: { disconnect: true },
    });
    expect(callArgs.data.lead).toBeUndefined();
    expect(callArgs.data.booking).toBeUndefined();
  });
});
