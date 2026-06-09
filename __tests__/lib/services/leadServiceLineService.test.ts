import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listLeadServiceLines, replaceLeadServiceLines } from '@/lib/services/leadServiceLineService';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    leadServiceLine: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.$transaction.mockResolvedValue([]);
});

describe('listLeadServiceLines', () => {
  it('retorna les línies del lead', async () => {
    mockPrisma.leadServiceLine.findMany.mockResolvedValue([{ id: 'l1' }]);
    const r = await listLeadServiceLines('lead1');
    expect(r.status).toBe(200);
    expect(r.body.lines).toHaveLength(1);
    expect(mockPrisma.leadServiceLine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { leadId: 'lead1' } })
    );
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
    expect(r.body.count).toBe(2);
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
    expect(r.body.count).toBe(1);
    const createArg = mockPrisma.leadServiceLine.createMany.mock.calls[0][0];
    expect(createArg.data[0].kind).toBe('OTHER');
  });

  it('si no queden línies, només esborra (sense createMany)', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead1' });
    const r = await replaceLeadServiceLines('lead1', []);
    expect(r.body.count).toBe(0);
    expect(mockPrisma.leadServiceLine.createMany).not.toHaveBeenCalled();
  });
});
