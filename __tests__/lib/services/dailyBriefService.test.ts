import { describe, it, expect } from 'vitest';
import { generateDailyBrief, parseBudgetValue, type DailyBriefInput } from '@/lib/services/dailyBriefService';

const NOW = new Date('2026-04-10T09:00:00Z');

function makeInput(overrides: Partial<DailyBriefInput> = {}): DailyBriefInput {
  return {
    newLeadsToday: 0,
    openLeads: 0,
    overdueTasksCount: 0,
    upcomingBookings7d: 0,
    pendingPaymentsCount: 0,
    forecastWeighted: 0,
    slaBroken: 0,
    staleLeadsCount: 0,
    postEventPending: 0,
    dormantCustomers: 0,
    atRiskCustomers: 0,
    campaigns: [],
    pendingFollowUps: 0,
    urgentFollowUps: 0,
    repliedLeadsAwaitingAction: 0,
    pipelineHotUncontacted: 0,
    pipelineQuoteNoReply: 0,
    pipelineEventSoonNoBooking: 0,
    leadsLast7d: 10,
    leadsLast30d: 40,
    now: NOW,
    ...overrides,
  };
}

describe('generateDailyBrief', () => {
  it('retorna brief buit quan tot és zero', () => {
    const brief = generateDailyBrief(makeInput());
    expect(brief.date).toBe('2026-04-10');
    expect(brief.greeting).toBe('Bon dia');
    expect(brief.summary).toBe('Tot al dia. Cap urgència pendent.');
    expect(brief.alerts).toHaveLength(0);
    expect(brief.actions).toHaveLength(0);
    expect(brief.topCampaigns).toHaveLength(0);
  });

  it('greeting canvia segons hora', () => {
    const afternoon = generateDailyBrief(makeInput({ now: new Date('2026-04-10T15:00:00Z') }));
    expect(afternoon.greeting).toBe('Bona tarda');

    const evening = generateDailyBrief(makeInput({ now: new Date('2026-04-10T20:00:00Z') }));
    expect(evening.greeting).toBe('Bona nit');
  });

  it('summary inclou leads, tasques, reserves i cobraments', () => {
    const brief = generateDailyBrief(makeInput({
      newLeadsToday: 3,
      overdueTasksCount: 2,
      upcomingBookings7d: 1,
      pendingPaymentsCount: 4,
    }));
    expect(brief.summary).toContain('3 entrades noves');
    expect(brief.summary).toContain('2 tasques vençudes');
    expect(brief.summary).toContain('1 reserva en 7 dies');
    expect(brief.summary).toContain('4 cobraments pendents');
  });

  it('genera alerta CRITICAL per SLA broken', () => {
    const brief = generateDailyBrief(makeInput({ slaBroken: 2 }));
    const alert = brief.alerts.find((a) => a.level === 'CRITICAL' && a.icon === '🚨');
    expect(alert).toBeDefined();
    expect(alert!.title).toContain('2 entrades sense resposta');
  });

  it('genera alerta CRITICAL per tasques vençudes', () => {
    const brief = generateDailyBrief(makeInput({ overdueTasksCount: 5 }));
    const alert = brief.alerts.find((a) => a.level === 'CRITICAL' && a.icon === '⏰');
    expect(alert).toBeDefined();
    expect(alert!.title).toContain('5 tasques');
  });

  it('genera alerta WARNING per pagaments pendents', () => {
    const brief = generateDailyBrief(makeInput({ pendingPaymentsCount: 3 }));
    const alert = brief.alerts.find((a) => a.level === 'WARNING' && a.icon === '💸');
    expect(alert).toBeDefined();
  });

  it('genera alerta INFO per dormants', () => {
    const brief = generateDailyBrief(makeInput({ dormantCustomers: 10 }));
    const alert = brief.alerts.find((a) => a.icon === '😴');
    expect(alert).toBeDefined();
    expect(alert!.href).toContain('reactivation');
  });

  it('genera alerta WARNING per clients en risc', () => {
    const brief = generateDailyBrief(makeInput({ atRiskCustomers: 4 }));
    const alert = brief.alerts.find((a) => a.icon === '⚠️');
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('WARNING');
  });

  it('ordena accions per prioritat descendent', () => {
    const brief = generateDailyBrief(makeInput({
      slaBroken: 1,
      newLeadsToday: 2,
      overdueTasksCount: 3,
      pendingPaymentsCount: 1,
    }));
    expect(brief.actions.length).toBeGreaterThanOrEqual(4);
    expect(brief.actions[0].label).toContain('Respondre entrades urgents');
    expect(brief.actions[1].label).toContain('Classificar entrades noves');
    expect(brief.actions[2].label).toContain('Tancar tasques vençudes');
    expect(brief.actions[3].label).toContain('Cobrar pagaments');
  });

  it('acció embut comercial si >5 leads oberts', () => {
    const brief = generateDailyBrief(makeInput({ openLeads: 10 }));
    const action = brief.actions.find((a) => a.label.includes('embut'));
    expect(action).toBeDefined();
    expect(action!.href).toContain('sales-ops');
  });

  it('no genera acció embut amb <=5 leads oberts', () => {
    const brief = generateDailyBrief(makeInput({ openLeads: 3 }));
    expect(brief.actions.find((a) => a.label.includes('embut'))).toBeUndefined();
  });

  it('inclou top 3 campanyes', () => {
    const brief = generateDailyBrief(makeInput({
      campaigns: [
        { id: '1', type: 'REACTIVATION', name: 'C1', description: '', segment: 'S', audienceSize: 10, channel: 'email', subject: '', bodyTemplate: '', urgency: 'HIGH', estimatedImpact: '' },
        { id: '2', type: 'UPSELL', name: 'C2', description: '', segment: 'S', audienceSize: 5, channel: 'email', subject: '', bodyTemplate: '', urgency: 'MEDIUM', estimatedImpact: '' },
        { id: '3', type: 'LOYALTY', name: 'C3', description: '', segment: 'S', audienceSize: 3, channel: 'whatsapp', subject: '', bodyTemplate: '', urgency: 'LOW', estimatedImpact: '' },
        { id: '4', type: 'REFERRAL', name: 'C4', description: '', segment: 'S', audienceSize: 8, channel: 'email', subject: '', bodyTemplate: '', urgency: 'MEDIUM', estimatedImpact: '' },
      ],
    }));
    expect(brief.topCampaigns).toHaveLength(3);
    expect(brief.topCampaigns[0].name).toBe('C1');
  });

  it('exclou campanyes amb audienceSize 0', () => {
    const brief = generateDailyBrief(makeInput({
      campaigns: [
        { id: '1', type: 'REACTIVATION', name: 'C1', description: '', segment: 'S', audienceSize: 0, channel: 'email', subject: '', bodyTemplate: '', urgency: 'HIGH', estimatedImpact: '' },
      ],
    }));
    expect(brief.topCampaigns).toHaveLength(0);
  });

  it('KPIs reflecteixen inputs correctament', () => {
    const brief = generateDailyBrief(makeInput({
      newLeadsToday: 5,
      openLeads: 20,
      overdueTasksCount: 3,
      upcomingBookings7d: 2,
      pendingPaymentsCount: 1,
      forecastWeighted: 15000,
    }));
    expect(brief.kpis.newLeadsToday).toBe(5);
    expect(brief.kpis.openLeads).toBe(20);
    expect(brief.kpis.overdueTasksCount).toBe(3);
    expect(brief.kpis.upcomingBookings7d).toBe(2);
    expect(brief.kpis.pendingPaymentsCount).toBe(1);
    expect(brief.kpis.forecastWeighted).toBe(15000);
  });

  it('detecta sequera de leads (0 en 7d) com a CRITICAL amb icona 🏜️', () => {
    const brief = generateDailyBrief(makeInput({ leadsLast7d: 0, leadsLast30d: 0 }));
    const alert = brief.alerts.find((a) => a.icon === '🏜️');
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('CRITICAL');
    expect(alert!.title).toContain('Captació aturada');
    expect(alert!.href).toBe('/admin/manual');
  });

  it('summary canvia completament quan hi ha sequera', () => {
    const brief = generateDailyBrief(makeInput({
      leadsLast7d: 0,
      leadsLast30d: 0,
      newLeadsToday: 0,
      overdueTasksCount: 5,
    }));
    expect(brief.summary).toContain('Captació aturada');
    expect(brief.summary).toContain('atraure');
  });

  it('acció "Executar pla de captació" té prioritat màxima en sequera', () => {
    const brief = generateDailyBrief(makeInput({
      leadsLast7d: 0,
      leadsLast30d: 0,
      slaBroken: 3,
    }));
    expect(brief.actions[0].label).toContain('Executar pla de captació');
    expect(brief.actions[0].href).toBe('/admin/manual');
  });

  it('genera alerta WARNING de famine quan leadsLast7d entre 1 i 2', () => {
    const brief = generateDailyBrief(makeInput({ leadsLast7d: 2, leadsLast30d: 5 }));
    const alert = brief.alerts.find((a) => a.icon === '⚠️' && a.title.includes('Captació molt baixa'));
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('CRITICAL');
  });

  it('no genera alerta de sequera quan hi ha flux normal', () => {
    const brief = generateDailyBrief(makeInput({ leadsLast7d: 10, leadsLast30d: 40 }));
    const droughtAlert = brief.alerts.find((a) => a.icon === '🏜️');
    expect(droughtAlert).toBeUndefined();
  });

  it("genera alerta WARNING per respostes pendents d'acció humana", () => {
    const brief = generateDailyBrief(makeInput({ repliedLeadsAwaitingAction: 2 }));
    const alert = brief.alerts.find((a) => a.icon === '↩️');
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('WARNING');
    expect(alert!.title).toContain("2 respostes pendents d'acció");
  });

  it('prioritza respondre converses amb resposta per sobre de follow-ups normals', () => {
    const brief = generateDailyBrief(makeInput({ repliedLeadsAwaitingAction: 1, pendingFollowUps: 4 }));
    expect(brief.actions[0].label).toContain('Respondre converses amb resposta');
  });

  it('genera alerta CRITICAL per urgentFollowUps', () => {
    const brief = generateDailyBrief(makeInput({ urgentFollowUps: 3, pendingFollowUps: 5 }));
    const alert = brief.alerts.find((a) => a.icon === '📩');
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('CRITICAL');
    expect(alert!.title).toContain('3 seguiments urgents');
  });

  it('genera alerta INFO per pendingFollowUps sense urgents', () => {
    const brief = generateDailyBrief(makeInput({ pendingFollowUps: 4 }));
    const alert = brief.alerts.find((a) => a.icon === '📩');
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('INFO');
  });

  it('genera alerta WARNING per pipelineHotUncontacted', () => {
    const brief = generateDailyBrief(makeInput({ pipelineHotUncontacted: 2 }));
    const alert = brief.alerts.find((a) => a.icon === '🔥');
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('WARNING');
  });

  it('genera alerta INFO per pipelineQuoteNoReply', () => {
    const brief = generateDailyBrief(makeInput({ pipelineQuoteNoReply: 3 }));
    const alert = brief.alerts.find((a) => a.icon === '📋');
    expect(alert).toBeDefined();
    expect(alert!.title).toContain('3 pressupost');
  });

  it('genera alerta WARNING per pipelineEventSoonNoBooking', () => {
    const brief = generateDailyBrief(makeInput({ pipelineEventSoonNoBooking: 1 }));
    const alert = brief.alerts.find((a) => a.icon === '📅');
    expect(alert).toBeDefined();
    expect(alert!.level).toBe('WARNING');
  });

  it('urgentFollowUps té prioritat alta a accions', () => {
    const brief = generateDailyBrief(makeInput({ urgentFollowUps: 2, newLeadsToday: 5 }));
    const action = brief.actions.find((a) => a.label.includes('seguiments urgents'));
    expect(action).toBeDefined();
    expect(brief.actions[0].label).toContain('seguiments urgents');
  });

  it('singular correcte quan tots els comptadors són 1', () => {
    const brief = generateDailyBrief(makeInput({
      newLeadsToday: 1,
      overdueTasksCount: 1,
      upcomingBookings7d: 1,
      pendingPaymentsCount: 1,
    }));
    expect(brief.summary).toContain('1 entrada nova');
    expect(brief.summary).toContain('1 tasca vençuda');
    expect(brief.summary).toContain('1 reserva en 7 dies');
    expect(brief.summary).toContain('1 cobrament pendent');
  });
});

