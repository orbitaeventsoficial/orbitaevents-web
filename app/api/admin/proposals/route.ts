import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/request-context';
import { ProposalStatus } from '@prisma/client';
import { z } from 'zod';
import {
  createAdminProposal,
  getProposalFinancialConsistencyIssues,
  listAdminProposals,
  ProposalCanonicalDispatchError,
} from '@/lib/services/proposalAdminService';
import { VAT_RATE_INVOICE } from '@/lib/constants/pricing';

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

const createProposalSchema = z.object({
  customerId: z.string().min(1).optional(),
  leadId: z.string().optional(),
  bookingId: z.string().optional(),
  status: z.nativeEnum(ProposalStatus).optional(),
  locale: z.string().optional(),
  currency: z.string().default('EUR'),
  validityDays: z.number().int().min(1).max(120).default(15),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).default(VAT_RATE_INVOICE),
  vatAmount: z.number().min(0),
  total: z.number().min(0),
  snapshot: z.record(z.unknown()),
  pdfUrl: z.string().url().optional(),
  pdfKey: z.string().optional(),
}).superRefine((data, ctx) => addFinancialConsistencyIssues(ctx, data));

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const { searchParams } = new URL(req.url);
    const result = await listAdminProposals({
      customerId: searchParams.get('customerId') || undefined,
      leadId: searchParams.get('leadId') || undefined,
      bookingId: searchParams.get('bookingId') || undefined,
      status: searchParams.get('status'),
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint pressupostos', error, {
      context: { requestId, endpoint: 'admin/proposals:GET' },
    });
    return NextResponse.json({ ok: false, error: 'Error obtenint pressupostos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);
  let customerIdForLog: string | undefined;

  try {
    const body = await req.json();
    const parsed = createProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }

    customerIdForLog = parsed.data.customerId;
    const result = await createAdminProposal(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ProposalCanonicalDispatchError) {
      return NextResponse.json(error.body, { status: error.status });
    }
    log.error('Error creant pressupost', error, {
      context: { requestId, endpoint: 'admin/proposals:POST', customerId: customerIdForLog },
    });
    return NextResponse.json({ ok: false, error: 'Error creant pressupost' }, { status: 500 });
  }
}
