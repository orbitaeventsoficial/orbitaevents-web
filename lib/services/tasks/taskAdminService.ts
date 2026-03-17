import { LeadTaskStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminTaskCreateInput = {
  customerId?: string;
  leadId?: string;
  bookingId?: string;
  proposalId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  createdBy?: string;
};

export type AdminTaskUpdateInput = {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string | null;
};

function normalizeTaskStatus(status?: string): LeadTaskStatus | undefined {
  return status && Object.values(LeadTaskStatus).includes(status as LeadTaskStatus)
    ? (status as LeadTaskStatus)
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

  const task = await prisma.task.create({
    data: {
      customerId: input.customerId || null,
      leadId: input.leadId || null,
      bookingId: input.bookingId || null,
      proposalId: input.proposalId || null,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: normalizedStatus ?? 'OPEN',
      priority: input.priority || 'MEDIUM',
      assignedTo: input.assignedTo || null,
      createdBy: input.createdBy || 'Admin',
      completedAt: normalizedStatus === 'DONE' ? new Date() : null,
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
