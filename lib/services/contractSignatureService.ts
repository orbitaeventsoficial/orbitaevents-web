import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { generateSignedContractPdf } from '@/lib/services/contractService';
import { recordLeadContractSigned } from '@/lib/services/leadActivityService';

export type SignContractResult =
  | { ok: true; proposalId: string }
  | { ok: false; reason: 'INVALID_TOKEN' | 'NOT_SIGNABLE' | 'ALREADY_SIGNED' };

export async function signContractOnline(input: {
  rawToken: string;
  signedBy: string;
  ip: string | null;
  userAgent: string | null;
  signatureBlob?: string | null;
}): Promise<SignContractResult> {
  if (!input.rawToken || input.rawToken.length < 20) {
    return { ok: false, reason: 'INVALID_TOKEN' };
  }

  const tokenHash = createHash('sha256').update(input.rawToken).digest('hex');
  const now = new Date();

  const access = await prisma.clientPortalAccess.findUnique({
    where: { tokenHash },
    select: {
      revokedAt: true,
      expiresAt: true,
      booking: {
        select: {
          proposals: {
            where: { contractReference: { not: null } },
            select: {
              id: true,
              leadId: true,
              contractReference: true,
              contractStatus: true,
              contractSignedAt: true,
              contractPdfUrl: true,
              pdfUrl: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!access || access.revokedAt || !access.expiresAt || access.expiresAt <= now) {
    return { ok: false, reason: 'INVALID_TOKEN' };
  }

  const proposal = access.booking.proposals[0];
  if (!proposal) {
    return { ok: false, reason: 'NOT_SIGNABLE' };
  }
  if (proposal.contractSignedAt || proposal.contractStatus === 'SIGNED') {
    return { ok: false, reason: 'ALREADY_SIGNED' };
  }
  if (proposal.contractStatus !== 'SENT') {
    return { ok: false, reason: 'NOT_SIGNABLE' };
  }
  if (!proposal.contractPdfUrl && !proposal.pdfUrl) {
    return { ok: false, reason: 'NOT_SIGNABLE' };
  }

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      contractStatus: 'SIGNED',
      contractSignedAt: now,
      contractSignedBy: input.signedBy,
      contractSignatureIp: input.ip,
      contractSignatureUa: input.userAgent,
      contractSignatureBlob: input.signatureBlob ?? null,
    },
  });
  await generateSignedContractPdf(proposal.id);
  if (proposal.leadId && proposal.contractReference) {
    await recordLeadContractSigned({
      leadId: proposal.leadId,
      contractReference: proposal.contractReference,
      signedBy: input.signedBy,
      source: 'portal',
    });
  }

  return { ok: true, proposalId: proposal.id };
}
