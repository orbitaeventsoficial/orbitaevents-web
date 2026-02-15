import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const parsed = updateTaskSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const updateData: Record<string, unknown> = { ...payload };
    if (payload.dueDate !== undefined) {
      updateData.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    }
    if (payload.status === 'DONE') {
      updateData.completedAt = new Date();
    }
    if (payload.status && payload.status !== 'DONE') {
      updateData.completedAt = null;
    }

    const prismaAny = prisma as any;
    const task = await prismaAny.task.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    log.error('Error actualitzant tasca universal', error, {
      context: { taskId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error actualitzant tasca' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const prismaAny = prisma as any;
    await prismaAny.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant tasca universal', error, {
      context: { taskId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error eliminant tasca' }, { status: 500 });
  }
}

