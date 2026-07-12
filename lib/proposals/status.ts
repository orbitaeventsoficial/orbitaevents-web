import { SENT_LIKE_PROPOSAL_STATUSES } from '@/lib/constants';

export { SENT_LIKE_PROPOSAL_STATUSES };

export type SentLikeProposalStatus = (typeof SENT_LIKE_PROPOSAL_STATUSES)[number];

export function isSentLikeProposalStatus(status: string | null | undefined): status is SentLikeProposalStatus {
  return SENT_LIKE_PROPOSAL_STATUSES.includes(status as SentLikeProposalStatus);
}
