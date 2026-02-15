import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';

interface Params {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const requestId = getRequestId(req);

  try {
    const proposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: proposal.customerId,
        action: 'PROPOSAL_SENT',
        details: { proposalId: proposal.id, reference: proposal.reference, total: proposal.total },
      },
    });

    return NextResponse.json({ ok: true, proposal });
  } catch (error) {
    log.error('Error enviant pressupost', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/send:POST', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error enviant pressupost' }, { status: 500 });
  }
}
