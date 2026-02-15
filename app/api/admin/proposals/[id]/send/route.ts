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
        lead: { select: { id: true } },
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: proposal.customerId,
        action: 'PROPOSAL_SENT',
        details: { proposalId: proposal.id, reference: proposal.reference, total: proposal.total },
      },
    });

    // Auto-seguiment 48h després d'enviar pressupost.
    const dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const taskTitle = `Seguiment pressupost ${proposal.reference}`;
    try {
      const prismaAny = prisma as any;
      const existing = await prismaAny.task.findFirst({
        where: {
          customerId: proposal.customerId,
          proposalId: proposal.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
        select: { id: true },
      });
      if (!existing) {
        await prismaAny.task.create({
          data: {
            customerId: proposal.customerId,
            leadId: proposal.leadId || null,
            bookingId: proposal.bookingId || null,
            proposalId: proposal.id,
            title: taskTitle,
            description: 'Contactar client per confirmar resposta al pressupost enviat.',
            dueDate,
            status: 'OPEN',
            priority: 'MEDIUM',
            createdBy: 'Sistema',
          },
        });
      }
    } catch {
      // Fallback legacy si encara no existeix taula tasks.
      if (proposal.lead?.id) {
        const existingLegacy = await prisma.leadTask.findFirst({
          where: {
            leadId: proposal.lead.id,
            title: taskTitle,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
          select: { id: true },
        });
        if (!existingLegacy) {
          await prisma.leadTask.create({
            data: {
              leadId: proposal.lead.id,
              title: taskTitle,
              description: 'Contactar client per confirmar resposta al pressupost enviat.',
              dueDate,
              status: 'OPEN',
              priority: 'MEDIUM',
              createdBy: 'Sistema',
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, proposal });
  } catch (error) {
    log.error('Error enviant pressupost', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/send:POST', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: 'Error enviant pressupost' }, { status: 500 });
  }
}
