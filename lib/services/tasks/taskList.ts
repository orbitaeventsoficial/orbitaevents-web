import { prisma } from '@/lib/prisma';
import type { LeadTaskStatus } from '@prisma/client';

type AdminTaskListItem = {
  id: string;
  title: string;
  status: LeadTaskStatus;
  dueDate: Date | null;
  lead?: { id: string; name: string };
  customer?: { id: string; name: string };
};

export async function fetchAdminTaskList(options: {
  status?: LeadTaskStatus;
  customerId?: string;
  page: number;
  limit: number;
  todayStart: Date;
}): Promise<{ tasks: AdminTaskListItem[]; total: number }> {
  const where = {
    ...(options.status ? { status: { equals: options.status } } : {}),
    ...(options.customerId ? { customerId: options.customerId } : {}),
    NOT: [
      {
        createdBy: 'system:daily-checklist',
        status: { in: ['OPEN', 'IN_PROGRESS'] as LeadTaskStatus[] },
        dueDate: { lt: options.todayStart },
      },
      {
        createdBy: 'system:daily-checklist',
        status: 'CANCELLED' as LeadTaskStatus,
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
      status: row.status,
      dueDate: row.dueDate,
      lead: row.lead ? { id: row.lead.id, name: row.lead.name } : undefined,
      customer: row.customer ? { id: row.customer.id, name: row.customer.name } : undefined,
    })),
    total,
  };
}
