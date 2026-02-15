import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/request-context';
import { ProposalStatus } from '@prisma/client';
import { z } from 'zod';

const createProposalSchema = z.object({
  customerId: z.string().min(1),
  leadId: z.string().optional(),
  bookingId: z.string().optional(),
  status: z.nativeEnum(ProposalStatus).optional(),
  locale: z.string().default('es'),
  currency: z.string().default('EUR'),
  validityDays: z.number().int().min(1).max(120).default(15),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  vatRate: z.number().min(0).default(21),
  vatAmount: z.number().min(0),
  total: z.number().min(0),
  snapshot: z.record(z.any()),
  pdfUrl: z.string().url().optional(),
  pdfKey: z.string().optional(),
});

async function generateProposalReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PROP-${year}-`;
  const last = await prisma.proposal.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  const current = last?.reference.split('-').pop();
  const next = Number.isFinite(Number(current)) ? Number(current) + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId') || undefined;
    const leadId = searchParams.get('leadId') || undefined;
    const bookingId = searchParams.get('bookingId') || undefined;
    const status = searchParams.get('status');

    const proposals = await prisma.proposal.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(leadId ? { leadId } : {}),
        ...(bookingId ? { bookingId } : {}),
        ...(status && Object.values(ProposalStatus).includes(status as ProposalStatus)
          ? { status: status as ProposalStatus }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ ok: true, proposals });
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

    const data = parsed.data;
    customerIdForLog = data.customerId;
    const reference = await generateProposalReference();

    const proposal = await prisma.proposal.create({
      data: {
        reference,
        customerId: data.customerId,
        leadId: data.leadId,
        bookingId: data.bookingId,
        status: data.status ?? 'DRAFT',
        locale: data.locale,
        currency: data.currency,
        validityDays: data.validityDays,
        subtotal: data.subtotal,
        discount: data.discount,
        vatRate: data.vatRate,
        vatAmount: data.vatAmount,
        total: data.total,
        snapshot: data.snapshot,
        pdfUrl: data.pdfUrl,
        pdfKey: data.pdfKey,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, proposal }, { status: 201 });
  } catch (error) {
    log.error('Error creant pressupost', error, {
      context: { requestId, endpoint: 'admin/proposals:POST', customerId: customerIdForLog },
    });
    return NextResponse.json({ ok: false, error: 'Error creant pressupost' }, { status: 500 });
  }
}
