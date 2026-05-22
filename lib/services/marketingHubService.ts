import { getGa4ConfigStatus, getGa4Report } from '@/lib/analytics/ga4';
import { getGoogleAdsConfigStatus, getGoogleAdsReport } from '@/lib/analytics/google-ads';
import {
  ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK,
  ADMIN_MARKETING_PHASES,
} from '@/lib/constants/adminManual';
import { loadAttributionReport } from '@/lib/services/attributionService';
import { getGoogleBusinessIntegrationConfig } from '@/lib/services/googleBusinessIntegrationService';
import {
  loadCaptureHealth,
  type CaptureHealthReport,
  type CaptureHealthStatus,
} from '@/lib/services/captureHealthService';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export type MarketingHubReadiness = 'FOUNDATION' | 'ORGANIC' | 'READY_TO_MEASURE' | 'PAID_BLOCKED';
export type MarketingHubIntegrationStatus = 'ready' | 'pending' | 'blocked';

export type MarketingHubIntegration = {
  id: 'ga4' | 'googleAds' | 'metaAds' | 'googleBusinessProfile';
  label: string;
  status: MarketingHubIntegrationStatus;
  detail: string;
  missing?: string[];
};

export type MarketingHubChannelDiagnostic = {
  source: string;
  label: string;
  count: number;
  share: number;
  wonCount: number;
  conversionRate: number;
  revenue: number;
  verdict: string;
  action: string;
  href: string;
  tone: 'success' | 'warning' | 'info';
};

export type MarketingHubMeasurementGap = {
  id: 'ga4-tracking' | 'google-ads-cost' | 'meta-ads-cost' | 'gbp-api' | 'crm-wins';
  label: string;
  status: 'ready' | 'missing' | 'blocked';
  evidence: string;
  action: string;
  href: string;
};

export type MarketingHubSummary = {
  readiness: MarketingHubReadiness;
  headline: string;
  detail: string;
  activeChannel: {
    title: string;
    rule: string;
    allowedMoves: string[];
    exitSignals: string[];
  };
  integrationStates: MarketingHubIntegration[];
  channelDiagnostics: MarketingHubChannelDiagnostic[];
  measurementGaps: MarketingHubMeasurementGap[];
  systemItems: string[];
  manualItems: string[];
  nextStep: {
    title: string;
    detail: string;
    href: string;
    label: string;
  };
  capture: CaptureHealthReport;
};

export type MarketingHubInput = {
  capture: CaptureHealthReport;
  sourceStatusCounts?: Array<{ source: string; status: string; count: number }>;
  sourceRevenue?: Array<{ source: string; revenue: number }>;
  googleAdsSpend?: {
    cost: number;
    clicks: number;
    conversions: number;
    currencyCode: string;
  };
  ga4Traffic?: {
    sessions: number;
    activeUsers: number;
    pageViews: number;
    eventCount: number;
  };
  googleBusinessProfile?: {
    connected: boolean;
    locationName?: string;
  };
  metaPixel?: {
    configured: boolean;
  };
  ga4: {
    ready: boolean;
    reason?: string;
  };
  googleAds: {
    ready: boolean;
    reason?: string;
    missing: string[];
  };
};

const PAID_BLOCKING_CAPTURE_STATUSES: CaptureHealthStatus[] = ['DROUGHT', 'FAMINE', 'LOW'];

function isPaidBlocked(capture: CaptureHealthReport): boolean {
  return (
    PAID_BLOCKING_CAPTURE_STATUSES.includes(capture.status) ||
    ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.activeActionId === 'personal-network'
  );
}

function isCaptureBlockingPaid(capture: CaptureHealthReport): boolean {
  return PAID_BLOCKING_CAPTURE_STATUSES.includes(capture.status);
}

function getReadiness(input: MarketingHubInput): MarketingHubReadiness {
  if (isCaptureBlockingPaid(input.capture)) return 'PAID_BLOCKED';
  if (!input.ga4.ready) return 'FOUNDATION';
  if (!input.googleAds.ready) return 'READY_TO_MEASURE';
  return input.capture.status === 'GROWING' ? 'READY_TO_MEASURE' : 'ORGANIC';
}

