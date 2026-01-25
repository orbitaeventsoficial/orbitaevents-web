type UmamiStatValue = { value?: number };

export type UmamiReport = {
  totals: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totalTime: number;
  };
  topPages: { label: string; value: number }[];
  referrers: { label: string; value: number }[];
  countries: { label: string; value: number }[];
  devices: { label: string; value: number }[];
  browsers: { label: string; value: number }[];
  events: { label: string; value: number }[];
};

type UmamiStatsResponse = {
  pageviews?: UmamiStatValue;
  visitors?: UmamiStatValue;
  visits?: UmamiStatValue;
  bounces?: UmamiStatValue;
  totaltime?: UmamiStatValue;
};

type MetricRow = {
  x?: string;
  y?: number;
  value?: number;
  name?: string;
  label?: string;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMetricRows(rows: MetricRow[] | null | undefined) {
  if (!rows?.length) return [];
  return rows.map((row) => ({
    label: row.x || row.name || row.label || 'Desconegut',
    value: toNumber(row.y ?? row.value),
  }));
}

function buildUrl(baseUrl: string, path: string, params: Record<string, string | number>) {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function fetchJson<T>(url: string, token: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    return null;
  }
  return res.json() as Promise<T>;
}

export async function getUmamiReport(websiteId: string): Promise<UmamiReport | null> {
  const token = process.env.UMAMI_API_KEY;
  const base = (process.env.UMAMI_BASE_URL || 'https://cloud.umami.is').replace(/\/$/, '');

  if (!token || !websiteId) return null;

  const endAt = Date.now();
  const startAt = endAt - 1000 * 60 * 60 * 24 * 30;
  const apiBase = `${base}/api`;

  const statsUrl = buildUrl(apiBase, `/websites/${websiteId}/stats`, { startAt, endAt });
  const stats = await fetchJson<UmamiStatsResponse>(statsUrl, token);

  const [topPages, referrers, countries, devices, browsers, events] = await Promise.all([
    fetchJson<MetricRow[]>(
      buildUrl(apiBase, `/websites/${websiteId}/metrics`, { type: 'url', startAt, endAt }),
      token
    ),
    fetchJson<MetricRow[]>(
      buildUrl(apiBase, `/websites/${websiteId}/metrics`, { type: 'referrer', startAt, endAt }),
      token
    ),
    fetchJson<MetricRow[]>(
      buildUrl(apiBase, `/websites/${websiteId}/metrics`, { type: 'country', startAt, endAt }),
      token
    ),
    fetchJson<MetricRow[]>(
      buildUrl(apiBase, `/websites/${websiteId}/metrics`, { type: 'device', startAt, endAt }),
      token
    ),
    fetchJson<MetricRow[]>(
      buildUrl(apiBase, `/websites/${websiteId}/metrics`, { type: 'browser', startAt, endAt }),
      token
    ),
    fetchJson<MetricRow[]>(
      buildUrl(apiBase, `/websites/${websiteId}/metrics`, { type: 'event', startAt, endAt }),
      token
    ),
  ]);

  return {
    totals: {
      pageviews: toNumber(stats?.pageviews?.value),
      visitors: toNumber(stats?.visitors?.value),
      visits: toNumber(stats?.visits?.value),
      bounces: toNumber(stats?.bounces?.value),
      totalTime: toNumber(stats?.totaltime?.value),
    },
    topPages: normalizeMetricRows(topPages),
    referrers: normalizeMetricRows(referrers),
    countries: normalizeMetricRows(countries),
    devices: normalizeMetricRows(devices),
    browsers: normalizeMetricRows(browsers),
    events: normalizeMetricRows(events),
  };
}
