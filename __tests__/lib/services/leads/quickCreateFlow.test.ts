import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockCreateLead, mockCreateProposal, mockCreateBooking } = vi.hoisted(() => ({
  mockPrisma: {
    pack: { findUnique: vi.fn() },
    proposal: { update: vi.fn() },
  },
  mockCreateLead: vi.fn(),
  mockCreateProposal: vi.fn(),
  mockCreateBooking: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/leadAdminService', () => ({ createAdminLead: mockCreateLead }));
vi.mock('@/lib/services/proposalAdminService', () => ({ createAdminProposal: mockCreateProposal }));
vi.mock('@/lib/services/bookingCreationService', () => ({ createBookingFromInput: mockCreateBooking }));

import { quickCreate } from '@/lib/services/leads/quickCreateFlow';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.pack.findUnique.mockResolvedValue(null);
  mockPrisma.proposal.update.mockResolvedValue({});
});

const baseInput = {
  client: { name: 'Joan', email: 'joan@x.cat' },
  event: { eventType: 'WEDDING' },
} as const;

describe('quickCreate — outcome=lead', () => {
  it('crea només lead quan outcome=lead', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-1' } });
    const result = await quickCreate({ ...baseInput, outcome: 'lead' });
    expect(result).toEqual({ ok: true, leadId: 'lead-1', proposalId: null, bookingId: null });
    expect(mockCreateProposal).not.toHaveBeenCalled();
    expect(mockCreateBooking).not.toHaveBeenCalled();
  });

  it('500 si createAdminLead falla', async () => {
    mockCreateLead.mockResolvedValue({ ok: false });
    const result = await quickCreate({ ...baseInput, outcome: 'lead' });
    expect(result).toEqual({
      ok: false,
      error: 'Error creant lead',
      status: 500,
      stage: 'lead',
    });
  });
});

describe('quickCreate — outcome=lead+proposal', () => {
  it('crea lead + proposal vinculat per leadId, calcula VAT', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-2' } });
    mockCreateProposal.mockResolvedValue({ ok: true, proposal: { id: 'prop-2' } });

    const result = await quickCreate({
      ...baseInput,
      outcome: 'lead+proposal',
      proposalSubtotal: 1000,
    });

    expect(result).toEqual({
      ok: true,
      leadId: 'lead-2',
      proposalId: 'prop-2',
      bookingId: null,
    });
    const args = mockCreateProposal.mock.calls[0][0];
    expect(args.leadId).toBe('lead-2');
    expect(args.subtotal).toBe(1000);
    expect(args.vatRate).toBe(21);
    expect(args.vatAmount).toBeCloseTo(210, 5);
    expect(args.total).toBeCloseTo(1210, 5);
  });

  it('usa el preu server-side del pack si hi ha interestedPackId', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-pack' } });
    mockCreateProposal.mockResolvedValue({ ok: true, proposal: { id: 'prop-pack' } });
    mockPrisma.pack.findUnique.mockResolvedValue({ price: 875 });

    await quickCreate({
      ...baseInput,
      outcome: 'lead+proposal',
      event: { ...baseInput.event, interestedPackId: 'pack-live' },
      proposalSubtotal: 100,
    });

    expect(mockPrisma.pack.findUnique).toHaveBeenCalledWith({
      where: { id: 'pack-live' },
      select: { price: true },
    });
    const args = mockCreateProposal.mock.calls[0][0];
    expect(args.subtotal).toBe(875);
    expect(args.vatAmount).toBeCloseTo(183.75, 5);
    expect(args.total).toBeCloseTo(1058.75, 5);
  });

  it('no confia en proposalSubtotal si el packId no existeix', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-missing-pack' } });
    mockCreateProposal.mockResolvedValue({ ok: true, proposal: { id: 'prop-missing-pack' } });

    await quickCreate({
      ...baseInput,
      outcome: 'lead+proposal',
      event: { ...baseInput.event, interestedPackId: 'pack-missing' },
      proposalSubtotal: 999,
    });

    const args = mockCreateProposal.mock.calls[0][0];
    expect(args.subtotal).toBe(0);
    expect(args.total).toBe(0);
  });

  it('proposalSubtotal=0 per defecte (proposta plantilla)', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-zero' } });
    mockCreateProposal.mockResolvedValue({ ok: true, proposal: { id: 'prop-zero' } });

    await quickCreate({ ...baseInput, outcome: 'lead+proposal' });

    const args = mockCreateProposal.mock.calls[0][0];
    expect(args.subtotal).toBe(0);
    expect(args.total).toBe(0);
  });

  it('500 si createAdminProposal llança', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-x' } });
    mockCreateProposal.mockRejectedValue(new Error('boom'));
    const result = await quickCreate({ ...baseInput, outcome: 'lead+proposal' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stage).toBe('proposal');
    expect(result.error).toContain('boom');
  });
});

describe('quickCreate — outcome=lead+proposal+booking', () => {
  const fullEvent = {
    eventType: 'WEDDING',
    eventDate: '2026-12-31',
    eventLocation: 'Bcn',
    guestCount: 80,
    interestedPackId: 'pack-1',
  };
  const fullClient = { name: 'Joan', email: 'joan@x.cat', phone: '600' };

  it('400 si falta data', async () => {
    const result = await quickCreate({
      outcome: 'lead+proposal+booking',
      client: fullClient,
      event: { ...fullEvent, eventDate: undefined },
    });
    expect(result).toEqual({
      ok: false,
      error: 'Cal data per crear la reserva',
      status: 400,
      stage: 'booking',
    });
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it('400 si falta telèfon', async () => {
    const result = await quickCreate({
      outcome: 'lead+proposal+booking',
      client: { name: 'Joan', email: 'joan@x.cat' },
      event: fullEvent,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it('happy path: encadena lead → proposal → booking i lliga proposal.bookingId', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-3' } });
    mockCreateProposal.mockResolvedValue({ ok: true, proposal: { id: 'prop-3' } });
    mockCreateBooking.mockResolvedValue({ status: 201, body: { booking: { id: 'book-3' } } });

    const result = await quickCreate({
      outcome: 'lead+proposal+booking',
      client: fullClient,
      event: fullEvent,
      proposalSubtotal: 500,
    });

    expect(result).toEqual({
      ok: true,
      leadId: 'lead-3',
      proposalId: 'prop-3',
      bookingId: 'book-3',
    });
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
      where: { id: 'prop-3' },
      data: { bookingId: 'book-3' },
    });
  });

  it('propaga error de booking amb status del servei', async () => {
    mockCreateLead.mockResolvedValue({ ok: true, lead: { id: 'lead-4' } });
    mockCreateProposal.mockResolvedValue({ ok: true, proposal: { id: 'prop-4' } });
    mockCreateBooking.mockResolvedValue({ status: 404, body: { error: 'Pack no trobat' } });

    const result = await quickCreate({
      outcome: 'lead+proposal+booking',
      client: fullClient,
      event: fullEvent,
    });
    expect(result).toEqual({
      ok: false,
      error: 'Pack no trobat',
      status: 404,
      stage: 'booking',
    });
  });
});
