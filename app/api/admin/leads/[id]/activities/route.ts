import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { cleanupDuplicateLeadActivities, createLeadActivity, listLeadActivities } from '@/lib/services/leadActivityService';

interface Params {
  params: { id: string };
}

const activitySchema = z.object({
  type: z.enum(['NOTE', 'STATUS_CHANGE', 'EMAIL', 'CALL', 'WHATSAPP', 'DOCUMENT', 'TASK', 'SYSTEM']).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  createdBy: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const result = await listLeadActivities(params.id);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint activitats', error);
    return NextResponse.json({ error: 'Error obtenint activitats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const body = await req.json();
    const parsed = activitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await createLeadActivity(params.id, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error creant activitat', error);
    return NextResponse.json({ error: 'Error creant activitat' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const result = await cleanupDuplicateLeadActivities(params.id);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error netejant activitats duplicades', error);
    return NextResponse.json({ error: 'Error netejant activitats duplicades' }, { status: 500 });
  }
}
