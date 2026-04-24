import { prisma } from '@/lib/prisma';
import {
  createLeadScopedTask,
  deleteLeadScopedTask,
  listLeadScopedTasks,
  type LeadScopedTaskInput,
  type LeadScopedTaskUpdateInput,
  updateLeadScopedTask,
} from '@/lib/services/tasks/leadScopedTaskService';
import { recordLeadTaskCreated, recordLeadTaskDeleted, recordLeadTaskUpdated } from '@/lib/services/leadActivityService';

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

  await recordLeadTaskCreated({
    leadId,
    taskId: task.id,
    title: input.title,
    status: task.status,
    priority: task.priority,
    createdBy: input.createdBy ?? 'Admin',
  });

  return { ok: true, task };
}

export async function updateLeadScopedTaskForRoute(leadId: string, taskId: string, input: LeadScopedTaskRouteUpdateInput) {
  const task = await updateLeadScopedTask(taskId, leadId, input);

  await recordLeadTaskUpdated({
    leadId,
    taskId: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
  });

  return { ok: true, task };
}

export async function deleteLeadScopedTaskForRoute(leadId: string, taskId: string) {
  await deleteLeadScopedTask(taskId, leadId);

  await recordLeadTaskDeleted({
    leadId,
    taskId,
  });

  return { ok: true };
}
