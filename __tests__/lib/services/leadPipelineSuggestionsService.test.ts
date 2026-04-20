import { describe, it, expect } from 'vitest';
import {
  generatePipelineSuggestions,
  type PipelineSuggestionsInput,
} from '@/lib/services/leadPipelineSuggestionsService';

const NOW = new Date('2026-06-15T14:00:00Z');
const HOURS_AGO = (h: number) => new Date(NOW.getTime() - h * 3600000);
const DAYS_AGO = (d: number) => new Date(NOW.getTime() - d * 86400000);
const DAYS_AHEAD = (d: number) => new Date(NOW.getTime() + d * 86400000);

type Lead = PipelineSuggestionsInput['leads'][number];

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'l1',
    name: 'Maria',
    status: 'CONTACTED',
    priority: 'MEDIUM',
    createdAt: DAYS_AGO(5),
    contactedAt: DAYS_AGO(4),
    updatedAt: DAYS_AGO(2),
    eventDate: DAYS_AHEAD(60),
    guestCount: 100,
    budget: '3000',
    hasBooking: false,
    lastActivityAt: DAYS_AGO(2),
    nurturingStep: 1,
    ...overrides,
  };
}

function makeInput(leads: Lead[], recentWonCount = 0): PipelineSuggestionsInput {
  return { leads, recentWonCount, now: NOW };
}

