import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import { sendAdminProposal } from '@/lib/services/proposalDispatchService';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const result = await sendAdminProposal(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error enviant pressupost', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/send:POST', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error enviant pressupost' }, { status: 500 });
  }
}
