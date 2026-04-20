import { describe, it, expect } from 'vitest';
import { computeCustomerInsights, type CustomerInsights } from '@/lib/services/customerInsightsService';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';

// ─── Helpers ────────────────────────────────────────────────────────────

const NOW = new Date('2026-04-09T12:00:00Z');

function makeHub(overrides: Partial<CustomerHubDTO> = {}): CustomerHubDTO {
  return {
    customer: {
      id: 'c1',
      name: 'Test Client',
      status: 'CONFIRMED',
      createdAt: '2025-01-01T00:00:00Z',
      healthScore: null,
      ...overrides.customer,
    },
    kpis: { ...overrides.kpis },
    active: { source: 'NONE', ...overrides.active },
    proposals: overrides.proposals || [],
    bookings: overrides.bookings || [],
    tasks: overrides.tasks || [],
    messages: overrides.messages || [],
    commSummary: overrides.commSummary || {
      total: 0,
      channels: { EMAIL: 0, WHATSAPP: 0, CALL: 0, NOTE: 0, SYSTEM: 0 },
      lastContactAt: null,
      lastContactChannel: null,
      lastContactDirection: null,
      pendingResponseFrom: 'NONE',
      daysSinceLastContact: null,
      responseGap: null,
    },
    timeline: overrides.timeline || [],
    followUpSummary: overrides.followUpSummary,
    discountCodes: overrides.discountCodes || [],
    leads: overrides.leads || [],
  } as CustomerHubDTO;
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('computeCustomerInsights', () => {
  // ─── LTV & recurrence ─────────────────────────────────────────────

  it('calcula LTV sumant bookings no cancel·lats', () => {
    const hub = makeHub({
      bookings: [
        { id: 'b1', status: 'COMPLETED', totalAmount: 3000 },
        { id: 'b2', status: 'CONFIRMED', totalAmount: 2000 },
        { id: 'b3', status: 'CANCELLED', totalAmount: 5000 },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.ltv).toBe(5000);
  });

  it('recurrence compta només bookings COMPLETED', () => {
    const hub = makeHub({
      bookings: [
        { id: 'b1', status: 'COMPLETED', totalAmount: 1000 },
        { id: 'b2', status: 'COMPLETED', totalAmount: 2000 },
        { id: 'b3', status: 'CONFIRMED', totalAmount: 500 },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.recurrence).toBe(2);
    expect(result.completedEvents).toBe(2);
  });

  // ─── Pending payment ──────────────────────────────────────────────

  it('calcula pagament pendent correctament', () => {
    const hub = makeHub({
      bookings: [
        {
          id: 'b1', status: 'CONFIRMED', totalAmount: 3000,
          depositAmount: 1000, depositPaid: true, remainingPaid: false,
        },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.pendingPaymentTotal).toBe(2000);
  });

  it('pagament pendent = 0 si tot pagat', () => {
    const hub = makeHub({
      bookings: [
        {
          id: 'b1', status: 'CONFIRMED', totalAmount: 3000,
          depositAmount: 1000, depositPaid: true, remainingPaid: true,
        },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.pendingPaymentTotal).toBe(0);
  });

  // ─── Days calculations ────────────────────────────────────────────

  it('calcula dies des del darrer contacte', () => {
    const hub = makeHub({
      kpis: { lastContactAt: '2026-03-30T12:00:00Z' },
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.daysSinceLastContact).toBe(10);
  });

  it('daysSinceLastContact null si no hi ha contacte', () => {
    const result = computeCustomerInsights(makeHub(), NOW);
    expect(result.daysSinceLastContact).toBeNull();
  });

  it('calcula dies fins al pròxim event', () => {
    const hub = makeHub({
      kpis: { nextEventDate: '2026-04-19T00:00:00Z' },
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.daysUntilNextEvent).toBe(10);
  });

  // ─── Next action priority ────────────────────────────────────────

  it('next action: tasca vençuda és prioritat màxima', () => {
    const hub = makeHub({
      tasks: [
        { id: 't1', title: 'Trucar client', done: false, dueDate: '2026-04-01T00:00:00Z' },
      ],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.nextAction.type).toBe('COMPLETE_TASK');
    expect(result.nextAction.urgency).toBe('HIGH');
  });

  it('next action: cobrament pendent', () => {
    const hub = makeHub({
      bookings: [
        {
          id: 'b1', status: 'CONFIRMED', reference: 'ORB-001',
          totalAmount: 3000, depositAmount: 1000,
          depositPaid: true, remainingPaid: false,
        },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.nextAction.type).toBe('COLLECT_PAYMENT');
    expect(result.nextAction.urgency).toBe('HIGH');
  });

  it('next action: enviar pressupost a lead en negociació', () => {
    const hub = makeHub({
      leads: [
        { id: 'l1', name: 'Joan', email: 'joan@test.com', eventType: 'WEDDING', status: 'NEGOTIATING', priority: 'HIGH', createdAt: '2026-01-01' },
      ],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.nextAction.type).toBe('SEND_PROPOSAL');
  });

  it('next action: respondre al client si tenim una entrada pendent entrant', () => {
    const hub = makeHub({
      commSummary: {
        total: 4,
        channels: { EMAIL: 2, WHATSAPP: 1, CALL: 0, NOTE: 1, SYSTEM: 0 },
        lastContactAt: '2026-04-09T11:00:00Z',
        lastContactChannel: 'EMAIL',
        lastContactDirection: 'INBOUND',
        pendingResponseFrom: 'TEAM',
        daysSinceLastContact: 0,
        responseGap: 2,
      },
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.nextAction).toMatchObject({
      type: 'FOLLOW_UP',
      urgency: 'HIGH',
      label: 'Respondre al client',
    });
  });

  it('next action: seguiment de pressupost enviat', () => {
    const hub = makeHub({
      leads: [
        { id: 'l1', name: 'Maria', email: 'maria@test.com', eventType: 'CORPORATE', status: 'QUOTE_SENT', priority: 'MEDIUM', createdAt: '2026-01-01' },
      ],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.nextAction.type).toBe('FOLLOW_UP');
  });

  it('next action: sol·licitar ressenya post-event', () => {
    const hub = makeHub({
      bookings: [
        { id: 'b1', status: 'COMPLETED', totalAmount: 2000, date: '2026-03-01' },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.nextAction.type).toBe('REVIEW_PENDING');
  });

  it('next action: reactivar si >30 dies sense contacte amb relació activa', () => {
    const hub = makeHub({
      kpis: { lastContactAt: '2026-02-01T00:00:00Z' },
      bookings: [
        { id: 'b1', status: 'CONFIRMED', totalAmount: 2000, depositAmount: 1000, depositPaid: true, remainingPaid: true },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.nextAction.type).toBe('REACTIVATE');
  });

  it('next action: NONE si no hi ha res pendent', () => {
    const result = computeCustomerInsights(makeHub(), NOW);
    expect(result.nextAction.type).toBe('NONE');
  });

  it('commercial risk: HIGH si hi ha seguiment urgent pendent', () => {
    const hub = makeHub({
      followUpSummary: {
        total: 1,
        urgent: 1,
        normal: 0,
        low: 0,
        topItem: {
          leadId: 'l1',
          name: 'Maria',
          phone: null,
          urgency: 'URGENT',
          daysSinceOutbound: 6,
          suggestedAction: 'Trucar o enviar WhatsApp',
        },
      },
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.commercialRisk).toMatchObject({
      level: 'HIGH',
      label: 'Risc comercial alt',
    });
  });

  it('commercial risk: MEDIUM si la relació activa es refreda per inacció', () => {
    const hub = makeHub({
      kpis: { lastContactAt: '2026-03-01T00:00:00Z' },
      bookings: [
        { id: 'b1', status: 'CONFIRMED', totalAmount: 2000 },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.commercialRisk).toMatchObject({
      level: 'MEDIUM',
      label: 'Relació en refredament',
    });
  });

  // ─── Relational health ────────────────────────────────────────────

  it('relational health: LOST si status LOST', () => {
    const hub = makeHub({ customer: { id: 'c1', name: 'Lost', status: 'LOST', createdAt: '2025-01-01' } as CustomerHubDTO['customer'] });
    const result = computeCustomerInsights(hub, NOW);
    expect(result.relationalHealth).toBe('LOST');
  });

  it('relational health: usa healthScore si disponible', () => {
    const hub = makeHub({
      customer: { id: 'c1', name: 'Test', status: 'CONFIRMED', createdAt: '2025-01-01', healthScore: 85 } as CustomerHubDTO['customer'],
    });
    const result = computeCustomerInsights(hub, NOW);
    expect(result.relationalHealth).toBe('EXCELLENT');
  });

  it('relational health: EXCELLENT si recurrent i contacte recent', () => {
    const hub = makeHub({
      kpis: { lastContactAt: '2026-04-01T00:00:00Z' },
      bookings: [
        { id: 'b1', status: 'COMPLETED', totalAmount: 1000 },
        { id: 'b2', status: 'COMPLETED', totalAmount: 2000 },
      ] as CustomerHubDTO['bookings'],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.relationalHealth).toBe('EXCELLENT');
  });

  it('relational health: COLD si >90 dies sense contacte', () => {
    const hub = makeHub({
      kpis: { lastContactAt: '2025-12-01T00:00:00Z' },
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.relationalHealth).toBe('COLD');
  });

  it('relational health: AT_RISK si 45-90 dies sense contacte', () => {
    const hub = makeHub({
      kpis: { lastContactAt: '2026-02-15T00:00:00Z' },
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.relationalHealth).toBe('AT_RISK');
  });

  it('relational health: GOOD per defecte', () => {
    const hub = makeHub({
      kpis: { lastContactAt: '2026-04-05T00:00:00Z' },
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.relationalHealth).toBe('GOOD');
  });

  // ─── Open tasks count ─────────────────────────────────────────────

  it('compta correctament tasques obertes', () => {
    const hub = makeHub({
      tasks: [
        { id: 't1', title: 'A', done: false },
        { id: 't2', title: 'B', done: true },
        { id: 't3', title: 'C', done: false },
      ],
    });

    const result = computeCustomerInsights(hub, NOW);
    expect(result.openTasksCount).toBe(2);
  });
});
