import { prisma } from '@/lib/prisma';
import type { TaskStatus } from '@/lib/services/tasks/leadScopedTaskService';
import { TASK_SOURCE } from '@/lib/constants';

type AdminTaskListItem = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: Date | null;
  source?: string | null;
  lead?: { id: string; name: string };
  customer?: { id: string; name: string };
};

export async function fetchAdminTaskList(options: {
  status?: TaskStatus;
  customerId?: string;
  taskIds?: string[];
  page: number;
  limit: number;
  todayStart: Date;
}): Promise<{ tasks: AdminTaskListItem[]; total: number }> {
  if (options.taskIds && options.taskIds.length === 0) {
    return { tasks: [], total: 0 };
  }

  const where = {
    ...(options.status ? { status: { equals: options.status } } : {}),
    ...(options.customerId ? { customerId: options.customerId } : {}),
    ...(options.taskIds ? { id: { in: options.taskIds } } : {}),
    NOT: [
      {
        source: TASK_SOURCE.CHECKLIST,
        status: { in: ['OPEN', 'IN_PROGRESS'] as TaskStatus[] },
        dueDate: { lt: options.todayStart },
      },
      {
        source: TASK_SOURCE.CHECKLIST,
        status: 'CANCELLED' as TaskStatus,
      },
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: options.limit,
      skip: (options.page - 1) * options.limit,
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks: rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status as TaskStatus,
      dueDate: row.dueDate,
      source: row.source,
      lead: row.lead ? { id: row.lead.id, name: row.lead.name } : undefined,
      customer: row.customer ? { id: row.customer.id, name: row.customer.name } : undefined,
    })),
    total,
  };
}
