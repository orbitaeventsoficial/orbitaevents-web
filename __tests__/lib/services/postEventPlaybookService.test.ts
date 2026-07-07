import { describe, it, expect } from 'vitest';
import {
  buildPostEventPlaybook,
  type PlaybookBookingInput,
} from '@/lib/services/postEventPlaybookService';

const NOW = new Date('2026-04-10T12:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function makeBooking(overrides: Partial<PlaybookBookingInput> = {}): PlaybookBookingInput {
  return {
    id: 'b1',
    reference: 'OE-2026-001',
    clientName: 'Anna Garcia',
    customerId: 'c1',
    eventDate: daysAgo(5),
    eventType: 'BIRTHDAY',
    eventLocation: 'Barcelona',
    postEventEmailSent: false,
    postEventEmailSentAt: null,
    hasTestimonial: false,
    hasTestimonialAskDecision: false,
    hasPublishedSocialPost: false,
    hasSocialPostDecision: false,
    hasReferralAskTask: false,
    ...overrides,
  };
}

describe('buildPostEventPlaybook', () => {
  it('returns empty summary for empty input', () => {
    const result = buildPostEventPlaybook({ bookings: [], now: NOW });
    expect(result.totalBookings).toBe(0);
    expect(result.items).toEqual([]);
    expect(result.overallProgress).toBe(100);
    expect(result.fullyCompleted).toBe(0);
  });

  it('marks all actions DONE when booking fully completed', () => {
    const booking = makeBooking({
      postEventEmailSent: true,
      postEventEmailSentAt: daysAgo(3),
      hasTestimonial: true,
      hasPublishedSocialPost: true,
      hasReferralAskTask: true,
    });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].progress).toBe(100);
    expect(result.items[0].priority).toBe('DONE');
    expect(result.items[0].nextAction).toBeNull();
    expect(result.fullyCompleted).toBe(1);
    expect(result.items[0].actions.every((a) => a.status === 'DONE')).toBe(true);
  });

  it('marks thank_you as PENDING when within due window', () => {
    const booking = makeBooking({ eventDate: daysAgo(2) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const thankYou = result.items[0].actions.find((a) => a.key === 'thank_you')!;
    expect(thankYou.status).toBe('PENDING');
  });

  it('marks thank_you as OVERDUE when beyond due window', () => {
    const booking = makeBooking({ eventDate: daysAgo(10) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const thankYou = result.items[0].actions.find((a) => a.key === 'thank_you')!;
    expect(thankYou.status).toBe('OVERDUE');
  });

  it('marks social_post as PENDING until 14 days past event', () => {
    const booking = makeBooking({ eventDate: daysAgo(10) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const social = result.items[0].actions.find((a) => a.key === 'social_post')!;
    expect(social.status).toBe('PENDING');
  });

  it('mostra social preparat sense marcar-lo publicat', () => {
    const booking = makeBooking({
      eventDate: daysAgo(10),
      hasPublishedSocialPost: false,
      hasSocialPostDecision: true,
      socialPostId: 'social-1',
    });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const social = result.items[0].actions.find((a) => a.key === 'social_post')!;

    expect(social.status).toBe('PENDING');
    expect(social.note).toBe('Preparat, no publicat');
    expect(social.socialPostId).toBe('social-1');
  });

  it('prioritza Publicat sobre Preparat si el social ja existeix', () => {
    const booking = makeBooking({
      hasPublishedSocialPost: true,
      hasSocialPostDecision: true,
    });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const social = result.items[0].actions.find((a) => a.key === 'social_post')!;

    expect(social.status).toBe('DONE');
    expect(social.note).toBe('Publicat');
  });

  it('marks social_post as OVERDUE after 14 days', () => {
    const booking = makeBooking({ eventDate: daysAgo(20) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const social = result.items[0].actions.find((a) => a.key === 'social_post')!;
    expect(social.status).toBe('OVERDUE');
  });

  it('marks referral_ask as NOT_APPLICABLE when no customerId', () => {
    const booking = makeBooking({ customerId: null, eventDate: daysAgo(40) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const referral = result.items[0].actions.find((a) => a.key === 'referral_ask')!;
    expect(referral.status).toBe('NOT_APPLICABLE');
  });

  it('excludes NOT_APPLICABLE actions from progress calculation', () => {
    const booking = makeBooking({
      customerId: null,
      eventDate: daysAgo(1),
      postEventEmailSent: true,
      hasTestimonial: true,
      hasPublishedSocialPost: true,
    });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    // 3 of 3 applicable actions done, referral_ask NOT_APPLICABLE
    expect(result.items[0].progress).toBe(100);
    expect(result.items[0].totalCount).toBe(3);
    expect(result.items[0].completedCount).toBe(3);
  });

  it('assigns ALTA priority when 2+ actions overdue', () => {
    const booking = makeBooking({ eventDate: daysAgo(30) }); // all 4 would be overdue except referral (30d due)
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].priority).toBe('ALTA');
  });

  it('assigns MITJANA priority when exactly 1 overdue', () => {
    // eventDate 5 days ago: thank_you overdue (due=3), others pending
    const booking = makeBooking({ eventDate: daysAgo(5) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].priority).toBe('MITJANA');
  });

  it('assigns BAIXA priority when no overdue but pending', () => {
    const booking = makeBooking({ eventDate: daysAgo(2) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].priority).toBe('BAIXA');
  });

  it('returns nextAction as first non-DONE action', () => {
    const booking = makeBooking({
      eventDate: daysAgo(5),
      postEventEmailSent: true,
      postEventEmailSentAt: daysAgo(4),
    });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].nextAction?.key).toBe('testimonial');
  });

  it('marca testimoni com sol.licitat quan hi ha decisio registrada', () => {
    const booking = makeBooking({
      postEventEmailSent: true,
      postEventEmailSentAt: daysAgo(1),
      hasTestimonial: false,
      hasTestimonialAskDecision: true,
    });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const testimonial = result.items[0].actions.find((a) => a.key === 'testimonial')!;

    expect(testimonial.status).toBe('DONE');
    expect(testimonial.note).toBe('Sol.licitat');
    expect(result.items[0].nextAction?.key).toBe('social_post');
  });

  it('prioritza Rebut sobre Sol.licitat si ja hi ha testimoni aprovat', () => {
    const booking = makeBooking({
      hasTestimonial: true,
      hasTestimonialAskDecision: true,
    });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const testimonial = result.items[0].actions.find((a) => a.key === 'testimonial')!;

    expect(testimonial.status).toBe('DONE');
    expect(testimonial.note).toBe('Rebut');
  });

  it('sorts items by priority then by daysSinceEvent desc', () => {
    const bookings: PlaybookBookingInput[] = [
      makeBooking({ id: 'b1', eventDate: daysAgo(2) }), // BAIXA
      makeBooking({ id: 'b2', eventDate: daysAgo(30) }), // ALTA (multiple overdue)
      makeBooking({ id: 'b3', eventDate: daysAgo(5) }), // MITJANA (1 overdue)
    ];
    const result = buildPostEventPlaybook({ bookings, now: NOW });
    expect(result.items.map((i) => i.bookingId)).toEqual(['b2', 'b3', 'b1']);
  });

  it('counts fullyCompleted bookings', () => {
    const bookings: PlaybookBookingInput[] = [
      makeBooking({
        id: 'b1',
        postEventEmailSent: true,
        hasTestimonial: true,
        hasPublishedSocialPost: true,
        hasReferralAskTask: true,
      }),
      makeBooking({ id: 'b2' }),
    ];
    const result = buildPostEventPlaybook({ bookings, now: NOW });
    expect(result.fullyCompleted).toBe(1);
  });

  it('counts withOverdue bookings', () => {
    const bookings: PlaybookBookingInput[] = [
      makeBooking({ id: 'b1', eventDate: daysAgo(30) }),
      makeBooking({ id: 'b2', eventDate: daysAgo(2) }),
    ];
    const result = buildPostEventPlaybook({ bookings, now: NOW });
    expect(result.withOverdue).toBe(1);
  });

  it('counts pendingActionsTotal across all bookings', () => {
    const bookings: PlaybookBookingInput[] = [
      // 2 days ago: 4 pending (no overdue yet)
      makeBooking({ id: 'b1', eventDate: daysAgo(2) }),
      // fully done: 0 pending
      makeBooking({
        id: 'b2',
        postEventEmailSent: true,
        hasTestimonial: true,
        hasPublishedSocialPost: true,
        hasReferralAskTask: true,
      }),
    ];
    const result = buildPostEventPlaybook({ bookings, now: NOW });
    expect(result.pendingActionsTotal).toBe(4);
  });

  it('computes overallProgress as average of items', () => {
    const bookings: PlaybookBookingInput[] = [
      // 100% done
      makeBooking({
        id: 'b1',
        postEventEmailSent: true,
        hasTestimonial: true,
        hasPublishedSocialPost: true,
        hasReferralAskTask: true,
      }),
      // 0% done
      makeBooking({ id: 'b2', eventDate: daysAgo(2) }),
    ];
    const result = buildPostEventPlaybook({ bookings, now: NOW });
    expect(result.overallProgress).toBe(50);
  });

  it('computes daysSinceEvent correctly', () => {
    const booking = makeBooking({ eventDate: daysAgo(12) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].daysSinceEvent).toBe(12);
  });

  it('clamps daysSinceEvent to 0 for future events', () => {
    const booking = makeBooking({ eventDate: new Date(NOW.getTime() + 24 * 60 * 60 * 1000) });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].daysSinceEvent).toBe(0);
  });

  it('includes referral_ask note when completed', () => {
    const booking = makeBooking({ hasReferralAskTask: true });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    const referral = result.items[0].actions.find((a) => a.key === 'referral_ask')!;
    expect(referral.status).toBe('DONE');
    expect(referral.note).toBe('Programat');
  });

  it('returns 4 actions per booking with customerId', () => {
    const booking = makeBooking();
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].actions).toHaveLength(4);
  });

  it('returns 4 actions (referral_ask NOT_APPLICABLE) per booking without customerId', () => {
    const booking = makeBooking({ customerId: null });
    const result = buildPostEventPlaybook({ bookings: [booking], now: NOW });
    expect(result.items[0].actions).toHaveLength(4);
    expect(result.items[0].actions.find((a) => a.key === 'referral_ask')?.status).toBe(
      'NOT_APPLICABLE'
    );
  });
});
