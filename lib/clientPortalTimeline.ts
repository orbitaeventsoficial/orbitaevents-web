import { PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS } from '@/lib/constants/clientPortalTimeline';
import { bookingOutstandingBreakdown } from '@/lib/payment-status';

export { PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS };

export type ClientPortalTimelineBooking = {
  createdAt: Date;
  eventDate: Date;
  total?: number | null;
  depositAmount?: number | null;
  depositPaid: boolean;
  depositPaidAt: Date | null;
  remainingAmount?: number | null;
  remainingPaid: boolean;
  remainingPaidAt: Date | null;
  cashAmount?: number | null;
};

export type ClientPortalTimelineProposal = {
  createdAt: Date;
  contractSignedAt: Date | null;
};

export type MilestoneStatus = 'done' | 'upcoming' | 'future';

export type ClientPortalTimelineMilestoneKey =
  keyof typeof PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS;

export type ClientPortalTimelineMilestone = {
  key: ClientPortalTimelineMilestoneKey;
  status: MilestoneStatus;
  date: Date | null;
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
  const depositAmount = booking.depositAmount ?? 0;
  const remainingAmount = booking.remainingAmount ?? Math.max(0, (booking.total ?? 0) - depositAmount);
  const total = booking.total ?? depositAmount + remainingAmount;
  const paymentBreakdown = bookingOutstandingBreakdown({
    total,
    depositAmount,
    remainingAmount,
    depositPaid: booking.depositPaid,
    remainingPaid: booking.remainingPaid,
    cashAmount: booking.cashAmount,
  });
  const depositSettled = paymentBreakdown.depositAmount <= 0;
  const remainingSettled = paymentBreakdown.remainingAmount <= 0;

  const raw: Array<{ key: ClientPortalTimelineMilestoneKey; done: boolean; date: Date | null }> = [
    { key: 'booking_created', done: true, date: booking.createdAt },
    { key: 'proposal_sent', done: !!latestProposal, date: latestProposal?.createdAt ?? null },
    { key: 'contract_signed', done: !!contractSignedAt, date: contractSignedAt },
    { key: 'deposit_paid', done: depositSettled, date: booking.depositPaidAt },
    { key: 'event', done: eventPast, date: booking.eventDate },
    { key: 'remaining_paid', done: remainingSettled, date: booking.remainingPaidAt },
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
