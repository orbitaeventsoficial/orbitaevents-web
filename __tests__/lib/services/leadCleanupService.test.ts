import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockPrisma, mockMarkLeadAsLost, mockSnapshotLeads } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    leadNote: { deleteMany: vi.fn() },
    leadActivity: { deleteMany: vi.fn() },
    task: { deleteMany: vi.fn() },
    leadDocument: { deleteMany: vi.fn() },
    leadArchive: { createMany: vi.fn() },
    $transaction: vi.fn(),
  },
  mockMarkLeadAsLost: vi.fn(),
  mockSnapshotLeads: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/leadLossService', () => ({ markLeadAsLost: mockMarkLeadAsLost }));
vi.mock('@/lib/services/leadArchiveSnapshot', () => ({ snapshotLeadsBeforeDelete: mockSnapshotLeads }));

import { runLeadCleanup } from '@/lib/services/leadCleanupService';

describe('runLeadCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockPrisma) => Promise<void>) => fn(mockPrisma));
  });

  it('marca leads oberts amb data passada com LOST amb reason=EVENT_PASSED via markLeadAsLost', async () => {
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }])
      .mockResolvedValueOnce([]);
    mockMarkLeadAsLost.mockResolvedValue({
      ok: true,
      lead: { id: 'x', status: 'LOST', lostReason: 'EVENT_PASSED', lostAt: new Date() },
    });

    const result = await runLeadCleanup();

    expect(result.autoLost).toBe(3);
    expect(mockMarkLeadAsLost).toHaveBeenCalledTimes(3);
    expect(mockMarkLeadAsLost).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'l1',
        reason: 'EVENT_PASSED',
        actor: 'system:lead-cleanup',
      }),
    );
    expect(mockMarkLeadAsLost).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: 'l2', reason: 'EVENT_PASSED' }),
    );
    expect(mockMarkLeadAsLost).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: 'l3', reason: 'EVENT_PASSED' }),
    );
  });

  it('compta com autoLost només els leads que markLeadAsLost retorna ok:true', async () => {
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }])
      .mockResolvedValueOnce([]);
    mockMarkLeadAsLost
      .mockResolvedValueOnce({ ok: true, lead: { id: 'l1', status: 'LOST', lostReason: 'EVENT_PASSED', lostAt: new Date() } })
      .mockResolvedValueOnce({ ok: false, status: 404, error: 'Lead no trobat' })
      .mockResolvedValueOnce({ ok: true, lead: { id: 'l3', status: 'LOST', lostReason: 'EVENT_PASSED', lostAt: new Date() } });

    const result = await runLeadCleanup();

    expect(result.autoLost).toBe(2);
    expect(mockMarkLeadAsLost).toHaveBeenCalledTimes(3);
  });

  it('elimina leads LOST antics sense reserva (auto-delete +90 dies)', async () => {
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'old1' }, { id: 'old2' }]);
    mockPrisma.lead.deleteMany.mockResolvedValue({ count: 2 });

    const result = await runLeadCleanup();

    expect(result.autoDeleted).toBe(2);
    expect(mockSnapshotLeads).toHaveBeenCalledWith(
      expect.anything(),
      { leadIds: ['old1', 'old2'], archivedBy: 'system:lead-cleanup' },
    );
    expect(mockPrisma.leadNote.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.leadActivity.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.task.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.leadDocument.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.lead.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old1', 'old2'] } },
    });
  });

  it('no elimina res si no hi ha leads LOST antics ni leads oberts amb data passada', async () => {
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await runLeadCleanup();

    expect(result.autoLost).toBe(0);
    expect(result.autoDeleted).toBe(0);
    expect(mockMarkLeadAsLost).not.toHaveBeenCalled();
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('passa el mateix now a totes les invocacions de markLeadAsLost', async () => {
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([{ id: 'l1' }, { id: 'l2' }])
      .mockResolvedValueOnce([]);
    mockMarkLeadAsLost.mockResolvedValue({
      ok: true,
      lead: { id: 'x', status: 'LOST', lostReason: 'EVENT_PASSED', lostAt: new Date() },
    });

    await runLeadCleanup();

    const firstCall = mockMarkLeadAsLost.mock.calls[0][0];
    const secondCall = mockMarkLeadAsLost.mock.calls[1][0];
    expect(firstCall.now).toBeInstanceOf(Date);
    expect(firstCall.now.getTime()).toBe(secondCall.now.getTime());
  });
});