function buildHeadline(readiness: MarketingHubReadiness): string {
  switch (readiness) {
    case 'PAID_BLOCKED':
      return 'Paid media bloquejat fins validar captació orgànica';
    case 'FOUNDATION':
      return 'Fundació de mesura incompleta';
    case 'ORGANIC':
      return 'Base orgànica en control';
    case 'READY_TO_MEASURE':
      return 'Preparat per mesurar i decidir canal';
  }
}

function buildDetail(readiness: MarketingHubReadiness, capture: CaptureHealthReport): string {
  switch (readiness) {
    case 'PAID_BLOCKED':
      return `${capture.headline}. Mantingues un sol canal actiu i no obris Ads fins tenir volum i missatge validats.`;
    case 'FOUNDATION':
      return 'Abans de decidir inversió, estabilitza GA4 i el tracking del web perquè cada lead tingui context.';
    case 'ORGANIC':
      return 'La captació permet governar canals gratuïts. El següent retorn surt de conversió i atribució, no de més dispersió.';
    case 'READY_TO_MEASURE':
      return 'Ja hi ha base per llegir trànsit i preparar decisions de canal amb més criteri.';
  }
}

function getSourceAction(source: string): Pick<MarketingHubChannelDiagnostic, 'action' | 'href'> {
  switch (source) {
    case 'GOOGLE':
      return {
        action: 'Reforça fitxa, ressenyes i UTM de Google abans d’obrir Ads.',
        href: '/admin/google-reviews',
      };
    case 'WEBSITE':
    case 'CONFIGURATOR':
      return {
        action: 'Revisa CTA, prova social i copy de la web que converteix aquest trànsit.',
        href: '/admin/text-manager',
      };
    case 'INSTAGRAM':
      return {
        action: 'Connecta posts reals amb CTA i registra quin contingut genera conversa.',
        href: '/admin/social',
      };
    case 'REFERRAL':
      return {
        action: 'Formalitza referidors i demana la següent recomanació concreta.',
        href: '/admin/clientes/referrals',
      };
    case 'WHATSAPP':
    case 'PHONE':
      return {
        action: 'Converteix consultes directes en lead amb origen net i següent tasca.',
        href: '/admin/leads',
      };
    default:
      return {
        action: 'Classifica millor aquest origen abans de prendre decisions d’inversió.',
        href: '/admin/reporting',
      };
  }
}

function buildChannelDiagnostics(
  capture: CaptureHealthReport,
  sourceStatusCounts: NonNullable<MarketingHubInput['sourceStatusCounts']>,
  sourceRevenue: NonNullable<MarketingHubInput['sourceRevenue']>,
): MarketingHubChannelDiagnostic[] {
  if (capture.sources.length === 0) {
    return [{
      source: 'UNKNOWN',
      label: 'Sense origen',
      count: 0,
      share: 0,
      wonCount: 0,
      conversionRate: 0,
      revenue: 0,
      verdict: 'Encara no hi ha canal mesurable',
      action: 'Registra origen a cada lead abans de decidir cap inversió.',
      href: '/admin/leads',
      tone: 'warning',
    }];
  }

  const revenueBySource = new Map(sourceRevenue.map((item) => [item.source, item.revenue]));

  return capture.sources.map((source) => {
    const wonCount = sourceStatusCounts
      .filter((item) => item.source === source.source && item.status === 'WON')
      .reduce((sum, item) => sum + item.count, 0);
    const conversionRate = source.count > 0 ? Math.round((wonCount / source.count) * 100) : 0;
    const isDominant = source.percentage >= 45 && source.count >= 5;
    const isSmallSample = source.count < 3;
    const isConverting = conversionRate >= 20 && wonCount > 0;
    const sourceAction = getSourceAction(source.source);

    return {
      source: source.source,
      label: source.label,
      count: source.count,
      share: source.percentage,
      wonCount,
      conversionRate,
      revenue: revenueBySource.get(source.source) ?? 0,
      verdict: isConverting
        ? 'Canal que converteix'
        : isDominant
        ? 'Canal dominant'
        : isSmallSample
          ? 'Mostra petita'
          : 'Canal en prova',
      action: sourceAction.action,
      href: sourceAction.href,
      tone: isConverting || isDominant ? 'success' : isSmallSample ? 'warning' : 'info',
    };
  });
}

