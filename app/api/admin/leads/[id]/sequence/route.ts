import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { runCommercialSequenceForLead } from '@/lib/services/commercialSequenceService';

interface Params {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const rawStep =
    typeof body === 'object' && body !== null && 'step' in body
      ? (body as { step?: unknown }).step
      : undefined;
  const step = typeof rawStep === 'number' ? rawStep : undefined;

  try {
    const result = await runCommercialSequenceForLead(params.id, { step });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, summary: result });
  } catch (error) {
    log.error('Error executant seqüència comercial manual', error, {
      context: { endpoint: 'POST /api/admin/leads/[id]/sequence', leadId: params.id, step },
    });
    return NextResponse.json(
      { ok: false, error: 'Error executant seqüència comercial manual' },
      { status: 500 },
    );
  }
}
