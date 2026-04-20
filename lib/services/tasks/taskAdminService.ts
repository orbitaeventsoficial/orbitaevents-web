import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { OPEN_TASK_STATUSES } from '@/lib/constants';
import type { TaskStatus } from '@/lib/services/tasks/leadScopedTaskService';

export type AdminTaskCreateInput = {
  customerId?: string;
  leadId?: string;
  bookingId?: string;
  proposalId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: TaskStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  createdBy?: string;
  source?: string;
  autoRule?: string;
  dedupeKey?: string;
  resolutionNote?: string;
};

export type AdminTaskUpdateInput = {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string | null;
};

function normalizeTaskStatus(status?: string): TaskStatus | undefined {
  const allowed: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
  return status && allowed.includes(status as TaskStatus)
    ? (status as TaskStatus)
    : undefined;
}

export async function listAdminTasks(input: {
  customerId?: string;
  status?: string;
  limit: number;
  page: number;
}) {
  const skip = (input.page - 1) * input.limit;
  const normalizedStatus = normalizeTaskStatus(input.status);
  const where: Prisma.TaskWhereInput = {
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: input.limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    ok: true,
    tasks,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.limit)),
    },
  };
}

export async function createAdminTask(input: AdminTaskCreateInput) {
  const normalizedStatus = normalizeTaskStatus(input.status);
  const normalizedSource = input.source?.trim() || null;
  const normalizedDedupeKey = input.dedupeKey?.trim() || null;
  const reopenedStatus = normalizedStatus ?? 'OPEN';

  if (normalizedDedupeKey) {
    const existingTask = await prisma.task.findFirst({
      where: {
        dedupeKey: normalizedDedupeKey,
        status: { in: [...OPEN_TASK_STATUSES] },
      },
    });

    if (existingTask) {
      return { ok: true, task: existingTask, deduped: true as const };
    }

    if (normalizedSource === 'REACTIVATION') {
      const closedReactivationTask = await prisma.task.findFirst({
        where: {
          dedupeKey: normalizedDedupeKey,
          source: 'REACTIVATION',
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (closedReactivationTask) {
        const reopenedTask = await prisma.task.update({
          where: { id: closedReactivationTask.id },
          data: {
            customerId: input.customerId || null,
            leadId: input.leadId || null,
            bookingId: input.bookingId || null,
            proposalId: input.proposalId || null,
            title: input.title,
            description: input.description || null,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            status: reopenedStatus,
            priority: input.priority || 'MEDIUM',
            assignedTo: input.assignedTo || null,
            source: normalizedSource,
            autoRule: input.autoRule?.trim() || null,
            resolutionNote: input.resolutionNote?.trim() || null,
            completedAt: reopenedStatus === 'DONE' ? new Date() : null,
          },
        });

        return { ok: true, task: reopenedTask, reopened: true as const };
      }
    }
  }

  const task = await prisma.task.create({
    data: {
      customerId: input.customerId || null,
      leadId: input.leadId || null,
      bookingId: input.bookingId || null,
      proposalId: input.proposalId || null,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: reopenedStatus,
      priority: input.priority || 'MEDIUM',
      assignedTo: input.assignedTo || null,
      createdBy: input.createdBy || 'Admin',
      source: normalizedSource,
      autoRule: input.autoRule?.trim() || null,
      dedupeKey: normalizedDedupeKey,
      resolutionNote: input.resolutionNote?.trim() || null,
      completedAt: reopenedStatus === 'DONE' ? new Date() : null,
    },
  });

  return { ok: true, task };
}

export async function updateAdminTask(id: string, input: AdminTaskUpdateInput) {
  const normalizedStatus = normalizeTaskStatus(input.status);
  const updateData: Record<string, unknown> = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.assignedTo !== undefined ? { assignedTo: input.assignedTo } : {}),
    ...(input.status !== undefined ? { status: normalizedStatus } : {}),
  };

  if (input.dueDate !== undefined) {
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (normalizedStatus === 'DONE') {
    updateData.completedAt = new Date();
  }
  if (normalizedStatus && normalizedStatus !== 'DONE') {
    updateData.completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  });

  return { ok: true, task };
}

export async function deleteAdminTask(id: string) {
  await prisma.task.delete({ where: { id } });
  return { ok: true };
}
