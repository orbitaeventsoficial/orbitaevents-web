type GoogleAdsTotals = {
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
};

type GoogleAdsCampaignRow = {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionsValue: number;
  ctr: number;
};

type GoogleAdsDeviceRow = {
  device: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
};

type GoogleAdsSeriesRow = {
  date: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
};

type GoogleAdsSearchResult = {
  customer?: { currencyCode?: string; currency_code?: string };
  campaign?: { id?: string | number; name?: string; status?: string };
  segments?: { date?: string; device?: string };
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    costMicros?: string | number;
    cost_micros?: string | number;
    conversions?: string | number;
    conversionsValue?: string | number;
    conversions_value?: string | number;
    ctr?: string | number;
  };
};
type GoogleAdsSearchChunk = { results?: GoogleAdsSearchResult[] };

export type GoogleAdsReport = {
  totals: GoogleAdsTotals;
  previousTotals: GoogleAdsTotals;
  currencyCode: string;
  campaigns: GoogleAdsCampaignRow[];
  devices: GoogleAdsDeviceRow[];
  timeseries: GoogleAdsSeriesRow[];
};

export type GoogleAdsConfigStatus = {
  ready: boolean;
  reason?: string;
  missing: string[];
};

type GoogleAdsConfig = {
  developerToken: string;
  customerId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  loginCustomerId?: string;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getStoredRefreshToken(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'integrations.googleAds.refreshToken' },
      select: { value: true },
    });
    return setting?.value || '';
  } catch {
    return '';
  }
}

async function getConfig(): Promise<GoogleAdsConfig | null> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, '');
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || (await getStoredRefreshToken());
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '');

  if (!developerToken || !customerId || !clientId || !clientSecret || !refreshToken) {
    return null;
  }

  return {
    developerToken,
    customerId,
    clientId,
    clientSecret,
    refreshToken,
    loginCustomerId: loginCustomerId || undefined,
  };
}

export async function getGoogleAdsConfigStatus(): Promise<GoogleAdsConfigStatus> {
  const storedRefreshToken = await getStoredRefreshToken();
  const missing: string[] = [];
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!process.env.GOOGLE_ADS_CUSTOMER_ID) missing.push('GOOGLE_ADS_CUSTOMER_ID');
  if (!process.env.GOOGLE_ADS_REFRESH_TOKEN && !storedRefreshToken) {
    missing.push('GOOGLE_ADS_REFRESH_TOKEN (o connexió OAuth des d’Integracions)');
  }
  if (!process.env.GOOGLE_ADS_CLIENT_ID && !process.env.GOOGLE_OAUTH_CLIENT_ID) {
    missing.push('GOOGLE_ADS_CLIENT_ID (o GOOGLE_OAUTH_CLIENT_ID)');
  }
  if (!process.env.GOOGLE_ADS_CLIENT_SECRET && !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    missing.push('GOOGLE_ADS_CLIENT_SECRET (o GOOGLE_OAUTH_CLIENT_SECRET)');
  }

  if (missing.length > 0) {
    return {
      ready: false,
      reason: 'Falten variables per connectar Google Ads API',
      missing,
    };
  }

  return { ready: true, missing: [] };
}

