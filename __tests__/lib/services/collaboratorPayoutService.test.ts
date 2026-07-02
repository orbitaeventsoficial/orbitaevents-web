import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    collaborator: { findUnique: vi.fn() },
    lead: { findMany: vi.fn() },
    booking: { findMany: vi.fn() },
    collaboratorPayment: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { loadCollaboratorPayout, recordCollaboratorPayment } from '@/lib/services/collaboratorPayoutService';

const COLLAB = 'masquerade';
// Bingo de Masquerade: client 240, cost 160 → la seva part (rep) = 160.
const bingoLine = { id: 'l1', collaboratorId: COLLAB, kind: 'PROVIDER_SERVICE', label: 'Bingo Musical', revenueAmount: 240, costAmount: 160, quantity: 1, hours: null };

function bookingBolo(id: string, eventDate: Date) {
  return {
    id, reference: id, clientName: `Client ${id}`, eventDate,
    eventStartTime: '17:00', eventEndTime: '18:30', eventLocation: 'Lloc',
    serviceLines: [bingoLine],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.collaborator.findUnique.mockResolvedValue({ id: COLLAB, name: 'Masquerade' });
  mockPrisma.lead.findMany.mockResolvedValue([]);
});

describe('loadCollaboratorPayout', () => {
  it('classifica un bolo FUTUR com a PREVI', async () => {
    const future = new Date(Date.now() + 30 * 86400000);
    mockPrisma.booking.findMany.mockResolvedValue([bookingBolo('B1', future)]);
    mockPrisma.collaboratorPayment.findMany.mockResolvedValue([]);

    const res = await loadCollaboratorPayout(COLLAB);
    expect(res?.bolos).toHaveLength(1);
    expect(res?.bolos[0].status).toBe('PREVI');
    expect(res?.bolos[0].amount).toBe(160);
    expect(res?.totals.previ).toBe(160);
    expect(res?.totals.aPagar).toBe(0);
    expect(res?.totals.pagat).toBe(0);
  });

  it('classifica un bolo PASSAT sense pagament com a ENTREGAT (a pagar)', async () => {
    const past = new Date(Date.now() - 30 * 86400000);
    mockPrisma.booking.findMany.mockResolvedValue([bookingBolo('B2', past)]);
    mockPrisma.collaboratorPayment.findMany.mockResolvedValue([]);

    const res = await loadCollaboratorPayout(COLLAB);
    expect(res?.bolos[0].status).toBe('ENTREGAT');
    expect(res?.totals.aPagar).toBe(160);
  });

  it('classifica un bolo amb pagament registrat com a PAGAT', async () => {
    const past = new Date(Date.now() - 30 * 86400000);
    mockPrisma.booking.findMany.mockResolvedValue([bookingBolo('B3', past)]);
    mockPrisma.collaboratorPayment.findMany.mockResolvedValue([
      { id: 'p1', bookingId: 'B3', leadId: null, amount: 160, paidAt: new Date(), method: 'CASH' },
    ]);

    const res = await loadCollaboratorPayout(COLLAB);
    expect(res?.bolos[0].status).toBe('PAGAT');
    expect(res?.bolos[0].paymentId).toBe('p1');
    expect(res?.totals.pagat).toBe(160);
    expect(res?.totals.aPagar).toBe(0);
  });

  it('retorna null si el col·laborador no existeix', async () => {
    mockPrisma.collaborator.findUnique.mockResolvedValue(null);
    expect(await loadCollaboratorPayout('inexistent')).toBeNull();
  });
});

describe('recordCollaboratorPayment', () => {
  it('rebutja import no positiu', async () => {
    const res = await recordCollaboratorPayment({ collaboratorId: COLLAB, bookingId: 'B1', amount: 0 });
    expect(res.status).toBe(400);
    expect(mockPrisma.collaboratorPayment.create).not.toHaveBeenCalled();
  });

  it('rebutja si no hi ha bolo (ni booking ni lead)', async () => {
    const res = await recordCollaboratorPayment({ collaboratorId: COLLAB, amount: 160 });
    expect(res.status).toBe(400);
  });

  it('crea el pagament amb CASH per defecte', async () => {
    mockPrisma.collaboratorPayment.create.mockResolvedValue({ id: 'p9' });
    const res = await recordCollaboratorPayment({ collaboratorId: COLLAB, bookingId: 'B1', amount: 160 });
    expect(res.status).toBe(201);
    expect(mockPrisma.collaboratorPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ collaboratorId: COLLAB, bookingId: 'B1', amount: 160, method: 'CASH' }) }),
    );
  });
});
