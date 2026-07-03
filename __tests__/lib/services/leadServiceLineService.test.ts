import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listLeadServiceLines, replaceLeadServiceLines } from '@/lib/services/leadServiceLineService';

const { mockPrisma, mockUpdateBookingDetail } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    leadServiceLine: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
  mockUpdateBookingDetail: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/bookingRouteService', () => ({ updateBookingDetail: mockUpdateBookingDetail }));

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockResolvedValue([]);
  mockUpdateBookingDetail.mockResolvedValue({ status: 200, body: { ok: true } });
});

describe('listLeadServiceLines', () => {
  it('retorna les línies del lead', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    mockPrisma.leadServiceLine.findMany.mockResolvedValue([{ id: 'l1' }]);
    const r = await listLeadServiceLines('lead1');
    expect(r.status).toBe(200);
    expect(r.body.lines).toHaveLength(1);
    expect(mockPrisma.leadServiceLine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { leadId: 'lead1' } })
    );
  });

  it('si encara es lead, amaga igualment les línies internes de transport', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    mockPrisma.leadServiceLine.findMany.mockResolvedValue([
      { id: 'producte', label: 'Bingo Musical', notes: null },
      { id: 'ruta', label: 'Temps ruta conductor', notes: '[travel-cost] DRIVER · 6.00 h' },
    ]);

    const r = await listLeadServiceLines('lead1');

    expect(r.status).toBe(200);
    expect(r.body.lines).toEqual([{ id: 'producte', label: 'Bingo Musical', notes: null }]);
  });

  it('reimputa el cost intern de transport al marge (internalTravelCost)', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    mockPrisma.leadServiceLine.findMany.mockResolvedValue([
      { id: 'producte', label: 'Bingo Musical', notes: null, costAmount: 160, quantity: 1 },
      { id: 'conductor', label: 'Temps ruta conductor', notes: '[travel-cost] DRIVER · 6.00 h', costAmount: 108, quantity: 1 },
      { id: 'passatger', label: 'Temps ruta passatger', notes: '[travel-cost] PASSENGER · 6.00 h', costAmount: 90, quantity: 1 },
    ]);

    const r = await listLeadServiceLines('lead1');

    // el producte es visible; el transport s'amaga PERO el seu cost es reimputa
    expect(r.body.lines).toHaveLength(1);
    expect(r.body.internalTravelCost).toBe(198); // 108 + 90 → menja marge, no menteix
  });

  it('si el lead ja te reserva, amaga les línies internes de transport', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      booking: {
        serviceLines: [
          { id: 'producte', label: 'Bingo Musical', notes: null },
          { id: 'ruta', label: 'Temps ruta passatger', notes: '[travel-cost] PASSENGER · 6.00 h' },
        ],
      },
    });

    const r = await listLeadServiceLines('lead1');

    expect(r.status).toBe(200);
    expect(r.body.lines).toEqual([{ id: 'producte', label: 'Bingo Musical', notes: null }]);
    expect(mockPrisma.leadServiceLine.findMany).not.toHaveBeenCalled();
  });
});

describe('replaceLeadServiceLines', () => {
  it('retorna 404 si el lead no existeix', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    const r = await replaceLeadServiceLines('missing', [{ label: 'DJ', revenueAmount: 150 }]);
    expect(r.status).toBe(404);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('substitueix totes les línies (deleteMany + createMany)', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead1' });
    const r = await replaceLeadServiceLines('lead1', [
      { label: 'DJ · 2 hores', kind: 'DJ', revenueAmount: 250, quantity: 1 },
      { label: 'Animació', kind: 'PROVIDER_SERVICE', collaboratorId: 'col1', revenueAmount: 240, costAmount: 200 },
    ]);
    expect(r.status).toBe(200);
    expect((r.body as { count: number }).count).toBe(2);
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    const createArg = mockPrisma.leadServiceLine.createMany.mock.calls[0][0];
    expect(createArg.data).toHaveLength(2);
    expect(createArg.data[0]).toMatchObject({ leadId: 'lead1', kind: 'DJ', label: 'DJ · 2 hores', sortOrder: 0 });
    expect(createArg.data[1]).toMatchObject({ collaboratorId: 'col1', costAmount: 200, sortOrder: 1 });
  });

  it('normalitza kind invàlid a OTHER i descarta línies buides', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead1' });
    const r = await replaceLeadServiceLines('lead1', [
      { label: 'X', kind: 'WIZARD', revenueAmount: 50 },
      { label: '', revenueAmount: 0 }, // buida → descartada
    ]);
    expect((r.body as { count: number }).count).toBe(1);
    const createArg = mockPrisma.leadServiceLine.createMany.mock.calls[0][0];
    expect(createArg.data[0].kind).toBe('OTHER');
  });

  it('saneja imports negatius i quantitats brutes abans de persistir línies pre-reserva', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead1' });

    const r = await replaceLeadServiceLines('lead1', [
      { label: 'Servei brut', revenueAmount: -100, costAmount: -50, quantity: -2, hours: -3 },
    ]);

    expect((r.body as { count: number }).count).toBe(1);
    const createArg = mockPrisma.leadServiceLine.createMany.mock.calls[0][0];
    expect(createArg.data[0]).toMatchObject({
      label: 'Servei brut',
      revenueAmount: 0,
      costAmount: 0,
      quantity: 1,
      hours: null,
    });
  });

  it('preserva el cost negatiu del tècnic inclòs quan el fa Òrbita', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead1' });

    const r = await replaceLeadServiceLines('lead1', [
      { label: 'Tècnic de so inclòs · 1h 30', kind: 'SOUND_TECH', collaboratorId: 'col1', revenueAmount: 0, costAmount: -40, quantity: 1 },
    ]);

    expect((r.body as { count: number }).count).toBe(1);
    const createArg = mockPrisma.leadServiceLine.createMany.mock.calls[0][0];
    expect(createArg.data[0]).toMatchObject({
      kind: 'SOUND_TECH',
      label: 'Tècnic de so inclòs · 1h 30',
      costAmount: -40,
    });
  });

  it('si no queden línies, només esborra (sense createMany)', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead1' });
    const r = await replaceLeadServiceLines('lead1', []);
    expect((r.body as { count: number }).count).toBe(0);
    expect(mockPrisma.leadServiceLine.createMany).not.toHaveBeenCalled();
  });

  it('si el lead ja te reserva, delega al servei de booking perquè recalculi totals', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead1', booking: { id: 'booking-1' } });

    const r = await replaceLeadServiceLines('lead1', [
      { label: 'DJ extra', kind: 'DJ', revenueAmount: 120, quantity: 3 },
    ]);

    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, count: 1, bookingId: 'booking-1' });
    expect(mockUpdateBookingDetail).toHaveBeenCalledWith('booking-1', {
      serviceLines: [
        expect.objectContaining({ label: 'DJ extra', kind: 'DJ', revenueAmount: 120, quantity: 3 }),
      ],
    });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.leadServiceLine.createMany).not.toHaveBeenCalled();
  });
});
