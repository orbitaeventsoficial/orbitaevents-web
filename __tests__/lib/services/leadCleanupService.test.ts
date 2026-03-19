import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    leadNote: { deleteMany: vi.fn() },
    leadActivity: { deleteMany: vi.fn() },
    task: { deleteMany: vi.fn() },
    leadTask: { deleteMany: vi.fn() },
    leadDocument: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));

import { runLeadCleanup } from '@/lib/services/leadCleanupService';

describe('runLeadCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockPrisma) => Promise<void>) => fn(mockPrisma));
  });

  it('marca leads oberts amb data passada com LOST', async () => {
    mockPrisma.lead.updateMany.mockResolvedValue({ count: 3 });
    mockPrisma.lead.findMany.mockResolvedValue([]);

    const result = await runLeadCleanup();

    expect(result.autoLost).toBe(3);
    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'LOST' },
      })
    );
  });

  it('elimina leads LOST antics sense reserva', async () => {
    mockPrisma.lead.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'old1' },
      { id: 'old2' },
    ]);
    mockPrisma.lead.deleteMany.mockResolvedValue({ count: 2 });

    const result = await runLeadCleanup();

    expect(result.autoDeleted).toBe(2);
    expect(mockPrisma.leadNote.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.leadActivity.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.lead.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old1', 'old2'] } },
    });
  });

  it('no elimina res si no hi ha leads LOST antics', async () => {
    mockPrisma.lead.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.lead.findMany.mockResolvedValue([]);

    const result = await runLeadCleanup();

    expect(result.autoLost).toBe(0);
    expect(result.autoDeleted).toBe(0);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
