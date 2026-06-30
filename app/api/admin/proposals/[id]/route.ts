import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/request-context';
import { ProposalStatus } from '@prisma/client';
import {
  getAdminProposalById,
  getProposalFinancialConsistencyIssues,
  updateAdminProposal,
  deleteAdminProposal,
} from '@/lib/services/proposalAdminService';
import { PROPOSAL_FINANCIAL_FIELDS } from '@/lib/constants/pricing';
import { dispatchAutoTrigger } from '@/lib/services/automationTriggers';
import { z } from 'zod';

function addFinancialConsistencyIssues(
  ctx: z.RefinementCtx,
  data: { subtotal: number; discount: number; vatRate: number; vatAmount: number; total: number },
) {
  for (const issue of getProposalFinancialConsistencyIssues(data)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [issue.field],
      message: issue.message,
    });
  }
}

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
}).superRefine((data, ctx) => {
  const presentFinancialFields = PROPOSAL_FINANCIAL_FIELDS.filter((field) => data[field] !== undefined);
  if (presentFinancialFields.length === 0) return;

  if (presentFinancialFields.length !== PROPOSAL_FINANCIAL_FIELDS.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['total'],
      message: 'Els camps econòmics del pressupost s’han d’actualitzar junts',
    });
    return;
  }

  addFinancialConsistencyIssues(ctx, {
    subtotal: data.subtotal!,
    discount: data.discount!,
    vatRate: data.vatRate!,
    vatAmount: data.vatAmount!,
    total: data.total!,
  });
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


export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    await deleteAdminProposal(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant pressupost', error, { context: { proposalId: params.id } });
    return NextResponse.json({ ok: false, error: 'Error eliminant pressupost' }, { status: 500 });
  }
}
