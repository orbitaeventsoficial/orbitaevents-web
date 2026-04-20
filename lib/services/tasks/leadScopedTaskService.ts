import { ADMIN_LEAD_TASK_SELECT } from '@/lib/constants/admin';
import { prisma } from '@/lib/prisma';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type LeadScopedTaskInput = {
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string | null;
  createdBy?: string;
  source?: string | null;
};

export type LeadScopedTaskUpdateInput = {
  title?: string;
  description?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string | null;
};

export async function listLeadScopedTasks(leadId: string) {
  const tasks = await prisma.task.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    select: ADMIN_LEAD_TASK_SELECT,
  });

  return tasks.map(normalizeTaskRecord);
}

export async function createLeadScopedTask(
  leadId: string,
  customerId: string | null | undefined,
  input: LeadScopedTaskInput,
) {
  const dueDate = input.dueDate ? new Date(input.dueDate) : null;

  const task = await prisma.task.create({
    data: {
      customerId: customerId ?? null,
      leadId,
      title: input.title,
      description: input.description ?? null,
      dueDate,
      status: input.status ?? 'OPEN',
      priority: input.priority ?? 'MEDIUM',
      assignedTo: input.assignedTo ?? null,
      createdBy: input.createdBy ?? 'Admin',
      source: input.source ?? null,
      completedAt: input.status === 'DONE' ? new Date() : null,
    },
    select: ADMIN_LEAD_TASK_SELECT,
  });

  return normalizeTaskRecord(task);
}

export async function updateLeadScopedTask(taskId: string, leadId: string, input: LeadScopedTaskUpdateInput) {
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, leadId },
    select: { id: true },
  });

  if (!existingTask) {
    throw new Error('TASK_NOT_FOUND');
  }

  const updateData: Record<string, unknown> = { ...input };
  if (input.dueDate !== undefined) {
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.status === 'DONE') {
    updateData.completedAt = new Date();
  }
  if (input.status && input.status !== 'DONE') {
    updateData.completedAt = null;
  }

  const task = await prisma.task.update({
    where: { id: existingTask.id },
    data: updateData,
    select: ADMIN_LEAD_TASK_SELECT,
  });

  return normalizeTaskRecord(task);
}

export async function findTaskLinkByTaskOrLegacyId(taskOrLegacyId: string) {
  const directTask = await prisma.task.findUnique({
    where: { id: taskOrLegacyId },
    select: { customerId: true, leadId: true },
  });

  if (directTask) {
    return directTask;
  }

  return prisma.task.findFirst({
    where: { legacyLeadTaskId: taskOrLegacyId },
    select: { customerId: true, leadId: true },
  });
}

export async function deleteLeadScopedTask(taskId: string, leadId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, leadId },
    select: { id: true },
  });

  if (!task) {
    throw new Error('TASK_NOT_FOUND');
  }

  await prisma.task.delete({ where: { id: task.id } });
}

function normalizeTaskRecord(task: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: string | null;
  createdBy: string | null;
  completedAt: Date | null;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    assignedTo: task.assignedTo,
    createdBy: task.createdBy,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
  };
}
