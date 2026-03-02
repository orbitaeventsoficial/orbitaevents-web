import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { sendContract } from '@/lib/services/contractService';

interface Params {
  params: { id: string };
}

// POST: Envia contracte per email al client
export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    await sendContract(params.id);
    return NextResponse.json({ ok: true, message: 'Contracte enviat correctament' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error enviant contracte';
    log.error('Error enviant contracte', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/contract/send:POST', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
