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
  avgSessionDuration: number;
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
  searchTerms: Ga4Row[];
  devices: Ga4Row[];
  locations: Ga4Row[];
  timeseries: {
    date: string;
    sessions: number;
    activeUsers: number;
  }[];
  realtime: {
    activeUsers: number;
    pages: Ga4RealtimeRow[];
  };
  realtimeFallback: boolean;
};

type Ga4ConfigStatus = {
  ready: boolean;
  reason?: string;
};

export function getGa4ConfigStatus(): Ga4ConfigStatus {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GA4_PRIVATE_KEY;
  const privateKeyB64 = process.env.GA4_PRIVATE_KEY_B64;

  if (!propertyId || !clientEmail) {
    return { ready: false, reason: 'Falten GA4_PROPERTY_ID o GA4_CLIENT_EMAIL' };
  }

  if (!privateKeyRaw && !privateKeyB64) {
    return { ready: false, reason: 'Falta GA4_PRIVATE_KEY' };
  }

  let privateKey = privateKeyRaw || '';
  if (!privateKey && privateKeyB64) {
    try {
      privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
    } catch {
      return { ready: false, reason: 'GA4_PRIVATE_KEY_B64 invalid' };
    }
  }

  privateKey = privateKey.trim();
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    return { ready: false, reason: 'GA4_PRIVATE_KEY sense BEGIN PRIVATE KEY' };
  }

  return { ready: true };
}

function getGa4Config(): Ga4Config | null {
  const status = getGa4ConfigStatus();
  if (!status.ready) return null;

  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GA4_PRIVATE_KEY;
  const privateKeyB64 = process.env.GA4_PRIVATE_KEY_B64;

  if (!propertyId || !clientEmail || (!privateKeyRaw && !privateKeyB64)) return null;

  let privateKey = privateKeyRaw || '';
  if (!privateKey && privateKeyB64) {
    try {
      privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
    } catch {
      privateKey = '';
    }
  }

  privateKey = privateKey.trim();
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    return null;
  }

  return {
    propertyId,
    clientEmail,
    privateKey,
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

function toNumber(value?: string | null): number {
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

  const safe = async <T>(promise: Promise<T>): Promise<T | null> => {
    try {
      return await promise;
    } catch {
      return null;
    }
  };

  const [
    totalsRes,
    pagesRes,
    sourcesRes,
    eventsRes,
    searchTermsRes,
    devicesRes,
    locationsRes,
    timeseriesRes
  ] =
    await Promise.all([
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'eventCount' },
          { name: 'averageSessionDuration' },
        ],
      })),
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      })),
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      })),
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10,
      })),
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'searchTerm' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 12,
      })),
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 5,
      })),
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'country' }, { name: 'city' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      })),
      safe(client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        limit: 31,
      })),
    ]);

  let realtimeFallback = false;
  let realtimeRes = await safe(client.runRealtimeReport({
    property,
    metrics: [{ name: 'activeUsers' }],
    dimensions: [{ name: 'unifiedPagePathScreen' }],
    limit: 8,
  }));

  if (!realtimeRes) {
    realtimeFallback = true;
    realtimeRes = await safe(client.runRealtimeReport({
      property,
      metrics: [{ name: 'activeUsers' }],
    }));
  }

  const totalRow = totalsRes?.[0]?.rows?.[0];

  return {
    totals: {
      activeUsers: toNumber(totalRow?.metricValues?.[0]?.value),
      sessions: toNumber(totalRow?.metricValues?.[1]?.value),
      pageViews: toNumber(totalRow?.metricValues?.[2]?.value),
      eventCount: toNumber(totalRow?.metricValues?.[3]?.value),
      avgSessionDuration: toNumber(totalRow?.metricValues?.[4]?.value),
    },
    pages: mapRows(pagesRes?.[0]?.rows || []),
    sources: mapRows(sourcesRes?.[0]?.rows || []),
    events: mapRows(eventsRes?.[0]?.rows || []),
    searchTerms: mapRows(searchTermsRes?.[0]?.rows || []),
    devices: mapRows(devicesRes?.[0]?.rows || []),
    locations: mapRows(locationsRes?.[0]?.rows || [], 0, 0),
    timeseries: (timeseriesRes?.[0]?.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      sessions: toNumber(row.metricValues?.[0]?.value),
      activeUsers: toNumber(row.metricValues?.[1]?.value),
    })),
    realtime: {
      activeUsers: toNumber(realtimeRes?.[0]?.rows?.[0]?.metricValues?.[0]?.value),
      pages: mapRealtimeRows(realtimeRes?.[0]?.rows || []),
    },
    realtimeFallback,
  };
}
