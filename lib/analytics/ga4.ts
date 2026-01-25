// lib/analytics/ga4.ts
// GA4 Data API helpers for admin analytics dashboards.

import { BetaAnalyticsDataClient } from '@google-analytics/data';

type Ga4Config = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

type Ga4Totals = {
  activeUsers: number;
  sessions: number;
  pageViews: number;
  eventCount: number;
};

type Ga4Row = {
  dimension: string;
  value: number;
  secondary?: string;
};

type Ga4RealtimeRow = {
  dimension: string;
  value: number;
};

type Ga4Report = {
  totals: Ga4Totals;
  pages: Ga4Row[];
  sources: Ga4Row[];
  events: Ga4Row[];
  devices: Ga4Row[];
  locations: Ga4Row[];
  realtime: {
    activeUsers: number;
    pages: Ga4RealtimeRow[];
  };
};

function getGa4Config(): Ga4Config | null {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY;

  if (!propertyId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    propertyId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

function createClient(config: Ga4Config): BetaAnalyticsDataClient {
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
  });
}

function toNumber(value?: string): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapRows(rows: any[], dimensionIndex = 0, metricIndex = 0): Ga4Row[] {
  return rows.map((row) => ({
    dimension: row.dimensionValues?.[dimensionIndex]?.value || 'Unknown',
    secondary: row.dimensionValues?.[dimensionIndex + 1]?.value,
    value: toNumber(row.metricValues?.[metricIndex]?.value),
  }));
}

function mapRealtimeRows(rows: any[], dimensionIndex = 0, metricIndex = 0): Ga4RealtimeRow[] {
  return rows.map((row) => ({
    dimension: row.dimensionValues?.[dimensionIndex]?.value || 'Unknown',
    value: toNumber(row.metricValues?.[metricIndex]?.value),
  }));
}

export async function getGa4Report(): Promise<Ga4Report | null> {
  const config = getGa4Config();
  if (!config) return null;

  const client = createClient(config);
  const property = `properties/${config.propertyId}`;

  const [totalsRes, pagesRes, sourcesRes, eventsRes, devicesRes, locationsRes, realtimeRes] =
    await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'eventCount' },
        ],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 5,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'country' }, { name: 'city' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      }),
      client.runRealtimeReport({
        property,
        metrics: [{ name: 'activeUsers' }],
        dimensions: [{ name: 'pagePath' }],
        limit: 8,
      }),
    ]);

  const totalRow = totalsRes[0]?.rows?.[0];

  return {
    totals: {
      activeUsers: toNumber(totalRow?.metricValues?.[0]?.value),
      sessions: toNumber(totalRow?.metricValues?.[1]?.value),
      pageViews: toNumber(totalRow?.metricValues?.[2]?.value),
      eventCount: toNumber(totalRow?.metricValues?.[3]?.value),
    },
    pages: mapRows(pagesRes[0]?.rows || []),
    sources: mapRows(sourcesRes[0]?.rows || []),
    events: mapRows(eventsRes[0]?.rows || []),
    devices: mapRows(devicesRes[0]?.rows || []),
    locations: mapRows(locationsRes[0]?.rows || [], 0, 0),
    realtime: {
      activeUsers: toNumber(realtimeRes[0]?.rows?.[0]?.metricValues?.[0]?.value),
      pages: mapRealtimeRows(realtimeRes[0]?.rows || []),
    },
  };
}
