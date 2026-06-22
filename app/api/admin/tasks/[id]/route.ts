import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { deleteAdminTask, updateAdminTask } from '@/lib/services/tasks/taskAdminService';

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
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const parsed = updateTaskSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(await updateAdminTask(params.id, parsed.data));
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
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    return NextResponse.json(await deleteAdminTask(params.id));
  } catch (error) {
    log.error('Error eliminant tasca universal', error, {
      context: { taskId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error eliminant tasca' }, { status: 500 });
  }
}