// Regressió: el forecast del brief diari es calcula amb `parseBudgetValue`.
// Abans `loadDailyBrief` feia `Number(lead.budget) || 0`, així que un pressupost
// "1.500" (format europeu, 1500 €) es parsejava com 1.5 € i el forecast
// ponderat es veia massivament infravalorat al cockpit de propietari.
describe('parseBudgetValue', () => {
  it('format europeu amb milers: "1.500" → 1500', () => {
    expect(parseBudgetValue('1.500')).toBe(1500);
  });

  it('format europeu amb milers i decimals: "1.500,50" → 1500.5', () => {
    expect(parseBudgetValue('1.500,50')).toBeCloseTo(1500.5, 1);
  });

  it('format europeu amb símbol: "1.500,50 €" → 1500.5', () => {
    expect(parseBudgetValue('1.500,50 €')).toBeCloseTo(1500.5, 1);
  });

  it('enter simple: "500" → 500', () => {
    expect(parseBudgetValue('500')).toBe(500);
  });

  it('null / undefined / "" → 0', () => {
    expect(parseBudgetValue(null)).toBe(0);
    expect(parseBudgetValue(undefined)).toBe(0);
    expect(parseBudgetValue('')).toBe(0);
  });

  it('text no parsejable → 0', () => {
    expect(parseBudgetValue('no ho sé')).toBe(0);
  });
});
