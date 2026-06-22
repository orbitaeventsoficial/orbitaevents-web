import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { deleteLeadActivity } from '@/lib/services/leadActivityService';

interface Params {
  params: { id: string; activityId: string };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const result = await deleteLeadActivity(params.id, params.activityId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant activitat de lead', error, {
      context: { leadId: params.id, activityId: params.activityId },
    });
    return NextResponse.json({ error: 'Error eliminant activitat' }, { status: 500 });
  }
}
