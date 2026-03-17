import { prisma } from '@/lib/prisma';
import { createLeadTask, deleteLeadTask, listLeadTasks, updateLeadTask } from '@/lib/services/tasks/leadTaskFacade';

type LeadTaskCreateInput = {
  title: string;
  description?: string;
  dueDate?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  createdBy?: string;
};

type LeadTaskUpdateInput = {
  title?: string;
  description?: string;
  dueDate?: string | null;
  status?: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string | null;
};

export async function listLeadTasksForRoute(leadId: string) {
  const tasks = await listLeadTasks(leadId);
  return { ok: true, tasks };
}

export async function createLeadTaskForRoute(leadId: string, input: LeadTaskCreateInput) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
  });

  const task = await createLeadTask(leadId, lead?.customerId ?? null, input);

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: 'TASK',
      title: 'Tasca creada',
      description: input.title,
      metadata: { taskId: task.id, status: task.status, priority: task.priority },
      createdBy: input.createdBy ?? 'Admin',
    },
  });

  return { ok: true, task };
}

export async function updateLeadTaskForRoute(leadId: string, taskId: string, input: LeadTaskUpdateInput) {
  const task = await updateLeadTask(taskId, leadId, input);

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: 'TASK',
      title: 'Tasca actualitzada',
      description: task.title,
      metadata: { taskId: task.id, status: task.status, priority: task.priority },
    },
  });

  return { ok: true, task };
}

export async function deleteLeadTaskForRoute(leadId: string, taskId: string) {
  await deleteLeadTask(taskId, leadId);

  await prisma.leadActivity.create({
    data: {
      leadId,
      type: 'TASK',
      title: 'Tasca eliminada',
      metadata: { taskId },
    },
  });

  return { ok: true };
}

