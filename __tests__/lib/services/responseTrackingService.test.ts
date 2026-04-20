import { describe, it, expect } from 'vitest';
import {
  detectPendingFollowUps,
  type ResponseTrackingInput,
  type FollowUpUrgency,
} from '@/lib/services/responseTrackingService';

const NOW = new Date('2026-06-15T10:00:00Z');
const DAYS = (n: number) => new Date(NOW.getTime() - n * 86400000);

function makeLead(overrides: Partial<ResponseTrackingInput['leads'][number]> = {}): ResponseTrackingInput['leads'][number] {
  return {
    id: 'l1',
    name: 'Maria Garcia',
    email: 'maria@test.com',
    phone: '+34600000000',
    eventType: 'WEDDING',
    status: 'CONTACTED',
    preferredLocale: 'ca',
    contactedAt: DAYS(3),
    lastOutboundAt: DAYS(3),
    outboundCount: 1,
    lastInboundAt: null,
    ...overrides,
  };
}

describe('detectPendingFollowUps', () => {
  it('detecta lead contactat sense resposta', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead()],
      now: NOW,
    });
    expect(result.total).toBe(1);
    expect(result.items[0].daysSinceOutbound).toBe(3);
  });

  it('exclou leads amb resposta inbound posterior', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastInboundAt: DAYS(1) })],
      now: NOW,
    });
    expect(result.total).toBe(0);
  });

  it('no exclou si inbound és anterior a outbound', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: DAYS(2), lastInboundAt: DAYS(4) })],
      now: NOW,
    });
    expect(result.total).toBe(1);
  });

  it('exclou leads sense contactedAt', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ contactedAt: null, lastOutboundAt: DAYS(3) })],
      now: NOW,
    });
    expect(result.total).toBe(0);
  });

  it('exclou leads sense lastOutboundAt', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: null })],
      now: NOW,
    });
    expect(result.total).toBe(0);
  });

  it('exclou leads contactats fa menys d\'1 dia', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: new Date(NOW.getTime() - 12 * 3600000) })],
      now: NOW,
    });
    expect(result.total).toBe(0);
  });

  it('classifica URGENT si >= 5 dies', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: DAYS(7) })],
      now: NOW,
    });
    expect(result.items[0].urgency).toBe('URGENT');
  });

  it('classifica NORMAL si 2-4 dies', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: DAYS(3) })],
      now: NOW,
    });
    expect(result.items[0].urgency).toBe('NORMAL');
  });

  it('classifica LOW si 1 dia', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: DAYS(1) })],
      now: NOW,
    });
    expect(result.items[0].urgency).toBe('LOW');
  });

  it('ordena per urgència i dies', () => {
    const result = detectPendingFollowUps({
      leads: [
        makeLead({ id: 'low', lastOutboundAt: DAYS(1) }),
        makeLead({ id: 'urgent', lastOutboundAt: DAYS(7) }),
        makeLead({ id: 'normal', lastOutboundAt: DAYS(3) }),
      ],
      now: NOW,
    });
    expect(result.items.map((i) => i.leadId)).toEqual(['urgent', 'normal', 'low']);
  });

  it('compta correctament per urgència', () => {
    const result = detectPendingFollowUps({
      leads: [
        makeLead({ id: 'u1', lastOutboundAt: DAYS(6) }),
        makeLead({ id: 'u2', lastOutboundAt: DAYS(5) }),
        makeLead({ id: 'n1', lastOutboundAt: DAYS(3) }),
        makeLead({ id: 'l1', lastOutboundAt: DAYS(1) }),
      ],
      now: NOW,
    });
    expect(result.urgent).toBe(2);
    expect(result.normal).toBe(1);
    expect(result.low).toBe(1);
    expect(result.total).toBe(4);
  });

  it('suggereix acció en català', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: DAYS(6), preferredLocale: 'ca' })],
      now: NOW,
    });
    expect(result.items[0].suggestedAction).toContain('Trucar');
  });

  it('suggereix acció en castellà', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead({ lastOutboundAt: DAYS(6), preferredLocale: 'es' })],
      now: NOW,
    });
    expect(result.items[0].suggestedAction).toContain('Llamar');
  });

  it('preserva dades del lead', () => {
    const result = detectPendingFollowUps({
      leads: [makeLead()],
      now: NOW,
    });
    const item = result.items[0];
    expect(item.name).toBe('Maria Garcia');
    expect(item.email).toBe('maria@test.com');
    expect(item.phone).toBe('+34600000000');
    expect(item.eventType).toBe('WEDDING');
    expect(item.outboundCount).toBe(1);
  });

  it('retorna llista buida si no hi ha leads', () => {
    const result = detectPendingFollowUps({ leads: [], now: NOW });
    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it('generatedAt conté la data correcta', () => {
    const result = detectPendingFollowUps({ leads: [], now: NOW });
    expect(result.generatedAt).toBe(NOW.toISOString());
  });

  it('múltiples leads amb diferent urgència', () => {
    const urgencies: FollowUpUrgency[] = [];
    const result = detectPendingFollowUps({
      leads: Array.from({ length: 10 }, (_, i) =>
        makeLead({ id: `l${i}`, lastOutboundAt: DAYS(i + 1) })
      ),
      now: NOW,
    });
    for (const item of result.items) {
      urgencies.push(item.urgency);
    }
    // Primers 6 (dies 10..5) → URGENT, 3 (dies 4..2) → NORMAL, 1 (dia 1) → LOW
    expect(urgencies.filter((u) => u === 'URGENT').length).toBe(6);
    expect(urgencies.filter((u) => u === 'NORMAL').length).toBe(3);
    expect(urgencies.filter((u) => u === 'LOW').length).toBe(1);
  });
});
