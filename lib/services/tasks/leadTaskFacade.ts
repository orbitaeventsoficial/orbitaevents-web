import { prisma } from '@/lib/prisma';

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: true,
  createdBy: true,
  completedAt: true,
} as const;

type LeadTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
type LeadTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type LeadTaskInput = {
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: LeadTaskStatus;
  priority?: LeadTaskPriority;
  assignedTo?: string | null;
  createdBy?: string;
};

type LeadTaskUpdateInput = {
  title?: string;
  description?: string;
  dueDate?: string | null;
  status?: LeadTaskStatus;
  priority?: LeadTaskPriority;
  assignedTo?: string | null;
};

export async function listLeadTasks(leadId: string) {
  const tasks = await prisma.task.findMany({
    where: { leadId },
    orderBy: { createdAt: 'desc' },
    select: TASK_SELECT,
  });

  return tasks.map(normalizeTaskRecord);
}

export async function createLeadTask(leadId: string, customerId: string | null | undefined, input: LeadTaskInput) {
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
      completedAt: input.status === 'DONE' ? new Date() : null,
    },
    select: TASK_SELECT,
  });

  return normalizeTaskRecord(task);
}

export async function updateLeadTask(taskId: string, leadId: string, input: LeadTaskUpdateInput) {
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
    select: TASK_SELECT,
  });

  return normalizeTaskRecord(task);
}

export async function findLeadTaskLinkByTaskOrLegacyId(taskOrLegacyId: string) {
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

export async function deleteLeadTask(taskId: string, leadId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, leadId },
    select: { id: true, legacyLeadTaskId: true },
  });

  if (!task) {
    throw new Error('TASK_NOT_FOUND');
  }

  await prisma.task.delete({ where: { id: task.id } });

  if (task.legacyLeadTaskId) {
    await prisma.leadTask.deleteMany({ where: { id: task.legacyLeadTaskId, leadId } });
  }
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


