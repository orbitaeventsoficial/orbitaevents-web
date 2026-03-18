import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockCreateTask } = vi.hoisted(() => ({
  mockPrisma: {
    task: { findFirst: vi.fn() },
  },
  mockCreateTask: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/taskCreation', () => ({
  createUniversalTask: mockCreateTask,
}));

import { ensureQuoteFollowUpTask } from '@/lib/services/tasks/quoteFollowUp';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.task.findFirst.mockResolvedValue(null);
  mockCreateTask.mockResolvedValue({ id: 'new-task' });
});

describe('ensureQuoteFollowUpTask', () => {
  it('crea tasca si no existeix', async () => {
    await ensureQuoteFollowUpTask({
      title: 'Seguiment pressupost',
      description: 'Contactar client',
      leadId: 'lead-1',
    });

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Seguiment pressupost',
        description: 'Contactar client',
        leadId: 'lead-1',
        status: 'OPEN',
        priority: 'MEDIUM',
        createdBy: 'Sistema',
      })
    );
  });

  it('no crea si ja existeix tasca oberta', async () => {
    mockPrisma.task.findFirst.mockResolvedValue({ id: 'existing' });

    await ensureQuoteFollowUpTask({
      title: 'Seguiment',
      description: 'Desc',
      leadId: 'lead-1',
    });

    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('cerca per proposalId si proporcionat', async () => {
    await ensureQuoteFollowUpTask({
      title: 'Seguiment',
      description: 'Desc',
      leadId: 'lead-1',
      proposalId: 'prop-1',
      customerId: 'cust-1',
    });

    expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        proposalId: 'prop-1',
        customerId: 'cust-1',
      }),
      select: { id: true },
    });
  });

  it('cerca per leadId+title si no hi ha proposalId', async () => {
    await ensureQuoteFollowUpTask({
      title: 'Seguiment especial',
      description: 'Desc',
      leadId: 'lead-1',
    });

    expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        leadId: 'lead-1',
        title: 'Seguiment especial',
      }),
      select: { id: true },
    });
  });

  it('usa dueDate 48h per defecte', async () => {
    const before = Date.now();

    await ensureQuoteFollowUpTask({
      title: 'Test',
      description: 'Desc',
      leadId: 'lead-1',
    });

    const call = mockCreateTask.mock.calls[0][0];
    const dueDateMs = call.dueDate.getTime();
    const expectedMs = before + 48 * 60 * 60 * 1000;
    expect(Math.abs(dueDateMs - expectedMs)).toBeLessThan(1000);
  });
});
