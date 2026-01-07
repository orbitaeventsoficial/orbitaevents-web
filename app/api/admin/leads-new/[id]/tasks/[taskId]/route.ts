import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';

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
  try {
    await prisma.leadTask.delete({
      where: { id: params.taskId },
    });

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
