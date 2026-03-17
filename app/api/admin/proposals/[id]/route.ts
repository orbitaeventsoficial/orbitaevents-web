import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/request-context';
import { ProposalStatus } from '@prisma/client';
import { getAdminProposalById, updateAdminProposal } from '@/lib/services/proposalAdminService';
import { dispatchAutoTrigger } from '@/lib/services/automationTriggers';
import { z } from 'zod';

const updateProposalSchema = z.object({
  status: z.nativeEnum(ProposalStatus).optional(),
  locale: z.string().optional(),
  currency: z.string().optional(),
  validityDays: z.number().int().min(1).max(120).optional(),
  subtotal: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  vatRate: z.number().min(0).optional(),
  vatAmount: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  snapshot: z.record(z.unknown()).optional(),
  pdfUrl: z.string().url().optional(),
  pdfKey: z.string().optional(),
  sentAt: z.string().datetime().nullable().optional(),
  acceptedAt: z.string().datetime().nullable().optional(),
});

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const result = await getAdminProposalById(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint pressupost', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]:GET', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error obtenint pressupost' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const parsed = updateProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await updateAdminProposal(params.id, parsed.data);

    // Auto-trigger: proposal accepted → generate contract
    if (parsed.data.acceptedAt || parsed.data.status === 'ACCEPTED') {
      dispatchAutoTrigger({ type: 'proposal.accepted', proposalId: params.id }).catch(() => {});
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant pressupost', error, {
      context: {
        requestId,
        endpoint: 'admin/proposals/[id]:PATCH',
        proposalId: params.id,
      },
    });
    return NextResponse.json({ ok: false, error: 'Error actualitzant pressupost' }, { status: 500 });
  }
}

