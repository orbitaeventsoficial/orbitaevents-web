import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { deleteLeadScopedTaskForRoute, updateLeadScopedTaskForRoute } from '@/lib/services/leadScopedTaskRouteService';

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

    const result = await updateLeadScopedTaskForRoute(params.id, params.taskId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'TASK_NOT_FOUND') {
      return NextResponse.json({ error: 'Tasca no trobada' }, { status: 404 });
    }
    log.error('Error actualitzant tasca', error);
    return NextResponse.json({ error: 'Error actualitzant tasca' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const result = await deleteLeadScopedTaskForRoute(params.id, params.taskId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'TASK_NOT_FOUND') {
      return NextResponse.json({ error: 'Tasca no trobada' }, { status: 404 });
    }
    log.error('Error eliminant tasca', error);
    return NextResponse.json({ error: 'Error eliminant tasca' }, { status: 500 });
  }
}

