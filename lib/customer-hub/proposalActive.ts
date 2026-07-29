import type { ActiveDocumentDTO, ProposalDTO } from './dto';
import { isSentLikeProposalStatus } from '@/lib/proposals/status';

export function resolveActiveDocument(proposals: ProposalDTO[]): ActiveDocumentDTO {
  const draft = proposals.find((p) => p.status === 'DRAFT');
  if (draft) return { proposalId: draft.id, source: 'DRAFT' };

  const sent = proposals.find((p) => isSentLikeProposalStatus(p.status));
  if (sent) return { proposalId: sent.id, source: 'SENT' };

  const accepted = proposals.find((p) => p.status === 'ACCEPTED');
  if (accepted) return { proposalId: accepted.id, source: 'ACCEPTED' };

  return { source: 'NONE' };
}
