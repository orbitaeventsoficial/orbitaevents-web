import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string };
}

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const authError = requireAuth(_req);
  if (authError) return authError;
  try {
    const tasks = await prisma.leadTask.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, tasks });
  } catch (error) {
    log.error('Error obtenint tasques', error);
    return NextResponse.json({ error: 'Error obtenint tasques' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    const task = await prisma.leadTask.create({
      data: {
        leadId: params.id,
        title: data.title,
        description: data.description,
        dueDate,
        status: data.status ?? 'OPEN',
        priority: data.priority ?? 'MEDIUM',
        assignedTo: data.assignedTo,
        createdBy: data.createdBy,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        type: 'TASK',
        title: 'Tasca creada',
        description: data.title,
        metadata: { taskId: task.id, status: task.status, priority: task.priority },
        createdBy: data.createdBy ?? 'Admin',
      },
    });

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    log.error('Error creant tasca', error);
    return NextResponse.json({ error: 'Error creant tasca' }, { status: 500 });
  }
}