function buildMeasurementGaps(
  input: MarketingHubInput,
  paidBlocked: boolean,
): MarketingHubMeasurementGap[] {
  const hasGoogleCrmSource = input.capture.sources.some((source) => source.source === 'GOOGLE');
  const googleBusinessProfile = input.googleBusinessProfile;
  const metaPixelConfigured = Boolean(input.metaPixel?.configured);
  const ga4Traffic = input.ga4Traffic;
  const googleAdsSpend = input.googleAdsSpend;
  const wonCount = (input.sourceStatusCounts ?? [])
    .filter((item) => item.status === 'WON')
    .reduce((sum, item) => sum + item.count, 0);

  return [
    {
      id: 'ga4-tracking',
      label: 'Trànsit i conversions web',
      status: ga4Traffic || input.ga4.ready ? 'ready' : 'missing',
      evidence: ga4Traffic
        ? `GA4 retorna ${ga4Traffic.sessions} sessions, ${ga4Traffic.activeUsers} usuaris, ${ga4Traffic.pageViews} pàgines i ${ga4Traffic.eventCount} events en 30 dies.`
        : input.ga4.ready
        ? 'GA4 configurat per contrastar sessions amb leads.'
        : input.ga4.reason || 'Falta completar GA4 abans de calcular CPL web.',
      action: ga4Traffic
        ? 'Contrasta trànsit web amb leads CRM i reforça les pàgines que converteixen.'
        : input.ga4.ready
        ? 'Comparar sessions i leads abans d’escalar canals.'
        : 'Connecta GA4 per saber quines pàgines generen leads.',
      href: input.ga4.ready ? '/admin/analytics' : '/admin/settings/integrations',
    },
    {
      id: 'google-ads-cost',
      label: 'Cost Google Ads',
      status: googleAdsSpend ? 'ready' : paidBlocked ? 'blocked' : input.googleAds.ready ? 'ready' : 'missing',
      evidence: googleAdsSpend
        ? `Google Ads retorna ${Math.round(googleAdsSpend.cost)} ${googleAdsSpend.currencyCode} de cost, ${googleAdsSpend.clicks} clics i ${googleAdsSpend.conversions} conversions.`
        : paidBlocked
        ? 'Paid media bloquejat pel canal actiu o per volum insuficient.'
        : input.googleAds.ready
          ? 'API preparada per llegir cost de campanya.'
          : input.googleAds.reason || 'Falta configurar Google Ads API.',
      action: googleAdsSpend
        ? 'Contrasta cost paid amb leads i ingressos CRM abans d’escalar pressupost.'
        : paidBlocked
        ? 'No obrir cost paid fins completar els senyals de sortida.'
        : input.googleAds.ready
          ? 'Afegir UTMs i revisar cost per lead contra CRM.'
          : 'Configura credencials Google Ads només quan el canal estigui desbloquejat.',
      href: paidBlocked ? '/admin/manual' : '/admin/settings/integrations',
    },
    {
      id: 'meta-ads-cost',
      label: 'Cost Meta Ads',
      status: paidBlocked ? 'blocked' : 'missing',
      evidence: metaPixelConfigured
        ? paidBlocked
          ? 'Meta Pixel configurat, però Meta Ads continua bloquejat per la regla de canal únic.'
          : 'Meta Pixel configurat, però falta connector Meta Ads API/cost; sense cost no hi ha CAC real.'
        : paidBlocked
          ? 'Meta Ads continua bloquejat per la regla de canal únic.'
          : 'Connector Meta Ads pendent; sense cost no hi ha CAC real.',
      action: metaPixelConfigured
        ? paidBlocked
          ? 'No donar CAC per complet fins connectar cost Meta Ads i sortir del bloqueig paid.'
          : 'No donar CAC per complet fins connectar cost Meta Ads i creuar-lo amb leads CRM.'
        : paidBlocked
          ? 'Mantén Meta fora fins validar el canal orgànic actiu.'
          : 'Preparar connector només amb creativitats i oferta validades.',
      href: paidBlocked ? '/admin/manual' : '/admin/settings/integrations',
    },
    {
      id: 'gbp-api',
      label: 'Google Business Profile',
      status: googleBusinessProfile?.connected || hasGoogleCrmSource ? 'ready' : 'missing',
      evidence: googleBusinessProfile?.connected
        ? `Google Business Profile connectat${googleBusinessProfile.locationName ? `: ${googleBusinessProfile.locationName}` : ''}.`
        : hasGoogleCrmSource
        ? 'El CRM ja registra leads amb origen Google.'
        : 'Sense leads Google al CRM no es pot atribuir fitxa local.',
      action: googleBusinessProfile?.connected
        ? 'Mantén ressenyes i fitxa sincronitzades amb el canal Google.'
        : hasGoogleCrmSource
        ? 'Reforça ressenyes i mantén l’origen Google net.'
        : 'Revisa fitxa, fotos, ressenyes i tracking d’origen.',
      href: '/admin/google-reviews',
    },
    {
      id: 'crm-wins',
      label: 'Guanyats per canal',
      status: wonCount > 0 ? 'ready' : 'missing',
      evidence: wonCount > 0
        ? `${wonCount} leads guanyats amb origen mesurable als últims 90 dies.`
        : 'Encara no hi ha guanyats recents per calcular conversió a client.',
      action: wonCount > 0
        ? 'Creuar guanyats amb cost quan hi hagi connectors paid.'
        : 'Tanca o actualitza estats de leads abans de llegir ROI.',
      href: '/admin/leads',
    },
  ];
}

