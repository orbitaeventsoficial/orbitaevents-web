import { describe, it, expect } from 'vitest';
import { computeLeadInsights } from '@/lib/services/leadInsightsService';

// ─── Helpers ────────────────────────────────────────────────────────────

const NOW = new Date('2026-04-09T12:00:00Z');

function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lead-1',
    status: 'CONTACTED',
    priority: 'MEDIUM',
    createdAt: new Date('2026-04-05T10:00:00Z'),
    updatedAt: new Date('2026-04-08T10:00:00Z'),
    contactedAt: new Date('2026-04-06T10:00:00Z'),
    convertedAt: null as Date | null,
    eventDate: new Date('2026-05-15T00:00:00Z'),
    eventType: 'WEDDING',
    budget: '2000',
    phone: '+34600111222',
    eventLocation: 'Barcelona',
    guestCount: 100,
    interestedPackId: 'pack-1',
    source: 'WEB',
    ...overrides,
  };
}

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    lead: makeLead(overrides),
    tasks: [] as Array<{ status: string; dueDate: Date | null; title: string }>,
    activities: [
      { createdAt: new Date('2026-04-08T10:00:00Z'), type: 'NOTE' },
    ] as Array<{ createdAt: Date; type: string }>,
    booking: null as { status: string; total: number | null; depositPaid: boolean | null; remainingPaid: boolean | null; depositAmount: number | null } | null,
    relatedLeads: [] as Array<{ status: string; booking: { total: number | null } | null }>,
    now: NOW,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('computeLeadInsights', () => {
  // ─── Score passthrough ────────────────────────────────────────────

  it('retorna score, band i probability de scoreLead', () => {
    const result = computeLeadInsights(makeInput());
    expect(result.score).toBeGreaterThan(0);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.scoreBand);
    expect(result.probability).toBeGreaterThan(0);
    expect(result.probability).toBeLessThanOrEqual(1);
  });

  // ─── Next action ──────────────────────────────────────────────────

  it('next action: NONE per leads tancats (WON)', () => {
    const input = makeInput({ status: 'WON', convertedAt: new Date() });
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('NONE');
  });

  it('next action: NONE per leads tancats (LOST)', () => {
    const input = makeInput({ status: 'LOST' });
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('NONE');
  });

  it('next action: COMPLETE_TASK si hi ha tasques vençudes', () => {
    const input = makeInput();
    input.tasks = [
      { status: 'TODO', dueDate: new Date('2026-04-01'), title: 'Trucar' },
    ];
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('COMPLETE_TASK');
    expect(result.nextAction.urgency).toBe('HIGH');
  });

  it('next action: CONTACT_NOW per lead NEW', () => {
    const input = makeInput({ status: 'NEW', contactedAt: null });
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('CONTACT_NOW');
  });

  it('next action: CONTACT_NOW urgent si >4h sense contactar', () => {
    const input = makeInput({
      status: 'NEW',
      contactedAt: null,
      createdAt: new Date('2026-04-09T06:00:00Z'),
    });
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('CONTACT_NOW');
    expect(result.nextAction.urgency).toBe('HIGH');
  });

  it('next action: COLLECT_PAYMENT si booking amb pagament pendent', () => {
    const input = makeInput({ status: 'WON', convertedAt: new Date() });
    // Override status back to non-closed for this test
    input.lead.status = 'CONTACTED';
    input.booking = {
      status: 'CONFIRMED',
      total: 3000,
      depositAmount: 1000,
      depositPaid: true,
      remainingPaid: false,
    };
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('COLLECT_PAYMENT');
  });

  it('next action: SEND_QUOTE per lead CONTACTED', () => {
    const result = computeLeadInsights(makeInput());
    expect(result.nextAction.type).toBe('SEND_QUOTE');
  });

  it('next action: FOLLOW_UP per lead QUOTE_SENT', () => {
    const input = makeInput({ status: 'QUOTE_SENT' });
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('FOLLOW_UP');
  });

  it('next action: CLOSE_DEAL per lead VISIT_DONE', () => {
    const input = makeInput({ status: 'VISIT_DONE' });
    const result = computeLeadInsights(input);
    expect(result.nextAction.type).toBe('CLOSE_DEAL');
  });

  // ─── Loss risk ────────────────────────────────────────────────────

  it('loss risk: NONE per leads WON', () => {
    const input = makeInput({ status: 'WON' });
    const result = computeLeadInsights(input);
    expect(result.lossRisk.level).toBe('NONE');
  });

  it('loss risk: inclou riskFlags del scoring', () => {
    const input = makeInput({ phone: null, budget: null });
    const result = computeLeadInsights(input);
    expect(result.lossRisk.reasons).toEqual(expect.arrayContaining([
      expect.stringContaining('telèfon'),
    ]));
  });

  it('loss risk: detecta inactivitat', () => {
    const input = makeInput();
    input.activities = [
      { createdAt: new Date('2026-03-25T10:00:00Z'), type: 'NOTE' },
    ];
    const result = computeLeadInsights(input);
    expect(result.lossRisk.reasons).toEqual(expect.arrayContaining([
      expect.stringContaining('activitat'),
    ]));
  });

  it('loss risk: detecta event proper sense confirmar', () => {
    const input = makeInput({ eventDate: new Date('2026-04-15T00:00:00Z') });
    const result = computeLeadInsights(input);
    expect(result.lossRisk.reasons).toEqual(expect.arrayContaining([
      expect.stringContaining('dies sense confirmar'),
    ]));
  });

  // Regressió directa: la regla "Més de 24h sense contactar" ha d'usar el `now`
  // injectat, no `new Date()`. Abans del fix, el clock real (que al running
  // test sempre queda molt més enllà del NOW simulat) feia disparar el reason
  // encara que el lead sigui de fa 6h en temps lògic.
  it('loss risk: "24h sense contactar" només depèn del `now` lògic, no del rellotge real', () => {
    const input = makeInput({
      status: 'NEW',
      contactedAt: null,
      createdAt: new Date('2026-04-09T06:00:00Z'), // 6h abans de NOW
    });
    const result = computeLeadInsights(input);
    expect(result.lossRisk.reasons).not.toEqual(expect.arrayContaining([
      expect.stringContaining('24h sense contactar'),
    ]));
  });

  it('loss risk: dispara "24h sense contactar" quan el lead lògic fa >24h', () => {
    const input = makeInput({
      status: 'NEW',
      contactedAt: null,
      createdAt: new Date('2026-04-07T06:00:00Z'), // 54h abans de NOW
    });
    const result = computeLeadInsights(input);
    expect(result.lossRisk.reasons).toEqual(expect.arrayContaining([
      expect.stringContaining('24h sense contactar'),
    ]));
  });

  // ─── Commercial context ───────────────────────────────────────────

  it('calcula dies des de creació', () => {
    const result = computeLeadInsights(makeInput());
    expect(result.commercial.daysSinceCreation).toBe(4);
  });

  it('calcula dies des del darrer contacte', () => {
    const result = computeLeadInsights(makeInput());
    expect(result.commercial.daysSinceContact).toBe(3);
  });

  it('calcula dies fins a event', () => {
    const result = computeLeadInsights(makeInput());
    expect(result.commercial.daysUntilEvent).toBe(36);
  });

  it('detecta client recurrent', () => {
    const input = makeInput();
    input.relatedLeads = [
      { status: 'WON', booking: { total: 2500 } },
    ];
    const result = computeLeadInsights(input);
    expect(result.commercial.isRecurringClient).toBe(true);
    expect(result.commercial.previousEventsCount).toBe(1);
    expect(result.commercial.previousTotalSpent).toBe(2500);
  });

  it('estimatedDealValue usa budget si disponible', () => {
    const result = computeLeadInsights(makeInput({ budget: '3500' }));
    expect(result.commercial.estimatedDealValue).toBe(3500);
  });

  it('estimatedDealValue usa default per eventType si no hi ha budget', () => {
    const result = computeLeadInsights(makeInput({ budget: null }));
    expect(result.commercial.estimatedDealValue).toBeGreaterThan(0);
  });

  it('daysSinceLastActivity null si no hi ha activitats', () => {
    const input = makeInput();
    input.activities = [];
    const result = computeLeadInsights(input);
    expect(result.commercial.daysSinceLastActivity).toBeNull();
  });

  // Regressió: `computeLeadInsights` ha de propagar `now` a `scoreLead`.
  // Abans, `scoreLead(input.lead)` ignorava el `now` injectat i cridava
  // `new Date()` internament, fent que la banda del lead a `/admin/leads/[id]`
  // oscil·lés a prop de fronteres (24h/72h) i no fos testable deterministament.
  it('determinisme: `now` injectat arriba a `scoreLead` (frontera de 72h stale)', () => {
    const updatedAt = new Date('2026-04-05T10:00:00Z');
    const lead = makeLead({ status: 'CONTACTED', updatedAt });

    // 71h després: no ha de tenir flag de stale
    const just71h = computeLeadInsights({
      lead,
      tasks: [],
      activities: [],
      booking: null,
      relatedLeads: [],
      now: new Date('2026-04-08T09:00:00Z'),
    });

    // 73h després: sí ha de tenir flag de stale → score inferior
    const just73h = computeLeadInsights({
      lead,
      tasks: [],
      activities: [],
      booking: null,
      relatedLeads: [],
      now: new Date('2026-04-08T11:00:00Z'),
    });

    expect(just73h.score).toBeLessThan(just71h.score);
  });

  it('determinisme: dos computeLeadInsights amb el mateix `now` donen el mateix score', () => {
    const input = makeInput();
    const a = computeLeadInsights(input);
    const b = computeLeadInsights(input);
    expect(a.score).toBe(b.score);
    expect(a.scoreBand).toBe(b.scoreBand);
  });
});
