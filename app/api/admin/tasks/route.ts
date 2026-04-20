import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { createAdminTask, listAdminTasks } from '@/lib/services/tasks/taskAdminService';

const createTaskSchema = z.object({
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  bookingId: z.string().optional(),
  proposalId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
  source: z.string().optional(),
  autoRule: z.string().optional(),
  dedupeKey: z.string().optional(),
  resolutionNote: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const result = await listAdminTasks({
      customerId: searchParams.get('customerId') || undefined,
      status: searchParams.get('status') || undefined,
      limit: Math.min(Number(searchParams.get('limit') || '25'), 100),
      page: Math.max(Number(searchParams.get('page') || '1'), 1),
    });

    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint tasques universals', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint tasques' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(await createAdminTask(parsed.data));
  } catch (error) {
    log.error('Error creant tasca universal', error);
    return NextResponse.json({ ok: false, error: 'Error creant tasca' }, { status: 500 });
  }
}