describe('generatePipelineSuggestions', () => {
  describe('HOT_UNCONTACTED', () => {
    it('detecta leads NEW sense contactar fa >4h', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ id: 'l1', status: 'NEW', createdAt: HOURS_AGO(6), contactedAt: null }),
      ]));
      const s = result.find((r) => r.type === 'HOT_UNCONTACTED');
      expect(s).toBeDefined();
      expect(s!.priority).toBe('CRITICAL');
      expect(s!.count).toBe(1);
    });

    it('no detecta si ja s\'ha contactat', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'NEW', createdAt: HOURS_AGO(6), contactedAt: HOURS_AGO(2) }),
      ]));
      expect(result.find((r) => r.type === 'HOT_UNCONTACTED')).toBeUndefined();
    });

    it('no detecta si fa menys de 4h', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'NEW', createdAt: HOURS_AGO(2), contactedAt: null }),
      ]));
      expect(result.find((r) => r.type === 'HOT_UNCONTACTED')).toBeUndefined();
    });
  });

  describe('STALE_NEGOTIATION', () => {
    it('detecta negociacions estancades >5d', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'NEGOTIATING', lastActivityAt: DAYS_AGO(7) }),
      ]));
      const s = result.find((r) => r.type === 'STALE_NEGOTIATION');
      expect(s).toBeDefined();
      expect(s!.priority).toBe('HIGH');
    });

    it('no detecta si activitat recent', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'NEGOTIATING', lastActivityAt: DAYS_AGO(2) }),
      ]));
      expect(result.find((r) => r.type === 'STALE_NEGOTIATION')).toBeUndefined();
    });
  });

  describe('QUOTE_NO_REPLY', () => {
    it('detecta pressupostos sense resposta >3d', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'QUOTE_SENT', lastActivityAt: DAYS_AGO(4) }),
      ]));
      const s = result.find((r) => r.type === 'QUOTE_NO_REPLY');
      expect(s).toBeDefined();
      expect(s!.count).toBe(1);
    });

    it('no detecta si recent', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'QUOTE_SENT', lastActivityAt: DAYS_AGO(1) }),
      ]));
      expect(result.find((r) => r.type === 'QUOTE_NO_REPLY')).toBeUndefined();
    });
  });

  describe('EVENT_SOON_NO_BOOKING', () => {
    it('detecta events en <30d sense booking', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ eventDate: DAYS_AHEAD(15), hasBooking: false }),
      ]));
      const s = result.find((r) => r.type === 'EVENT_SOON_NO_BOOKING');
      expect(s).toBeDefined();
    });

    it('CRITICAL si ≤14d', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ eventDate: DAYS_AHEAD(10), hasBooking: false }),
      ]));
      const s = result.find((r) => r.type === 'EVENT_SOON_NO_BOOKING');
      expect(s!.priority).toBe('CRITICAL');
    });

    it('HIGH si 15-30d', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ eventDate: DAYS_AHEAD(20), hasBooking: false }),
      ]));
      const s = result.find((r) => r.type === 'EVENT_SOON_NO_BOOKING');
      expect(s!.priority).toBe('HIGH');
    });

    it('no detecta si té booking', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ eventDate: DAYS_AHEAD(10), hasBooking: true }),
      ]));
      expect(result.find((r) => r.type === 'EVENT_SOON_NO_BOOKING')).toBeUndefined();
    });

    it('no detecta si event >30d', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ eventDate: DAYS_AHEAD(45), hasBooking: false }),
      ]));
      expect(result.find((r) => r.type === 'EVENT_SOON_NO_BOOKING')).toBeUndefined();
    });

    it('no detecta si lead LOST', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'LOST', eventDate: DAYS_AHEAD(10), hasBooking: false }),
      ]));
      expect(result.find((r) => r.type === 'EVENT_SOON_NO_BOOKING')).toBeUndefined();
    });
  });

  describe('HIGH_VALUE_IDLE', () => {
    it('detecta leads >2000€ inactius >3d', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ budget: '3500', lastActivityAt: DAYS_AGO(5) }),
      ]));
      const s = result.find((r) => r.type === 'HIGH_VALUE_IDLE');
      expect(s).toBeDefined();
    });

    it('no detecta si budget baix', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ budget: '500', lastActivityAt: DAYS_AGO(5) }),
      ]));
      expect(result.find((r) => r.type === 'HIGH_VALUE_IDLE')).toBeUndefined();
    });

    it('no detecta si activitat recent', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ budget: '3500', lastActivityAt: DAYS_AGO(1) }),
      ]));
      expect(result.find((r) => r.type === 'HIGH_VALUE_IDLE')).toBeUndefined();
    });

    it('no detecta leads LOST', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ status: 'LOST', budget: '5000', lastActivityAt: DAYS_AGO(10) }),
      ]));
      expect(result.find((r) => r.type === 'HIGH_VALUE_IDLE')).toBeUndefined();
    });
  });

  describe('BULK_NEW_LEADS', () => {
    it('detecta ≥5 leads NEW d\'avui', () => {
      const leads = Array.from({ length: 6 }, (_, i) =>
        makeLead({ id: `l${i}`, status: 'NEW', createdAt: HOURS_AGO(2), contactedAt: HOURS_AGO(1) })
      );
      const result = generatePipelineSuggestions(makeInput(leads));
      const s = result.find((r) => r.type === 'BULK_NEW_LEADS');
      expect(s).toBeDefined();
      expect(s!.count).toBe(6);
    });

    it('no detecta si menys de 5', () => {
      const leads = Array.from({ length: 3 }, (_, i) =>
        makeLead({ id: `l${i}`, status: 'NEW', createdAt: HOURS_AGO(2) })
      );
      const result = generatePipelineSuggestions(makeInput(leads));
      expect(result.find((r) => r.type === 'BULK_NEW_LEADS')).toBeUndefined();
    });
  });

  describe('WINNING_STREAK', () => {
    it('detecta ≥3 WON en 7d', () => {
      const result = generatePipelineSuggestions(makeInput([], 4));
      const s = result.find((r) => r.type === 'WINNING_STREAK');
      expect(s).toBeDefined();
      expect(s!.priority).toBe('INFO');
    });

    it('no detecta si <3', () => {
      const result = generatePipelineSuggestions(makeInput([], 2));
      expect(result.find((r) => r.type === 'WINNING_STREAK')).toBeUndefined();
    });
  });

  describe('ordenació', () => {
    it('CRITICAL va primer', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ id: 'neg', status: 'NEGOTIATING', lastActivityAt: DAYS_AGO(7) }),
        makeLead({ id: 'new', status: 'NEW', createdAt: HOURS_AGO(8), contactedAt: null }),
      ]));
      expect(result[0].priority).toBe('CRITICAL');
    });
  });

  describe('edge cases', () => {
    it('retorna buit amb 0 leads', () => {
      const result = generatePipelineSuggestions(makeInput([]));
      expect(result).toEqual([]);
    });

    it('budget amb format estrany', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ budget: '2.500,00€', lastActivityAt: DAYS_AGO(5) }),
      ]));
      const s = result.find((r) => r.type === 'HIGH_VALUE_IDLE');
      expect(s).toBeDefined();
    });

    it('budget null no fa match HIGH_VALUE', () => {
      const result = generatePipelineSuggestions(makeInput([
        makeLead({ budget: null, lastActivityAt: DAYS_AGO(5) }),
      ]));
      expect(result.find((r) => r.type === 'HIGH_VALUE_IDLE')).toBeUndefined();
    });
  });
});
