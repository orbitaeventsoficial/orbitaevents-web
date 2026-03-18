import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    task: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { createUniversalTask } from '@/lib/services/tasks/taskCreation';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.task.create.mockResolvedValue({ id: 'task-1', title: 'Test' });
});

describe('createUniversalTask', () => {
  it('crea tasca amb defaults', async () => {
    await createUniversalTask({ title: 'Nova tasca' });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Nova tasca',
        status: 'OPEN',
        priority: 'MEDIUM',
        createdBy: 'Sistema',
        customerId: null,
        leadId: null,
        bookingId: null,
        proposalId: null,
        description: null,
        dueDate: null,
        assignedTo: null,
        completedAt: null,
      }),
    });
  });

  it('crea tasca amb tots els camps', async () => {
    const dueDate = new Date('2026-04-01');
    await createUniversalTask({
      title: 'Seguiment',
      description: 'Trucar client',
      customerId: 'cust-1',
      leadId: 'lead-1',
      bookingId: 'book-1',
      proposalId: 'prop-1',
      dueDate,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedTo: 'Admin',
      createdBy: 'system:cron',
    });

    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Seguiment',
        description: 'Trucar client',
        customerId: 'cust-1',
        leadId: 'lead-1',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        createdBy: 'system:cron',
      }),
    });
  });
});
