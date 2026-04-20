import { describe, it, expect } from 'vitest';
import {
  generateReengagementCandidates,
  type ReengagementInput,
  type ReengagementLeadInput,
} from '@/lib/services/leadReengagementService';

const NOW = new Date('2026-04-10T12:00:00.000Z');

function makeLead(overrides: Partial<ReengagementLeadInput> = {}): ReengagementLeadInput {
  return {
    id: 'lead-1',
    name: 'Anna Garcia',
    email: 'anna@example.com',
    phone: '+34600111222',
    status: 'NEW',
    priority: 'MEDIUM',
    eventType: 'BIRTHDAY',
    eventDate: null,
    eventLocation: null,
    budget: null,
    preferredLocale: 'ca',
    createdAt: new Date('2026-03-20T12:00:00.000Z'),
    updatedAt: new Date('2026-03-20T12:00:00.000Z'),
    contactedAt: null,
    lastActivityAt: null,
    ...overrides,
  };
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

describe('generateReengagementCandidates', () => {
  it('returns empty array for empty input', () => {
    const result = generateReengagementCandidates({ leads: [], now: NOW });
    expect(result).toEqual([]);
  });

  it('excludes WON leads', () => {
    const lead = makeLead({ status: 'WON', updatedAt: daysAgo(10) });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(0);
  });

  it('excludes LOST leads', () => {
    const lead = makeLead({ status: 'LOST', updatedAt: daysAgo(10) });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(0);
  });

  it('excludes leads stale more than 90 days', () => {
    const lead = makeLead({
      updatedAt: daysAgo(100),
      contactedAt: daysAgo(100),
      lastActivityAt: daysAgo(100),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(0);
  });

  it('classifies UPCOMING_EVENT with priority ALTA', () => {
    const lead = makeLead({
      eventDate: daysFromNow(20),
      updatedAt: daysAgo(5),
      lastActivityAt: daysAgo(5),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('UPCOMING_EVENT');
    expect(result[0].reengagementPriority).toBe('ALTA');
    expect(result[0].daysUntilEvent).toBe(20);
  });

  it('does NOT classify UPCOMING_EVENT if event passed', () => {
    const lead = makeLead({
      eventDate: daysAgo(5),
      updatedAt: daysAgo(25),
      lastActivityAt: daysAgo(25),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    // Should fall through to LONG_DORMANT
    expect(result).toHaveLength(1);
    expect(result[0].reason).not.toBe('UPCOMING_EVENT');
    expect(result[0].reason).toBe('LONG_DORMANT');
  });

  it('classifies HOT_STALE for HIGH priority leads stale 3+ days', () => {
    const lead = makeLead({
      priority: 'HIGH',
      updatedAt: daysAgo(5),
      lastActivityAt: daysAgo(5),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('HOT_STALE');
    expect(result[0].reengagementPriority).toBe('ALTA');
  });

  it('classifies HOT_STALE for URGENT priority leads', () => {
    const lead = makeLead({
      priority: 'URGENT',
      updatedAt: daysAgo(4),
      lastActivityAt: daysAgo(4),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].reason).toBe('HOT_STALE');
  });

  it('classifies QUOTE_NO_REPLY for QUOTE_SENT stale 6+ days', () => {
    const lead = makeLead({
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('QUOTE_NO_REPLY');
    expect(result[0].reengagementPriority).toBe('ALTA');
  });

  it('classifies NEGOTIATION_COLD for NEGOTIATING stale 5+ days', () => {
    const lead = makeLead({
      status: 'NEGOTIATING',
      updatedAt: daysAgo(7),
      lastActivityAt: daysAgo(7),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('NEGOTIATION_COLD');
    expect(result[0].reengagementPriority).toBe('MITJANA');
  });

  it('classifies EARLY_SILENCE for CONTACTED with 4+ days silence', () => {
    const lead = makeLead({
      status: 'CONTACTED',
      contactedAt: daysAgo(6),
      updatedAt: daysAgo(6),
      lastActivityAt: daysAgo(6),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('EARLY_SILENCE');
  });

  it('classifies LONG_DORMANT as last resort', () => {
    const lead = makeLead({
      status: 'NEW',
      updatedAt: daysAgo(25),
      lastActivityAt: daysAgo(25),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe('LONG_DORMANT');
    expect(result[0].reengagementPriority).toBe('BAIXA');
  });

  it('sorts candidates by score descending', () => {
    const leads: ReengagementLeadInput[] = [
      makeLead({ id: 'l1', status: 'NEW', updatedAt: daysAgo(25), lastActivityAt: daysAgo(25) }), // LONG_DORMANT (30)
      makeLead({
        id: 'l2',
        status: 'QUOTE_SENT',
        updatedAt: daysAgo(7),
        lastActivityAt: daysAgo(7),
      }), // QUOTE_NO_REPLY (~73)
      makeLead({
        id: 'l3',
        eventDate: daysFromNow(15),
        updatedAt: daysAgo(5),
        lastActivityAt: daysAgo(5),
      }), // UPCOMING_EVENT (~85)
    ];
    const result = generateReengagementCandidates({ leads, now: NOW });
    expect(result).toHaveLength(3);
    expect(result[0].leadId).toBe('l3'); // UPCOMING_EVENT wins
    expect(result[1].leadId).toBe('l2');
    expect(result[2].leadId).toBe('l1');
  });

  it('uses Catalan templates when preferredLocale is ca', () => {
    const lead = makeLead({
      preferredLocale: 'ca',
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].suggestedSubject).toContain('pressupost');
  });

  it('uses Spanish templates when preferredLocale is es', () => {
    const lead = makeLead({
      preferredLocale: 'es',
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].suggestedSubject).toContain('presupuesto');
  });

  it('falls back to Spanish for unknown locale', () => {
    const lead = makeLead({
      preferredLocale: 'fr',
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].suggestedSubject).toContain('presupuesto');
  });

  it('includes whatsapp channel when phone present', () => {
    const lead = makeLead({
      phone: '+34600111222',
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].suggestedChannels).toContain('whatsapp');
    expect(result[0].whatsappUrl).toMatch(/^https:\/\/wa\.me\/34600111222/);
  });

  it('omits whatsapp channel when phone missing', () => {
    const lead = makeLead({
      phone: null,
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].suggestedChannels).not.toContain('whatsapp');
    expect(result[0].whatsappUrl).toBeNull();
  });

  it('always includes email channel with valid mailto', () => {
    const lead = makeLead({
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].suggestedChannels).toContain('email');
    expect(result[0].mailtoUrl).toMatch(/^mailto:anna@example\.com\?/);
  });

  it('computes daysSinceCreation correctly', () => {
    const lead = makeLead({
      createdAt: daysAgo(15),
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].daysSinceCreation).toBe(15);
  });

  it('uses first name in message body', () => {
    const lead = makeLead({
      name: 'Anna Garcia Martí',
      status: 'QUOTE_SENT',
      updatedAt: daysAgo(8),
      lastActivityAt: daysAgo(8),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].suggestedMessage).toContain('Anna');
    expect(result[0].suggestedMessage).not.toContain('Anna Garcia Martí');
  });

  it('returns reasonLabel in Catalan for each reason', () => {
    const lead = makeLead({
      priority: 'HIGH',
      updatedAt: daysAgo(5),
      lastActivityAt: daysAgo(5),
    });
    const result = generateReengagementCandidates({ leads: [lead], now: NOW });
    expect(result[0].reasonLabel).toBe('Calent refredant');
  });
});
