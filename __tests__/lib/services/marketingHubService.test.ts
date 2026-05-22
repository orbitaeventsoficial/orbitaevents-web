import { describe, expect, it } from 'vitest';
import { buildMarketingHubSummary, type MarketingHubInput } from '@/lib/services/marketingHubService';
import { generateCaptureHealth, type CaptureHealthInput } from '@/lib/services/captureHealthService';

function makeCapture(overrides: Partial<CaptureHealthInput> = {}) {
  return generateCaptureHealth({
    leadsLast7d: 8,
    leadsPrev7d: 7,
    leadsLast30d: 32,
    leadsPrev30d: 28,
    leadsLast90d: 88,
    sourceCounts: [
      { source: 'GOOGLE', count: 18 },
      { source: 'WEBSITE', count: 12 },
      { source: 'REFERRAL', count: 8 },
    ],
    ...overrides,
  });
}

function makeInput(overrides: Partial<MarketingHubInput> = {}): MarketingHubInput {
  return {
    capture: makeCapture(),
    ga4: { ready: true },
    googleAds: { ready: false, reason: 'Falten variables', missing: ['GOOGLE_ADS_REFRESH_TOKEN'] },
    ...overrides,
  };
}

describe('buildMarketingHubSummary', () => {
  it('bloqueja paid media quan la captació és baixa', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ leadsLast7d: 2, leadsLast30d: 6 }),
    }));

    expect(summary.readiness).toBe('PAID_BLOCKED');
    expect(summary.headline).toContain('Paid media bloquejat');
    expect(summary.integrationStates.find((item) => item.id === 'googleAds')?.status).toBe('blocked');
    expect(summary.integrationStates.find((item) => item.id === 'metaAds')?.status).toBe('blocked');
    expect(summary.nextStep.href).toBe('/admin/manual');
  });

  it('marca fundació quan GA4 no està preparat', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ leadsLast7d: 12 }),
      ga4: { ready: false, reason: 'Falta GA4_PROPERTY_ID' },
    }));

    expect(summary.readiness).toBe('FOUNDATION');
    expect(summary.nextStep.href).toBe('/admin/settings/integrations');
    expect(summary.integrationStates.find((item) => item.id === 'ga4')?.detail).toContain('GA4_PROPERTY_ID');
  });

  it('manté readiness de mesura però bloqueja Google Ads pel canal actiu', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ leadsLast7d: 14 }),
      googleAds: { ready: false, reason: 'Falten variables', missing: ['GOOGLE_ADS_CUSTOMER_ID'] },
    }));

    expect(summary.readiness).toBe('READY_TO_MEASURE');
    expect(summary.integrationStates.find((item) => item.id === 'googleAds')?.status).toBe('blocked');
    expect(summary.integrationStates.find((item) => item.id === 'googleAds')?.missing).toContain('GOOGLE_ADS_CUSTOMER_ID');
  });

  it('detecta Google Business Profile preparat si el CRM ja té origen Google', () => {
    const summary = buildMarketingHubSummary(makeInput());

    expect(summary.integrationStates.find((item) => item.id === 'googleBusinessProfile')?.status).toBe('ready');
    expect(summary.systemItems.join(' ')).toContain('Canal principal CRM: Google');
  });

  it('genera diagnòstic accionable per canal amb origen real del CRM', () => {
    const summary = buildMarketingHubSummary(makeInput({
      sourceStatusCounts: [
        { source: 'GOOGLE', status: 'WON', count: 4 },
        { source: 'WEBSITE', status: 'WON', count: 1 },
      ],
      sourceRevenue: [
        { source: 'GOOGLE', revenue: 4200 },
        { source: 'WEBSITE', revenue: 900 },
      ],
    }));

    expect(summary.channelDiagnostics[0]).toMatchObject({
      source: 'GOOGLE',
      label: 'Google',
      wonCount: 4,
      conversionRate: 22,
      revenue: 4200,
      verdict: 'Canal que converteix',
      href: '/admin/google-reviews',
      tone: 'success',
    });
    expect(summary.channelDiagnostics.find((item) => item.source === 'REFERRAL')?.href).toBe('/admin/clientes/referrals');
    expect(summary.measurementGaps.find((item) => item.id === 'crm-wins')).toMatchObject({
      status: 'ready',
      evidence: expect.stringContaining('5 leads guanyats'),
      href: '/admin/leads',
    });
  });

  it('demana registrar origen quan encara no hi ha fonts mesurables', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ sourceCounts: [] }),
    }));

    expect(summary.channelDiagnostics).toEqual([
      expect.objectContaining({
        source: 'UNKNOWN',
        verdict: 'Encara no hi ha canal mesurable',
        href: '/admin/leads',
        tone: 'warning',
      }),
    ]);
  });

  it('explica els forats de mesura de ROI abans de gastar en paid', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ leadsLast7d: 2, leadsLast30d: 6, sourceCounts: [{ source: 'WEBSITE', count: 6 }] }),
      ga4: { ready: false, reason: 'Falta GA4_PROPERTY_ID' },
      googleAds: { ready: false, reason: 'Falta refresh token', missing: ['GOOGLE_ADS_REFRESH_TOKEN'] },
      sourceStatusCounts: [],
    }));

    expect(summary.measurementGaps).toHaveLength(5);
    expect(summary.measurementGaps.find((item) => item.id === 'ga4-tracking')).toMatchObject({
      status: 'missing',
      evidence: 'Falta GA4_PROPERTY_ID',
      href: '/admin/settings/integrations',
    });
    expect(summary.measurementGaps.find((item) => item.id === 'google-ads-cost')).toMatchObject({
      status: 'blocked',
      action: expect.stringContaining('No obrir cost paid'),
      href: '/admin/manual',
    });
    expect(summary.measurementGaps.find((item) => item.id === 'gbp-api')).toMatchObject({
      status: 'missing',
      href: '/admin/google-reviews',
    });
  });

  it('marca el cost de Google Ads com a cobert quan hi ha spend real', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ leadsLast7d: 14 }),
      googleAds: { ready: true, missing: [] },
      googleAdsSpend: {
        cost: 182.4,
        clicks: 96,
        conversions: 3.2,
        currencyCode: 'EUR',
      },
    }));

    expect(summary.measurementGaps.find((item) => item.id === 'google-ads-cost')).toMatchObject({
      status: 'ready',
      evidence: expect.stringContaining('182 EUR'),
      action: expect.stringContaining('Contrasta cost paid'),
    });
  });

  it('marca el trànsit GA4 com a cobert quan hi ha totals reals', () => {
    const summary = buildMarketingHubSummary(makeInput({
      ga4: { ready: true },
      ga4Traffic: {
        sessions: 740,
        activeUsers: 410,
        pageViews: 1580,
        eventCount: 3200,
      },
    }));

    expect(summary.measurementGaps.find((item) => item.id === 'ga4-tracking')).toMatchObject({
      status: 'ready',
      evidence: expect.stringContaining('740 sessions'),
      action: expect.stringContaining('Contrasta trànsit web'),
    });
  });

  it('marca Google Business Profile com a cobert quan hi ha OAuth i ubicació connectats', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ sourceCounts: [{ source: 'WEBSITE', count: 8 }] }),
      googleBusinessProfile: {
        connected: true,
        locationName: 'Òrbita Events Granollers',
      },
    }));

    expect(summary.measurementGaps.find((item) => item.id === 'gbp-api')).toMatchObject({
      status: 'ready',
      evidence: expect.stringContaining('Òrbita Events Granollers'),
      action: expect.stringContaining('Mantén ressenyes'),
    });
  });

  it('marca la integració Google Business Profile com a preparada quan hi ha connexió OAuth encara que el CRM no tingui origen Google', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ sourceCounts: [{ source: 'WEBSITE', count: 8 }] }),
      googleBusinessProfile: {
        connected: true,
        locationName: 'Òrbita Events Granollers',
      },
    }));

    expect(summary.integrationStates.find((item) => item.id === 'googleBusinessProfile')).toMatchObject({
      status: 'ready',
      detail: expect.stringContaining('Òrbita Events Granollers'),
    });
  });

  it('diferencia Meta Pixel configurat de cost Meta Ads pendent sota bloqueig paid', () => {
    const summary = buildMarketingHubSummary(makeInput({
      capture: makeCapture({ leadsLast7d: 14 }),
      metaPixel: { configured: true },
    }));

    expect(summary.integrationStates.find((item) => item.id === 'metaAds')).toMatchObject({
      status: 'blocked',
      detail: expect.stringContaining('Meta Pixel configurat'),
    });
    expect(summary.measurementGaps.find((item) => item.id === 'meta-ads-cost')).toMatchObject({
      status: 'blocked',
      evidence: expect.stringContaining('Meta Pixel configurat'),
      action: expect.stringContaining('CAC'),
    });
  });
});
