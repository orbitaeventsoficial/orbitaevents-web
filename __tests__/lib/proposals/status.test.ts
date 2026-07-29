import { describe, expect, it } from 'vitest';

import { SENT_LIKE_PROPOSAL_STATUSES, isSentLikeProposalStatus } from '@/lib/proposals/status';

describe('proposal status helpers', () => {
  it('defineix la família enviada en una sola font', () => {
    expect(SENT_LIKE_PROPOSAL_STATUSES).toEqual(['SENT', 'VIEWED']);
  });

  it('reconeix només estats enviats operatius', () => {
    expect(isSentLikeProposalStatus('SENT')).toBe(true);
    expect(isSentLikeProposalStatus('VIEWED')).toBe(true);
    expect(isSentLikeProposalStatus('DRAFT')).toBe(false);
    expect(isSentLikeProposalStatus('ACCEPTED')).toBe(false);
    expect(isSentLikeProposalStatus(null)).toBe(false);
  });
});
