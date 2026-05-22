import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockLoadMarketingHubSummary } = vi.hoisted(() => ({
  mockLoadMarketingHubSummary: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/services/marketingHubService', () => ({
  loadMarketingHubSummary: mockLoadMarketingHubSummary,
}));

import MarketingPage from '@/app/admin/marketing/page';

describe('MarketingPage', () => {
  it('renderitza el hub de marketing amb captació, canal actiu i integracions', async () => {
    mockLoadMarketingHubSummary.mockResolvedValue({
      readiness: 'PAID_BLOCKED',
      headline: 'Paid media bloquejat fins validar captació orgànica',
      detail: 'Mantingues un sol canal actiu.',
      systemItems: ['2 leads en 7 dies.', 'Tendència 7 dies: DOWN (-60%).'],
      manualItems: ['Enviar el missatge a 50 contactes reals.', 'No invertir en paid.'],
      nextStep: {
        title: 'Completar el bloqueig de canal actiu',
        detail: '50 contactes avisats amb resultat registrat.',
        href: '/admin/manual',
        label: 'Obrir pla de captació',
      },
      activeChannel: {
        title: 'Activar xarxa personal',
        rule: 'No obrir SEO, Social, Partners ni Ads.',
        allowedMoves: ['Enviar el missatge a 50 contactes reals.'],
        exitSignals: ['3 converses comercials obertes.'],
      },
      integrationStates: [
        { id: 'ga4', label: 'Google Analytics 4', status: 'pending', detail: 'Falta configuració.' },
        { id: 'googleAds', label: 'Google Ads', status: 'blocked', detail: 'Bloquejat.' },
        { id: 'metaAds', label: 'Meta Ads', status: 'blocked', detail: 'Bloquejat.' },
        { id: 'googleBusinessProfile', label: 'Google Business Profile', status: 'ready', detail: 'Origen Google detectat.' },
      ],
      channelDiagnostics: [
        {
          source: 'GOOGLE',
          label: 'Google',
          count: 5,
          share: 63,
          wonCount: 2,
          conversionRate: 40,
          revenue: 1250,
          verdict: 'Canal que converteix',
          action: 'Reforça fitxa, ressenyes i UTM de Google abans d’obrir Ads.',
          href: '/admin/google-reviews',
          tone: 'success',
        },
        {
          source: 'WEBSITE',
          label: 'Web',
          count: 3,
          share: 37,
          wonCount: 0,
          conversionRate: 0,
          revenue: 0,
          verdict: 'Canal en prova',
          action: 'Revisa CTA, prova social i copy de la web que converteix aquest trànsit.',
          href: '/admin/text-manager',
          tone: 'info',
        },
      ],
      measurementGaps: [
        {
          id: 'ga4-tracking',
          label: 'Trànsit i conversions web',
          status: 'missing',
          evidence: 'Falta GA4_PROPERTY_ID',
          action: 'Connecta GA4 per saber quines pàgines generen leads.',
          href: '/admin/settings/integrations',
        },
        {
          id: 'google-ads-cost',
          label: 'Cost Google Ads',
          status: 'blocked',
          evidence: 'Paid media bloquejat pel canal actiu o per volum insuficient.',
          action: 'No obrir cost paid fins completar els senyals de sortida.',
          href: '/admin/manual',
        },
      ],
      capture: {
        status: 'FAMINE',
        headline: 'Captació molt baixa (2 en 7 dies)',
        detail: 'Volum insuficient.',
        leadsLast7d: 2,
        leadsPrev7d: 5,
        leadsLast30d: 8,
        leadsPrev30d: 12,
        leadsLast90d: 30,
        trend7d: 'DOWN',
        trendPct7d: -60,
        trend30d: 'DOWN',
        trendPct30d: -33,
        sources: [
          { source: 'GOOGLE', label: 'Google', count: 5, percentage: 63 },
          { source: 'WEBSITE', label: 'Web', count: 3, percentage: 37 },
        ],
        primarySource: 'GOOGLE',
        suggestedAction: {
          label: 'Reforçar canals gratuïts',
          detail: 'Activa Fase 1.',
          href: '/admin/manual',
        },
      },
    });

    const ui = await MarketingPage();
    render(ui);

    expect(screen.getByRole('heading', { name: 'Marketing Hub' })).toBeInTheDocument();
    expect(screen.getByText('Readiness · PAID_BLOCKED')).toBeInTheDocument();
    expect(screen.getByText('Paid media bloquejat fins validar captació orgànica')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir pla de captació' })).toHaveAttribute('href', '/admin/manual');
    expect(screen.getByRole('heading', { name: 'Activar xarxa personal' })).toBeInTheDocument();
    expect(screen.getByText('Google Analytics 4')).toBeInTheDocument();
    expect(screen.getByText('Google Business Profile')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Què reforçar amb les dades actuals' })).toBeInTheDocument();
    expect(screen.getByText('Reforça fitxa, ressenyes i UTM de Google abans d’obrir Ads.')).toBeInTheDocument();
    expect(screen.getByText('2 guanyats · 40% conversió')).toBeInTheDocument();
    expect(screen.getByText(/1\.250.*atribuïts/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Obrir canal' }).some((link) => (
      link.getAttribute('href') === '/admin/google-reviews'
    ))).toBe(true);
    expect(screen.getByRole('heading', { name: 'Forats de mesura abans d’invertir' })).toBeInTheDocument();
    expect(screen.getByText('Cost Google Ads')).toBeInTheDocument();
    expect(screen.getByText('No obrir cost paid fins completar els senyals de sortida.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Resoldre' }).some((link) => (
      link.getAttribute('href') === '/admin/settings/integrations'
    ))).toBe(true);
    expect(screen.getByText('Fonts reals dels últims 90 dies')).toBeInTheDocument();
    expect(screen.getAllByText('5 · 63%').length).toBeGreaterThanOrEqual(1);
  });
});