async function getAccessToken(config: GoogleAdsConfig): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`OAuth error ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('No access token from Google OAuth');
  }
  return data.access_token;
}

async function searchStream(
  config: GoogleAdsConfig,
  accessToken: string,
  query: string
): Promise<GoogleAdsSearchResult[]> {
  const endpoint = `https://googleads.googleapis.com/v18/customers/${config.customerId}/googleAds:searchStream`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'developer-token': config.developerToken,
  };
  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Ads API ${response.status}: ${body.slice(0, 400)}`);
  }

  const chunks = (await response.json()) as GoogleAdsSearchChunk[];
  return chunks.flatMap((chunk) => chunk.results || []);
}

function sumTotals(rows: GoogleAdsSeriesRow[]): GoogleAdsTotals {
  return rows.reduce(
    (acc, row) => {
      acc.impressions += row.impressions;
      acc.clicks += row.clicks;
      acc.costMicros += row.costMicros;
      acc.conversions += row.conversions;
      return acc;
    },
    { impressions: 0, clicks: 0, costMicros: 0, conversions: 0, conversionsValue: 0 }
  );
}

export async function getGoogleAdsReport(): Promise<GoogleAdsReport | null> {
  const config = await getConfig();
  if (!config) return null;

  const accessToken = await getAccessToken(config);

  const [dailyRowsRaw, campaignRowsRaw, deviceRowsRaw, customerRowRaw] = await Promise.all([
    searchStream(
      config,
      accessToken,
      `SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value
       FROM customer
       WHERE segments.date DURING LAST_60_DAYS
       ORDER BY segments.date`
    ),
    searchStream(
      config,
      accessToken,
      `SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros, metrics.conversions, metrics.conversions_value
       FROM campaign
       WHERE segments.date DURING LAST_30_DAYS
       ORDER BY metrics.cost_micros DESC
       LIMIT 12`
    ),
    searchStream(
      config,
      accessToken,
      `SELECT segments.device, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
       FROM campaign
       WHERE segments.date DURING LAST_30_DAYS
       ORDER BY metrics.clicks DESC`
    ),
    searchStream(
      config,
      accessToken,
      `SELECT customer.currency_code FROM customer LIMIT 1`
    ),
  ]);

  const currencyCode =
    customerRowRaw?.[0]?.customer?.currencyCode ||
    customerRowRaw?.[0]?.customer?.currency_code ||
    'EUR';

  const dailyRows: GoogleAdsSeriesRow[] = dailyRowsRaw
    .map((row) => ({
      date: String(row?.segments?.date || ''),
      impressions: toNumber(row?.metrics?.impressions),
      clicks: toNumber(row?.metrics?.clicks),
      costMicros: toNumber(row?.metrics?.costMicros ?? row?.metrics?.cost_micros),
      conversions: toNumber(row?.metrics?.conversions),
      conversionsValue: toNumber(row?.metrics?.conversionsValue ?? row?.metrics?.conversions_value),
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, impressions, clicks, costMicros, conversions }) => ({
      date,
      impressions,
      clicks,
      costMicros,
      conversions,
    }));

  const conversionsValueByDate = new Map<string, number>();
  for (const row of dailyRowsRaw) {
    const date = String(row?.segments?.date || '');
    if (!date) continue;
    const value = toNumber(row?.metrics?.conversionsValue ?? row?.metrics?.conversions_value);
    conversionsValueByDate.set(date, (conversionsValueByDate.get(date) || 0) + value);
  }

  const today = new Date();
  const currentStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  currentStart.setUTCDate(currentStart.getUTCDate() - 29);
  const currentStartKey = toDateKey(currentStart);

  const currentSeries = dailyRows.filter((row) => row.date >= currentStartKey);
  const previousSeries = dailyRows.filter((row) => row.date < currentStartKey);

  const totals = sumTotals(currentSeries);
  totals.conversionsValue = currentSeries.reduce(
    (acc, row) => acc + (conversionsValueByDate.get(row.date) || 0),
    0
  );

  const previousTotals = sumTotals(previousSeries);
  previousTotals.conversionsValue = previousSeries.reduce(
    (acc, row) => acc + (conversionsValueByDate.get(row.date) || 0),
    0
  );

  const campaigns: GoogleAdsCampaignRow[] = campaignRowsRaw.map((row) => ({
    id: String(row?.campaign?.id || ''),
    name: String(row?.campaign?.name || 'Campanya'),
    status: String(row?.campaign?.status || ''),
    impressions: toNumber(row?.metrics?.impressions),
    clicks: toNumber(row?.metrics?.clicks),
    costMicros: toNumber(row?.metrics?.costMicros ?? row?.metrics?.cost_micros),
    conversions: toNumber(row?.metrics?.conversions),
    conversionsValue: toNumber(row?.metrics?.conversionsValue ?? row?.metrics?.conversions_value),
    ctr: toNumber(row?.metrics?.ctr),
  }));

  const deviceMap = new Map<string, GoogleAdsDeviceRow>();
  for (const row of deviceRowsRaw) {
    const device = String(row?.segments?.device || 'UNSPECIFIED');
    const prev = deviceMap.get(device) || {
      device,
      impressions: 0,
      clicks: 0,
      costMicros: 0,
      conversions: 0,
    };
    prev.impressions += toNumber(row?.metrics?.impressions);
    prev.clicks += toNumber(row?.metrics?.clicks);
    prev.costMicros += toNumber(row?.metrics?.costMicros ?? row?.metrics?.cost_micros);
    prev.conversions += toNumber(row?.metrics?.conversions);
    deviceMap.set(device, prev);
  }
  const devices = Array.from(deviceMap.values()).sort((a, b) => b.clicks - a.clicks).slice(0, 6);

  return {
    totals,
    previousTotals,
    currencyCode,
    campaigns,
    devices,
    timeseries: currentSeries,
  };
}
import { prisma } from '@/lib/prisma';

