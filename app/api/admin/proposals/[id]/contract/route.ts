import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import {
  cancelContract,
  generateContractFromProposal,
  markContractSigned,
} from '@/lib/services/contractService';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const { contractReference, pdfBuffer } = await generateContractFromProposal(params.id);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contracte-${contractReference}.pdf"`,
        'X-Contract-Reference': contractReference,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error generant contracte';
    log.error('Error generant contracte', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/contract:POST', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

const patchSchema = z.object({
  status: z.enum(['SIGNED', 'CANCELLED']),
  signedBy: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const { status, signedBy } = patchSchema.parse(body);

    if (status === 'SIGNED') {
      await markContractSigned(params.id, signedBy || 'Admin');
      return NextResponse.json({ ok: true, status });
    }

    const result = await cancelContract(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error actualitzant contracte';
    log.error('Error actualitzant contracte', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/contract:PATCH', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
