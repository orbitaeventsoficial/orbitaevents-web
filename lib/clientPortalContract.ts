export type ClientPortalContractProposal = {
  id: string;
  reference: string;
  pdfUrl: string | null;
  createdAt: Date;
  contractReference: string | null;
  contractStatus: string | null;
  contractPdfUrl: string | null;
  contractSignedAt: Date | null;
  contractSignatureBlob: string | null;
};

export type ClientPortalContractSummary = {
  proposalId: string;
  proposalReference: string;
  contractReference: string;
  status: string;
  pdfUrl: string | null;
  signedAt: Date | null;
  signatureBlob: string | null;
  awaitingInlineSignature: boolean;
  signatureState: ClientPortalContractSignatureState;
  signatureChecklist: ClientPortalContractSignatureChecklistItem[];
};

export type ClientPortalContractSignatureState =
  | 'NOT_READY'
  | 'READY_TO_SIGN'
  | 'SIGNED'
  | 'CANCELLED';

export type ClientPortalContractSignatureChecklistItem = {
  id: 'sent' | 'pdf' | 'unsigned';
  complete: boolean;
};

export function getClientPortalContractSignatureState(input: {
  status: string;
  signedAt: Date | null;
  hasPdf?: boolean;
}): ClientPortalContractSignatureState {
  if (input.status === 'SIGNED' || input.signedAt) return 'SIGNED';
  if (input.status === 'CANCELLED') return 'CANCELLED';
  if (input.status === 'SENT' && input.hasPdf) return 'READY_TO_SIGN';
  return 'NOT_READY';
}

export function getClientPortalContractSignatureChecklist(input: {
  status: string;
  signedAt: Date | null;
  pdfUrl: string | null;
}): ClientPortalContractSignatureChecklistItem[] {
  return [
    { id: 'sent', complete: input.status === 'SENT' || input.status === 'SIGNED' },
    { id: 'pdf', complete: !!input.pdfUrl },
    { id: 'unsigned', complete: !input.signedAt && input.status !== 'SIGNED' && input.status !== 'CANCELLED' },
  ];
}

export function buildClientPortalContractPath(locale: string, token: string): string {
  return `/${locale}/portal/${token}/contract`;
}

export function getClientPortalContractSummary(
  proposals: ClientPortalContractProposal[],
): ClientPortalContractSummary | null {
  const proposal = proposals.find((item) => item.contractReference && item.contractStatus);
  if (!proposal || !proposal.contractReference || !proposal.contractStatus) return null;
  const pdfUrl = proposal.contractPdfUrl || proposal.pdfUrl;
  const signatureState = getClientPortalContractSignatureState({
    status: proposal.contractStatus,
    signedAt: proposal.contractSignedAt,
    hasPdf: !!pdfUrl,
  });
  const signatureChecklist = getClientPortalContractSignatureChecklist({
    status: proposal.contractStatus,
    signedAt: proposal.contractSignedAt,
    pdfUrl,
  });

  return {
    proposalId: proposal.id,
    proposalReference: proposal.reference,
    contractReference: proposal.contractReference,
    status: proposal.contractStatus,
    pdfUrl,
    signedAt: proposal.contractSignedAt,
    signatureBlob: proposal.contractSignatureBlob,
    awaitingInlineSignature: signatureState === 'READY_TO_SIGN',
    signatureState,
    signatureChecklist,
  };
}
