import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import {
  generateContractFromProposal,
  markContractSigned,
} from '@/lib/services/contractService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

// POST: Genera contracte PDF des de proposta acceptada
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

// PATCH: Actualitza estat del contracte (SIGNED / CANCELLED)
export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const { status, signedBy } = patchSchema.parse(body);

    // Validar estat actual
    const proposal = await prisma.proposal.findUniqueOrThrow({
      where: { id: params.id },
      select: { contractStatus: true, contractReference: true, leadId: true },
    });

    if (!proposal.contractStatus || !proposal.contractReference) {
      return NextResponse.json({ ok: false, error: 'No hi ha contracte generat' }, { status: 400 });
    }

    if (status === 'SIGNED') {
      await markContractSigned(params.id, signedBy || 'Admin');
    } else {
      // CANCELLED — validar que no estigui ja signat
      if (proposal.contractStatus === 'SIGNED') {
        return NextResponse.json({ ok: false, error: 'No es pot cancel·lar un contracte ja signat' }, { status: 400 });
      }
      if (proposal.contractStatus === 'CANCELLED') {
        return NextResponse.json({ ok: false, error: 'El contracte ja està cancel·lat' }, { status: 400 });
      }

      await prisma.proposal.update({
        where: { id: params.id },
        data: { contractStatus: 'CANCELLED' },
      });

      log.info(`Contracte cancel·lat: ${proposal.contractReference}`);

      // Log activitat al lead si vinculat
      if (proposal.leadId) {
        await prisma.leadActivity.create({
          data: {
            leadId: proposal.leadId,
            type: 'SYSTEM',
            title: 'Contracte cancel·lat',
            description: `Contracte ${proposal.contractReference} cancel·lat`,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error actualitzant contracte';
    log.error('Error actualitzant contracte', error, {
      context: { requestId, endpoint: 'admin/proposals/[id]/contract:PATCH', proposalId: params.id },
    });
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
