import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { ProposalStatus } from '@prisma/client';
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
  snapshot: z.record(z.any()).optional(),
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

  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, name: true, email: true } },
        booking: { select: { id: true, reference: true, status: true } },
      },
    });

    if (!proposal) {
      return NextResponse.json({ ok: false, error: 'Pressupost no trobat' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, proposal });
  } catch (error) {
    log.error('Error obtenint pressupost', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint pressupost' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const parsed = updateProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        ...data,
        sentAt: data.sentAt === undefined ? undefined : data.sentAt ? new Date(data.sentAt) : null,
        acceptedAt: data.acceptedAt === undefined ? undefined : data.acceptedAt ? new Date(data.acceptedAt) : null,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, proposal });
  } catch (error) {
    log.error('Error actualitzant pressupost', error);
    return NextResponse.json({ ok: false, error: 'Error actualitzant pressupost' }, { status: 500 });
  }
}
