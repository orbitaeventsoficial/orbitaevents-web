import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { createLeadTaskForRoute, listLeadTasksForRoute } from '@/lib/services/leadTaskRouteService';

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

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const result = await listLeadTasksForRoute(params.id);
    return NextResponse.json(result);
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

    const result = await createLeadTaskForRoute(params.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error creant tasca', error);
    return NextResponse.json({ error: 'Error creant tasca' }, { status: 500 });
  }
}
