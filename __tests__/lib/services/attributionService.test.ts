import { describe, it, expect } from 'vitest';
import {
  generateAttributionReport,
  generateMultiTouchReport,
  type AttributionLeadInput,
  type MultiTouchLeadInput,
} from '@/lib/services/attributionService';

function lead(overrides: Partial<AttributionLeadInput> = {}): AttributionLeadInput {
  return {
    source: 'WEBSITE',
    status: 'NEW',
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    landingPage: null,
    revenue: 0,
    ...overrides,
  };
}

const NOW = new Date('2026-04-11T10:00:00Z');

describe('generateAttributionReport', () => {
  it('retorna totalLeads 0 si no hi ha leads', () => {
    const report = generateAttributionReport([], 90, NOW);
    expect(report.totalLeads).toBe(0);
    expect(report.verdict).toContain('Sense leads');
  });

  it('agrupa leads per source', () => {
    const report = generateAttributionReport(
      [
        lead({ source: 'WEBSITE' }),
        lead({ source: 'WEBSITE' }),
        lead({ source: 'WALLAPOP' }),
      ],
      90,
      NOW,
    );
    expect(report.bySource).toHaveLength(2);
    const web = report.bySource.find((b) => b.key === 'WEBSITE');
    expect(web?.leads).toBe(2);
    expect(web?.label).toBe('Web');
  });

  it('ordena buckets per nombre de leads descendent', () => {
    const report = generateAttributionReport(
      [
        lead({ source: 'WALLAPOP' }),
        lead({ source: 'WEBSITE' }),
        lead({ source: 'WEBSITE' }),
      ],
      90,
      NOW,
    );
    expect(report.bySource[0].key).toBe('WEBSITE');
  });

  it('calcula conversionRate correctament', () => {
    const report = generateAttributionReport(
      [
        lead({ source: 'WEBSITE', status: 'WON' }),
        lead({ source: 'WEBSITE', status: 'WON' }),
        lead({ source: 'WEBSITE', status: 'LOST' }),
        lead({ source: 'WEBSITE', status: 'NEW' }),
      ],
      90,
      NOW,
    );
    const web = report.bySource[0];
    expect(web.won).toBe(2);
    expect(web.lost).toBe(1);
    expect(web.open).toBe(1);
    // won / (won + lost) = 2/3
    expect(web.conversionRate).toBeCloseTo(0.667, 2);
  });

  it('suma revenue només de leads WON', () => {
    const report = generateAttributionReport(
      [
        lead({ source: 'WEBSITE', status: 'WON', revenue: 1000 }),
        lead({ source: 'WEBSITE', status: 'LOST', revenue: 0 }),
        lead({ source: 'WEBSITE', status: 'WON', revenue: 500 }),
      ],
      90,
      NOW,
    );
    expect(report.bySource[0].revenue).toBe(1500);
  });

  it('ignora buckets amb clau null (utmSource buit)', () => {
    const report = generateAttributionReport(
      [lead({ utmSource: null }), lead({ utmSource: 'instagram' })],
      90,
      NOW,
    );
    expect(report.byUtmSource).toHaveLength(1);
    expect(report.byUtmSource[0].key).toBe('instagram');
  });

  it('agrupa per utmCampaign', () => {
    const report = generateAttributionReport(
      [
        lead({ utmCampaign: 'black-friday' }),
        lead({ utmCampaign: 'black-friday' }),
        lead({ utmCampaign: 'spring-sale' }),
      ],
      90,
      NOW,
    );
    expect(report.byUtmCampaign).toHaveLength(2);
    expect(report.byUtmCampaign[0].key).toBe('black-friday');
    expect(report.byUtmCampaign[0].leads).toBe(2);
  });

  it('agrupa per landingPage', () => {
    const report = generateAttributionReport(
      [
        lead({ landingPage: '/ca/servicios/dj-fiestas-girona' }),
        lead({ landingPage: '/ca/servicios/dj-fiestas-girona' }),
        lead({ landingPage: '/ca/configurador' }),
      ],
      90,
      NOW,
    );
    expect(report.byLandingPage[0].key).toBe('/ca/servicios/dj-fiestas-girona');
    expect(report.byLandingPage[0].leads).toBe(2);
  });

  it('topPerformer prioritza won sobre leads', () => {
    const report = generateAttributionReport(
      [
        // WEBSITE: més leads però cap tancat
        lead({ source: 'WEBSITE' }),
        lead({ source: 'WEBSITE' }),
        lead({ source: 'WEBSITE' }),
        // INSTAGRAM: 2 leads però 2 guanyats
        lead({ source: 'INSTAGRAM', status: 'WON', revenue: 1000 }),
        lead({ source: 'INSTAGRAM', status: 'WON', revenue: 800 }),
      ],
      90,
      NOW,
    );
    expect(report.topPerformer.source?.key).toBe('INSTAGRAM');
  });

  it('veredicte avisa si hi ha leads però cap tancat', () => {
    const report = generateAttributionReport(
      [lead({ source: 'WEBSITE' }), lead({ source: 'WEBSITE' })],
      90,
      NOW,
    );
    expect(report.verdict).toContain('cap tancat');
  });

  it('veredicte reflecteix el canal principal quan hi ha won', () => {
    const report = generateAttributionReport(
      [
        lead({ source: 'WEBSITE', status: 'WON', revenue: 1000 }),
        lead({ source: 'WEBSITE' }),
      ],
      90,
      NOW,
    );
    expect(report.verdict).toContain('Web');
    expect(report.verdict).toContain('1 guanyats');
  });

  it('generatedAt és ISO string', () => {
    const report = generateAttributionReport([], 90, NOW);
    expect(report.generatedAt).toBe(NOW.toISOString());
  });

  it('windowDays es preserva al report', () => {
    const report = generateAttributionReport([], 30, NOW);
    expect(report.windowDays).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-TOUCH ATTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════

function mtLead(overrides: Partial<MultiTouchLeadInput> = {}): MultiTouchLeadInput {
  return {
    id: 'lead-1',
    source: 'WEBSITE',
    status: 'NEW',
    revenue: 0,
    createdAt: new Date('2026-04-01T10:00:00Z'),
    activities: [],
    ...overrides,
  };
}

function activity(type: string, daysAfterCreation: number) {
  return {
    type,
    createdAt: new Date(new Date('2026-04-01T10:00:00Z').getTime() + daysAfterCreation * 86400000),
  };
}

describe('generateMultiTouchReport', () => {
  it('retorna totalLeads 0 i wonLeads 0 sense leads', () => {
    const report = generateMultiTouchReport([], 90, NOW);
    expect(report.totalLeads).toBe(0);
    expect(report.wonLeads).toBe(0);
    expect(report.journeys).toHaveLength(0);
    expect(report.verdict).toContain('Sense leads');
  });

  it('retorna journeys buides si cap lead és WON', () => {
    const report = generateMultiTouchReport(
      [mtLead({ status: 'NEW' }), mtLead({ id: 'lead-2', status: 'LOST' })],
      90,
      NOW,
    );
    expect(report.totalLeads).toBe(2);
    expect(report.wonLeads).toBe(0);
    expect(report.journeys).toHaveLength(0);
    expect(report.verdict).toContain('cap guanyat');
  });

  it('genera journey amb first touch = source del lead', () => {
    const report = generateMultiTouchReport(
      [mtLead({ status: 'WON', source: 'INSTAGRAM', revenue: 500 })],
      90,
      NOW,
    );
    expect(report.journeys).toHaveLength(1);
    expect(report.journeys[0].firstTouch.channel).toBe('INSTAGRAM');
    expect(report.journeys[0].firstTouch.label).toBe('Instagram');
  });

  it('assigna last touch a lúltima activitat de comunicació', () => {
    const report = generateMultiTouchReport(
      [
        mtLead({
          status: 'WON',
          revenue: 800,
          activities: [activity('EMAIL', 1), activity('CALL', 3), activity('WHATSAPP', 5)],
        }),
      ],
      90,
      NOW,
    );
    const j = report.journeys[0];
    expect(j.lastTouch?.channel).toBe('WHATSAPP');
    expect(j.assists).toHaveLength(2); // EMAIL + CALL (WHATSAPP is last touch)
    expect(j.assists[0].channel).toBe('EMAIL');
    expect(j.assists[1].channel).toBe('CALL');
  });

  it('ignora activitats no comunicatives (STATUS_CHANGE, SYSTEM, TASK, DOCUMENT)', () => {
    const report = generateMultiTouchReport(
      [
        mtLead({
          status: 'WON',
          revenue: 500,
          activities: [
            activity('STATUS_CHANGE', 1),
            activity('SYSTEM', 2),
            activity('EMAIL', 3),
            activity('TASK', 4),
            activity('DOCUMENT', 5),
          ],
        }),
      ],
      90,
      NOW,
    );
    const j = report.journeys[0];
    // Només EMAIL compta — i és l'únic, per tant és last touch (no assists)
    expect(j.lastTouch?.channel).toBe('EMAIL');
    expect(j.assists).toHaveLength(0);
    expect(j.touchpointCount).toBe(2); // first touch + last touch
  });

  it('sense activitats de comunicació, lastTouch és null', () => {
    const report = generateMultiTouchReport(
      [mtLead({ status: 'WON', revenue: 300 })],
      90,
      NOW,
    );
    const j = report.journeys[0];
    expect(j.lastTouch).toBeNull();
    expect(j.assists).toHaveLength(0);
    expect(j.touchpointCount).toBe(1); // only first touch
  });

  it('acumula crèdits per canal correctament', () => {
    const report = generateMultiTouchReport(
      [
        mtLead({
          id: 'lead-1',
          source: 'WEBSITE',
          status: 'WON',
          revenue: 1000,
          activities: [activity('EMAIL', 1), activity('CALL', 3), activity('WHATSAPP', 5)],
        }),
        mtLead({
          id: 'lead-2',
          source: 'INSTAGRAM',
          status: 'WON',
          revenue: 600,
          activities: [activity('EMAIL', 2), activity('EMAIL', 4)],
        }),
      ],
      90,
      NOW,
    );
    // WEBSITE: 1 first touch (revenue 1000)
    const web = report.byChannel.find((c) => c.channel === 'WEBSITE');
    expect(web?.firstTouchCount).toBe(1);
    expect(web?.firstTouchRevenue).toBe(1000);
    // INSTAGRAM: 1 first touch (revenue 600)
    const ig = report.byChannel.find((c) => c.channel === 'INSTAGRAM');
    expect(ig?.firstTouchCount).toBe(1);
    expect(ig?.firstTouchRevenue).toBe(600);
    // EMAIL: lead-1 assist (1) + lead-2 last touch + lead-2 assist (1) = 2 assists, 1 last
    const email = report.byChannel.find((c) => c.channel === 'EMAIL');
    expect(email?.assistCount).toBe(2); // lead-1 EMAIL + lead-2 first EMAIL
    expect(email?.lastTouchCount).toBe(1); // lead-2 last EMAIL
    // WHATSAPP: lead-1 last touch
    const wa = report.byChannel.find((c) => c.channel === 'WHATSAPP');
    expect(wa?.lastTouchCount).toBe(1);
    expect(wa?.lastTouchRevenue).toBe(1000);
  });

  it('byChannel ordenat per totalTouchpoints descendent', () => {
    const report = generateMultiTouchReport(
      [
        mtLead({
          status: 'WON',
          revenue: 500,
          activities: [
            activity('EMAIL', 1),
            activity('EMAIL', 2),
            activity('EMAIL', 3),
            activity('CALL', 5),
          ],
        }),
      ],
      90,
      NOW,
    );
    // EMAIL: 2 assists + 1 last touch = 3 touchpoints (NOTE: last EMAIL = 3rd, CALL = last)
    // Wait: EMAIL 1, EMAIL 2, EMAIL 3, CALL 5 → sorted by time → CALL is last touch, EMAILs are assists
    // EMAIL: 3 assists = 3 touchpoints
    // CALL: 1 last touch = 1 touchpoint
    // WEBSITE: 1 first touch = 1 touchpoint
    expect(report.byChannel[0].channel).toBe('EMAIL');
    expect(report.byChannel[0].assistCount).toBe(3);
  });

  it('veredicte diferencia canal captació vs tancament', () => {
    const report = generateMultiTouchReport(
      [
        mtLead({
          source: 'WEBSITE',
          status: 'WON',
          revenue: 1000,
          activities: [activity('CALL', 5)],
        }),
      ],
      90,
      NOW,
    );
    // First: WEBSITE, Last: CALL → different channels
    expect(report.verdict).toContain('Web');
    expect(report.verdict).toContain('Trucada');
    expect(report.verdict).toContain('porta els leads');
    expect(report.verdict).toContain('tanca');
  });

  it('veredicte indica canal dominant quan first=last', () => {
    const report = generateMultiTouchReport(
      [
        mtLead({
          source: 'WHATSAPP',
          status: 'WON',
          revenue: 500,
          activities: [activity('WHATSAPP', 3)],
        }),
      ],
      90,
      NOW,
    );
    expect(report.verdict).toContain('WhatsApp');
    expect(report.verdict).toContain('domina');
  });

  it('insights identifica canals first/assist/last', () => {
    const report = generateMultiTouchReport(
      [
        mtLead({
          source: 'WEBSITE',
          status: 'WON',
          revenue: 800,
          activities: [activity('EMAIL', 1), activity('EMAIL', 3), activity('CALL', 5)],
        }),
      ],
      90,
      NOW,
    );
    expect(report.insights.length).toBeGreaterThanOrEqual(2);
    expect(report.insights.some((i) => i.includes('Web'))).toBe(true);
    expect(report.insights.some((i) => i.includes('Email'))).toBe(true);
  });

  it('generatedAt i windowDays es preserven', () => {
    const report = generateMultiTouchReport([], 30, NOW);
    expect(report.generatedAt).toBe(NOW.toISOString());
    expect(report.windowDays).toBe(30);
  });
});
