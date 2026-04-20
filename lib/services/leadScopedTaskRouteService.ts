import { prisma } from '@/lib/prisma';
import {
  createLeadScopedTask,
  deleteLeadScopedTask,
  listLeadScopedTasks,
  type LeadScopedTaskInput,
  type LeadScopedTaskUpdateInput,
  updateLeadScopedTask,
} from '@/lib/services/tasks/leadScopedTaskService';

export type LeadScopedTaskRouteInput = LeadScopedTaskInput;
export type LeadScopedTaskRouteUpdateInput = LeadScopedTaskUpdateInput;

export async function listLeadScopedTasksForRoute(leadId: string) {
  const tasks = await listLeadScopedTasks(leadId);
  return { ok: true, tasks };
}

export async function createLeadScopedTaskForRoute(leadId: string, input: LeadScopedTaskRouteInput) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { customerId: true },
  });

  const task = await createLeadScopedTask(leadId, lead?.customerId ?? null, input);

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

export async function updateLeadScopedTaskForRoute(leadId: string, taskId: string, input: LeadScopedTaskRouteUpdateInput) {
  const task = await updateLeadScopedTask(taskId, leadId, input);

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

export async function deleteLeadScopedTaskForRoute(leadId: string, taskId: string) {
  await deleteLeadScopedTask(taskId, leadId);

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
