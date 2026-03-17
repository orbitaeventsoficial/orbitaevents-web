import { prisma } from '@/lib/prisma';

type UniversalTaskCreateInput = {
  customerId?: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  proposalId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  status?: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string | null;
  createdBy?: string | null;
  completedAt?: Date | null;
};

export async function createUniversalTask(input: UniversalTaskCreateInput) {
  return prisma.task.create({
    data: {
      customerId: input.customerId ?? null,
      leadId: input.leadId ?? null,
      bookingId: input.bookingId ?? null,
      proposalId: input.proposalId ?? null,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      status: input.status ?? 'OPEN',
      priority: input.priority ?? 'MEDIUM',
      assignedTo: input.assignedTo ?? null,
      createdBy: input.createdBy ?? 'Sistema',
      completedAt: input.completedAt ?? null,
    },
  });
}

