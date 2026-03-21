import { OPEN_TASK_STATUSES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { createUniversalTask } from '@/lib/services/tasks/taskCreation';

type QuoteFollowUpInput = {
  title: string;
  description: string;
  leadId: string;
  customerId?: string | null;
  bookingId?: string | null;
  proposalId?: string | null;
  dueDate?: Date;
};

export async function ensureQuoteFollowUpTask(input: QuoteFollowUpInput): Promise<void> {
  const dueDate = input.dueDate ?? new Date(Date.now() + 48 * 60 * 60 * 1000);

  const where = input.proposalId
    ? {
        customerId: input.customerId ?? null,
        proposalId: input.proposalId,
        status: { in: [...OPEN_TASK_STATUSES] },
      }
    : {
        leadId: input.leadId,
        title: input.title,
        status: { in: [...OPEN_TASK_STATUSES] },
      };

  const existingTask = await prisma.task.findFirst({
    where,
    select: { id: true },
  });

  if (existingTask) {
    return;
  }

  await createUniversalTask({
    customerId: input.customerId ?? null,
    leadId: input.leadId,
    bookingId: input.bookingId ?? null,
    proposalId: input.proposalId ?? null,
    title: input.title,
    description: input.description,
    dueDate,
    status: 'OPEN',
    priority: 'MEDIUM',
    createdBy: 'Sistema',
  });
}
