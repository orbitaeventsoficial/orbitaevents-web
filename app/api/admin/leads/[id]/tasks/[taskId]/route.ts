import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string; taskId: string };
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    if (data.status === 'DONE') {
      updateData.completedAt = new Date();
    }

    const task = await prisma.leadTask.update({
      where: { id: params.taskId },
      data: updateData,
    });

    try {
      const prismaAny = prisma as any;
      await prismaAny.task.updateMany({
        where: { legacyLeadTaskId: params.taskId },
        data: {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo,
          completedAt: task.completedAt,
        },
      });
    } catch (syncError) {
      log.warn('No s\'ha pogut sincronitzar task universal (PATCH)', {
        leadId: params.id,
        taskId: params.taskId,
        error: syncError instanceof Error ? syncError.message : String(syncError),
      });
    }

    await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        type: 'TASK',
        title: 'Tasca actualitzada',
        description: task.title,
        metadata: { taskId: task.id, status: task.status, priority: task.priority },
      },
    });

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    log.error('Error actualitzant tasca', error);
    return NextResponse.json({ error: 'Error actualitzant tasca' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const authError = requireAuth(_req);
  if (authError) return authError;
  try {
    await prisma.leadTask.delete({
      where: { id: params.taskId },
    });

    try {
      const prismaAny = prisma as any;
      await prismaAny.task.deleteMany({
        where: { legacyLeadTaskId: params.taskId },
      });
    } catch (syncError) {
      log.warn('No s\'ha pogut sincronitzar task universal (DELETE)', {
        leadId: params.id,
        taskId: params.taskId,
        error: syncError instanceof Error ? syncError.message : String(syncError),
      });
    }

    await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        type: 'TASK',
        title: 'Tasca eliminada',
        metadata: { taskId: params.taskId },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant tasca', error);
    return NextResponse.json({ error: 'Error eliminant tasca' }, { status: 500 });
  }
}
