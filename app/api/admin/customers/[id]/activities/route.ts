import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { createCustomerActivityNote, listCustomerActivities } from '@/lib/services/customerActivityService';

interface Params {
  params: { id: string };
}

const createActivitySchema = z.object({
  action: z.string().min(1).max(80).optional(),
  note: z.string().min(1).max(4000),
});

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const result = await listCustomerActivities(params.id);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint activitats de client', error, {
      context: { customerId: params.id, endpoint: 'admin/customers/[id]/activities:GET' },
    });
    return NextResponse.json({ ok: false, error: 'Error obtenint activitats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const parsed = createActivitySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createCustomerActivityNote(params.id, parsed.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant activitat de client', error, {
      context: { customerId: params.id, endpoint: 'admin/customers/[id]/activities:POST' },
    });
    return NextResponse.json({ ok: false, error: 'Error creant activitat' }, { status: 500 });
  }
}
