import { describe, it, expect } from 'vitest';
import {
  buildClientPortalTimelinePath,
  getClientPortalTimeline,
  PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS,
  type ClientPortalTimelineBooking,
  type ClientPortalTimelineProposal,
} from '@/lib/clientPortalTimeline';
import { CLIENT_PORTAL_MESSAGES, type ClientPortalLocale } from '@/lib/clientPortalMessages';

const NOW = new Date('2026-05-16T12:00:00Z');
const PAST = new Date('2026-01-10T10:00:00Z');
const FUTURE = new Date('2026-12-31T20:00:00Z');

function makeBooking(overrides: Partial<ClientPortalTimelineBooking> = {}): ClientPortalTimelineBooking {
  return {
    createdAt: PAST,
    eventDate: FUTURE,
    total: 1000,
    depositAmount: 300,
    depositPaid: false,
    depositPaidAt: null,
    remainingAmount: 700,
    remainingPaid: false,
    remainingPaidAt: null,
    cashAmount: null,
    ...overrides,
  };
}

function makeProposal(overrides: Partial<ClientPortalTimelineProposal> = {}): ClientPortalTimelineProposal {
  return {
    createdAt: new Date('2026-02-01T10:00:00Z'),
    contractSignedAt: null,
    ...overrides,
  };
}

describe('buildClientPortalTimelinePath', () => {
  it('construeix la ruta correcta', () => {
    expect(buildClientPortalTimelinePath('ca', 'abc123')).toBe('/ca/portal/abc123/timeline');
    expect(buildClientPortalTimelinePath('en', 'xyz')).toBe('/en/portal/xyz/timeline');
  });
});

describe('getClientPortalTimeline', () => {
  it('manté totes les claus produïdes mapades a textos del portal', () => {
    const milestones = getClientPortalTimeline(makeBooking(), [], NOW);
    const locales: ClientPortalLocale[] = ['ca', 'es', 'en'];

    expect(milestones.map((milestone) => milestone.key)).toEqual(
      Object.keys(PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS),
    );

    Object.values(PORTAL_TIMELINE_MILESTONE_MESSAGE_KEYS).forEach((messageKey) => {
      locales.forEach((locale) => {
        expect(CLIENT_PORTAL_MESSAGES[locale][messageKey]).toBeTruthy();
      });
    });
  });

  it('reserva nova sense proposta: booking_created done, proposal_sent upcoming, resta future', () => {
    const milestones = getClientPortalTimeline(makeBooking(), [], NOW);
    expect(milestones[0]).toEqual({ key: 'booking_created', status: 'done', date: PAST });
    expect(milestones[1]).toEqual({ key: 'proposal_sent', status: 'upcoming', date: null });
    expect(milestones[2].status).toBe('future');
    expect(milestones[3].status).toBe('future');
    expect(milestones[4].status).toBe('future');
    expect(milestones[5].status).toBe('future');
  });

  it('proposta enviada, contracte no signat: contract_signed upcoming', () => {
    const milestones = getClientPortalTimeline(makeBooking(), [makeProposal()], NOW);
    expect(milestones[0].status).toBe('done');
    expect(milestones[1].status).toBe('done');
    expect(milestones[2]).toMatchObject({ key: 'contract_signed', status: 'upcoming' });
    expect(milestones[3].status).toBe('future');
  });

  it('contracte signat, dipòsit no pagat: deposit_paid upcoming', () => {
    const signedAt = new Date('2026-02-15T10:00:00Z');
    const milestones = getClientPortalTimeline(
      makeBooking(),
      [makeProposal({ contractSignedAt: signedAt })],
      NOW,
    );
    expect(milestones[2]).toMatchObject({ key: 'contract_signed', status: 'done', date: signedAt });
    expect(milestones[3]).toMatchObject({ key: 'deposit_paid', status: 'upcoming' });
    expect(milestones[4].status).toBe('future');
  });

  it('dipòsit pagat, event futur: event upcoming', () => {
    const depositPaidAt = new Date('2026-03-01T10:00:00Z');
    const milestones = getClientPortalTimeline(
      makeBooking({ depositPaid: true, depositPaidAt }),
      [makeProposal({ contractSignedAt: new Date('2026-02-15T10:00:00Z') })],
      NOW,
    );
    expect(milestones[3]).toMatchObject({ key: 'deposit_paid', status: 'done', date: depositPaidAt });
    expect(milestones[4]).toMatchObject({ key: 'event', status: 'upcoming' });
    expect(milestones[5].status).toBe('future');
  });

  it('marca el dipòsit fet si cashAmount cobreix la bestreta encara que el flag sigui fals', () => {
    const milestones = getClientPortalTimeline(
      makeBooking({ cashAmount: 300 }),
      [makeProposal({ contractSignedAt: new Date('2026-02-15T10:00:00Z') })],
      NOW,
    );

    expect(milestones[3]).toEqual({ key: 'deposit_paid', status: 'done', date: null });
    expect(milestones[4]).toMatchObject({ key: 'event', status: 'upcoming' });
    expect(milestones[5]).toMatchObject({ key: 'remaining_paid', status: 'future' });
  });

  it('event passat, resta no pagada: remaining_paid upcoming', () => {
    const milestones = getClientPortalTimeline(
      makeBooking({ depositPaid: true, depositPaidAt: new Date('2026-03-01T10:00:00Z'), eventDate: PAST }),
      [makeProposal({ contractSignedAt: new Date('2026-02-15T10:00:00Z') })],
      NOW,
    );
    expect(milestones[4]).toMatchObject({ key: 'event', status: 'done' });
    expect(milestones[5]).toMatchObject({ key: 'remaining_paid', status: 'upcoming' });
  });

  it('tot pagat i event passat: tots done', () => {
    const remainingPaidAt = new Date('2026-01-20T10:00:00Z');
    const milestones = getClientPortalTimeline(
      makeBooking({
        depositPaid: true,
        depositPaidAt: new Date('2026-01-15T10:00:00Z'),
        remainingPaid: true,
        remainingPaidAt,
        eventDate: PAST,
      }),
      [makeProposal({ contractSignedAt: new Date('2026-01-12T10:00:00Z') })],
      NOW,
    );
    expect(milestones.every((m) => m.status === 'done')).toBe(true);
    expect(milestones[5]).toMatchObject({ key: 'remaining_paid', status: 'done', date: remainingPaidAt });
  });

  it('marca tots els pagaments fets si cashAmount cobreix el total encara que els flags siguin falsos', () => {
    const milestones = getClientPortalTimeline(
      makeBooking({ cashAmount: 1000, eventDate: PAST }),
      [makeProposal({ contractSignedAt: new Date('2026-01-12T10:00:00Z') })],
      NOW,
    );

    expect(milestones.every((m) => m.status === 'done')).toBe(true);
    expect(milestones[3]).toEqual({ key: 'deposit_paid', status: 'done', date: null });
    expect(milestones[5]).toEqual({ key: 'remaining_paid', status: 'done', date: null });
  });
});
