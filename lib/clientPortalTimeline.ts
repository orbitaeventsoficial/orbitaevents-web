export type ClientPortalTimelineBooking = {
  createdAt: Date;
  eventDate: Date;
  depositPaid: boolean;
  depositPaidAt: Date | null;
  remainingPaid: boolean;
  remainingPaidAt: Date | null;
};

export type ClientPortalTimelineProposal = {
  createdAt: Date;
  contractSignedAt: Date | null;
};

export type MilestoneStatus = 'done' | 'upcoming' | 'future';

export type ClientPortalTimelineMilestone = {
  key: string;
  status: MilestoneStatus;
  date: Date | null;
};

export const PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS: Record<string, string> = {
  booking_created: 'milestoneBookingCreated',
  proposal_sent: 'milestoneProposalSent',
  contract_signed: 'milestoneContractSigned',
  deposit_paid: 'milestoneDepositPaid',
  event: 'milestoneEvent',
  remaining_paid: 'milestoneRemainingPaid',
};

export function buildClientPortalTimelinePath(locale: string, token: string): string {
  return `/${locale}/portal/${token}/timeline`;
}

export function getClientPortalTimeline(
  booking: ClientPortalTimelineBooking,
  proposals: ClientPortalTimelineProposal[],
  now = new Date(),
): ClientPortalTimelineMilestone[] {
  const latestProposal = proposals[0] ?? null;
  const contractSignedAt = latestProposal?.contractSignedAt ?? null;
  const eventPast = booking.eventDate < now;

  const raw: Array<{ key: string; done: boolean; date: Date | null }> = [
    { key: 'booking_created', done: true, date: booking.createdAt },
    { key: 'proposal_sent', done: !!latestProposal, date: latestProposal?.createdAt ?? null },
    { key: 'contract_signed', done: !!contractSignedAt, date: contractSignedAt },
    { key: 'deposit_paid', done: booking.depositPaid, date: booking.depositPaidAt },
    { key: 'event', done: eventPast, date: booking.eventDate },
    { key: 'remaining_paid', done: booking.remainingPaid, date: booking.remainingPaidAt },
  ];

  let foundUpcoming = false;
  return raw.map((m) => {
    if (m.done) return { key: m.key, status: 'done' as const, date: m.date };
    if (!foundUpcoming) {
      foundUpcoming = true;
      return { key: m.key, status: 'upcoming' as const, date: m.date };
    }
    return { key: m.key, status: 'future' as const, date: m.date };
  });
}