export function buildMarketingHubSummary(input: MarketingHubInput): MarketingHubSummary {
  const readiness = getReadiness(input);
  const captureBlocksPaid = isCaptureBlockingPaid(input.capture);
  const paidBlocked = isPaidBlocked(input.capture);
  const hasGoogleCrmSource = input.capture.sources.some((source) => source.source === 'GOOGLE');
  const googleBusinessProfileConnected = Boolean(input.googleBusinessProfile?.connected);
  const metaPixelConfigured = Boolean(input.metaPixel?.configured);
  const activeChannel = ADMIN_MARKETING_PHASES.find(
    (phase) => phase.id === ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.activeActionId,
  );

  const integrationStates: MarketingHubIntegration[] = [
    {
      id: 'ga4',
      label: 'Google Analytics 4',
      status: input.ga4.ready ? 'ready' : 'pending',
      detail: input.ga4.ready
        ? 'GA4 està configurat per alimentar el panell d’analítica.'
        : input.ga4.reason || 'Falta configuració de GA4.',
    },
    {
      id: 'googleAds',
      label: 'Google Ads',
      status: paidBlocked ? 'blocked' : input.googleAds.ready ? 'ready' : 'pending',
      detail: paidBlocked
        ? 'Bloquejat per regla de canal únic i volum de captació.'
        : input.googleAds.ready
          ? 'API preparada per llegir campanyes i cost.'
          : input.googleAds.reason || 'Falta configuració de Google Ads API.',
      missing: input.googleAds.missing,
    },
    {
      id: 'metaAds',
      label: 'Meta Ads',
      status: paidBlocked ? 'blocked' : 'pending',
      detail: metaPixelConfigured
        ? paidBlocked
          ? 'Meta Pixel configurat; Meta Ads continua bloquejat fins sortir del canal actiu.'
          : 'Meta Pixel configurat; falta connector Meta Ads API per llegir cost, clics i conversions.'
        : paidBlocked
          ? 'No obrir Meta Ads fins sortir del bloqueig del canal actiu.'
          : 'Pendent de connector API i creativitats validades.',
    },
    {
      id: 'googleBusinessProfile',
      label: 'Google Business Profile',
      status: googleBusinessProfileConnected || hasGoogleCrmSource ? 'ready' : 'pending',
      detail: googleBusinessProfileConnected
        ? `Google Business Profile connectat${input.googleBusinessProfile?.locationName ? `: ${input.googleBusinessProfile.locationName}` : ''}.`
        : hasGoogleCrmSource
        ? 'Ja hi ha leads amb origen Google al CRM.'
        : 'Revisa fitxa, fotos, ressenyes i tracking d’origen Google.',
    },
  ];

  const manualItems = [
    input.capture.suggestedAction.detail,
    `${ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.title}: ${ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.allowedMoves[0]}`,
    !input.ga4.ready ? `GA4 pendent: ${input.ga4.reason || 'configuració incompleta'}` : 'GA4 preparat per contrastar trànsit i conversions.',
    paidBlocked ? 'No invertir en paid fins registrar els senyals de sortida del bloqueig.' : 'Si proves paid, fer-ho amb pressupost petit i UTM obligatori.',
  ];

  const channelDiagnostics = buildChannelDiagnostics(
    input.capture,
    input.sourceStatusCounts ?? [],
    input.sourceRevenue ?? [],
  );
  const measurementGaps = buildMeasurementGaps(input, paidBlocked);

  const systemItems = [
    `${input.capture.leadsLast7d} leads en 7 dies i ${input.capture.leadsLast30d} en 30 dies.`,
    `Tendència 7 dies: ${input.capture.trend7d} (${input.capture.trendPct7d}%).`,
    input.capture.primarySource
      ? `Canal principal CRM: ${input.capture.sources[0]?.label || input.capture.primarySource}.`
      : 'Cap canal principal detectat encara.',
    `${integrationStates.filter((item) => item.status === 'ready').length} integracions preparades de ${integrationStates.length}.`,
  ];

  const nextStep = captureBlocksPaid
    ? {
        title: 'Completar el bloqueig de canal actiu',
        detail: ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.exitSignals[0],
        href: '/admin/manual',
        label: 'Obrir pla de captació',
      }
    : !input.ga4.ready
      ? {
          title: 'Connectar GA4 abans d’escalar',
          detail: input.ga4.reason || 'Falta completar la configuració de GA4.',
          href: '/admin/settings/integrations',
          label: 'Obrir integracions',
        }
      : {
          title: input.capture.suggestedAction.label,
          detail: input.capture.suggestedAction.detail,
          href: input.capture.suggestedAction.href,
          label: 'Executar següent pas',
        };

  return {
    readiness,
    headline: buildHeadline(readiness),
    detail: buildDetail(readiness, input.capture),
    activeChannel: {
      title: activeChannel?.title || ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.title,
      rule: ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.rule,
      allowedMoves: ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.allowedMoves,
      exitSignals: ADMIN_MARKETING_ACTIVE_CHANNEL_LOCK.exitSignals,
    },
    integrationStates,
    channelDiagnostics,
    measurementGaps,
    systemItems,
    manualItems,
    nextStep,
    capture: input.capture,
  };
}

export async function loadMarketingHubSummary(): Promise<MarketingHubSummary> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [capture, googleAds, sourceStatusGroups, attribution, googleBusinessConfig] = await Promise.all([
    loadCaptureHealth(),
    getGoogleAdsConfigStatus(),
    prisma.lead.groupBy({
      by: ['source', 'status'],
      where: { createdAt: { gte: ninetyDaysAgo } },
      _count: { _all: true },
    }),
    loadAttributionReport(90),
    getGoogleBusinessIntegrationConfig(),
  ]);
  const ga4 = getGa4ConfigStatus();
  let ga4Traffic: MarketingHubInput['ga4Traffic'] | undefined;
  let googleAdsSpend: MarketingHubInput['googleAdsSpend'] | undefined;

  if (ga4.ready) {
    try {
      const ga4Report = await getGa4Report();
      if (ga4Report) {
        ga4Traffic = {
          sessions: ga4Report.totals.sessions,
          activeUsers: ga4Report.totals.activeUsers,
          pageViews: ga4Report.totals.pageViews,
          eventCount: ga4Report.totals.eventCount,
        };
      }
    } catch (error) {
      log.warn('Marketing Hub no ha pogut carregar GA4 traffic', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (googleAds.ready) {
    try {
      const googleAdsReport = await getGoogleAdsReport();
      if (googleAdsReport) {
        googleAdsSpend = {
          cost: googleAdsReport.totals.costMicros / 1_000_000,
          clicks: googleAdsReport.totals.clicks,
          conversions: googleAdsReport.totals.conversions,
          currencyCode: googleAdsReport.currencyCode || 'EUR',
        };
      }
    } catch (error) {
      log.warn('Marketing Hub no ha pogut carregar Google Ads spend', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return buildMarketingHubSummary({
    capture,
    sourceStatusCounts: sourceStatusGroups.map((group) => ({
      source: group.source,
      status: group.status,
      count: group._count._all,
    })),
    sourceRevenue: attribution.bySource.map((bucket) => ({
      source: bucket.key,
      revenue: bucket.revenue,
    })),
    googleAdsSpend,
    ga4Traffic,
    googleBusinessProfile: {
      connected: Boolean(
        googleBusinessConfig?.refreshToken &&
        googleBusinessConfig.accountId &&
        googleBusinessConfig.locationId,
      ),
      locationName: googleBusinessConfig?.locationName,
    },
    metaPixel: {
      configured: Boolean(process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim()),
    },
    ga4,
    googleAds,
  });
}
