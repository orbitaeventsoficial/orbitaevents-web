import Link from 'next/link';
import { getGoogleAdsConfigStatus, getGoogleAdsReport } from '@/lib/analytics/google-ads';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Google Ads | Òrbita Admin',
};

function pctDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('ca-ES', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function GoogleAdsPage() {
  const googleAdsUrl = process.env.NEXT_PUBLIC_GOOGLE_ADS_URL || 'https://ads.google.com';
  const studioUrl = process.env.NEXT_PUBLIC_GOOGLE_ADS_STUDIO_URL || '';
  const status = getGoogleAdsConfigStatus();
  let report = null;
  let reportError: string | null = null;

  if (status.ready) {
    try {
      report = await getGoogleAdsReport();
    } catch (error) {
      reportError = error instanceof Error ? error.message : 'Error desconegut de Google Ads';
    }
  }

  return (
    <GoogleAdsView
      googleAdsUrl={googleAdsUrl}
      studioUrl={studioUrl}
      status={status}
      report={report}
      reportError={reportError}
    />
  );
}

function GoogleAdsView({
  googleAdsUrl,
  studioUrl,
  status,
  report,
  reportError,
}: {
  googleAdsUrl: string;
  studioUrl: string;
  status: ReturnType<typeof getGoogleAdsConfigStatus>;
  report: Awaited<ReturnType<typeof getGoogleAdsReport>>;
  reportError: string | null;
}) {
  const cost = (report?.totals.costMicros || 0) / 1_000_000;
  const prevCost = (report?.previousTotals.costMicros || 0) / 1_000_000;
  const currency = report?.currencyCode || 'EUR';

  const deltas = report
    ? {
        clicks: pctDelta(report.totals.clicks, report.previousTotals.clicks),
        impressions: pctDelta(report.totals.impressions, report.previousTotals.impressions),
        conversions: pctDelta(report.totals.conversions, report.previousTotals.conversions),
        cost: pctDelta(cost, prevCost),
      }
    : null;

  const maxDailyClicks =
    report && report.timeseries.length > 0
      ? Math.max(1, ...report.timeseries.map((row) => row.clicks))
      : 1;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/85 to-amber-950/30 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Google Ads · Operativa</h1>
        <p className="mt-1 text-sm text-slate-300">
          Rendiment de pagament amb lectura directa de Google Ads API i accions ràpides.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={googleAdsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/25"
          >
            Obrir Google Ads
          </a>
          <a
            href="https://ads.google.com/aw/campaigns"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"
          >
            Campanyes
          </a>
          <a
            href="https://ads.google.com/aw/conversions"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/25"
          >
            Conversions
          </a>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center rounded-xl border border-slate-600/60 bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/70"
          >
            Veure analítica interna
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status.ready ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'
            }`}
          >
            {status.ready ? 'API preparada' : 'Config pendent'}
          </span>
          {!status.ready && (
            <span className="text-xs text-amber-200">
              {status.reason}: {status.missing.join(', ')}
            </span>
          )}
        </div>
      </section>

      {report && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
              <p className="text-xs uppercase text-slate-400">Clicks (30d)</p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{report.totals.clicks}</p>
              {deltas?.clicks !== null && deltas?.clicks !== undefined && (
                <p className={`mt-1 text-xs ${deltas.clicks >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {deltas.clicks >= 0 ? '↑' : '↓'} {Math.abs(deltas.clicks).toFixed(1)}% vs 30d anteriors
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
              <p className="text-xs uppercase text-slate-400">Impressions (30d)</p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{report.totals.impressions}</p>
              {deltas?.impressions !== null && deltas?.impressions !== undefined && (
                <p className={`mt-1 text-xs ${deltas.impressions >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {deltas.impressions >= 0 ? '↑' : '↓'} {Math.abs(deltas.impressions).toFixed(1)}% vs 30d anteriors
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
              <p className="text-xs uppercase text-slate-400">Cost (30d)</p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{formatCurrency(cost, currency)}</p>
              {deltas?.cost !== null && deltas?.cost !== undefined && (
                <p className={`mt-1 text-xs ${deltas.cost <= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {deltas.cost <= 0 ? '↓' : '↑'} {Math.abs(deltas.cost).toFixed(1)}% vs 30d anteriors
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
              <p className="text-xs uppercase text-slate-400">Conversions (30d)</p>
              <p className="mt-2 text-3xl font-semibold text-slate-100">{report.totals.conversions.toFixed(1)}</p>
              {deltas?.conversions !== null && deltas?.conversions !== undefined && (
                <p className={`mt-1 text-xs ${deltas.conversions >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {deltas.conversions >= 0 ? '↑' : '↓'} {Math.abs(deltas.conversions).toFixed(1)}% vs 30d anteriors
                </p>
              )}
            </div>
          </section>

          {report.timeseries.length > 0 && (
            <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Tendència 30 dies (Clicks)</h2>
                <span className="text-xs text-slate-400">Escala relativa</span>
              </div>
              <div className="flex h-28 items-end gap-1">
                {report.timeseries.map((row) => {
                  const height = Math.max(4, Math.round((row.clicks / maxDailyClicks) * 100));
                  return (
                    <div
                      key={row.date}
                      className="flex-1 rounded-sm bg-gradient-to-t from-amber-500/70 to-amber-300/80"
                      style={{ height: `${height}%` }}
                      title={`${row.date}: ${row.clicks} clicks`}
                    />
                  );
                })}
              </div>
            </section>
          )}

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70">
              <div className="border-b border-slate-700/70 px-4 py-3 text-sm font-semibold text-slate-200">
                Campanyes (top cost 30d)
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-900/95 text-xs text-slate-400">
                    <tr>
                      <th className="px-4 py-2 text-left">Campanya</th>
                      <th className="px-4 py-2 text-right">Clicks</th>
                      <th className="px-4 py-2 text-right">Cost</th>
                      <th className="px-4 py-2 text-right">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-t border-slate-800/70">
                        <td className="px-4 py-3 text-slate-200">
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-slate-500">{campaign.status}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{campaign.clicks}</td>
                        <td className="px-4 py-3 text-right text-slate-300">
                          {formatCurrency(campaign.costMicros / 1_000_000, currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{campaign.conversions.toFixed(1)}</td>
                      </tr>
                    ))}
                    {report.campaigns.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                          Sense dades de campanyes per als últims 30 dies.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70">
              <div className="border-b border-slate-700/70 px-4 py-3 text-sm font-semibold text-slate-200">
                Rendiment per dispositiu
              </div>
              <div className="p-4 space-y-3">
                {report.devices.map((device) => (
                  <div key={device.device} className="rounded-xl border border-slate-700/70 bg-slate-800/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-200">{device.device}</p>
                      <p className="text-xs text-slate-400">{device.clicks} clicks</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{device.impressions} impressions</span>
                      <span>{formatCurrency(device.costMicros / 1_000_000, currency)}</span>
                    </div>
                  </div>
                ))}
                {report.devices.length === 0 && (
                  <p className="text-center text-sm text-slate-500">Sense dades de dispositiu.</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {studioUrl ? (
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-3">
          <p className="px-2 pb-2 text-xs text-slate-400">
            Panell incrustat (Looker Studio o dashboard compartit)
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-700/60">
            <iframe
              title="Google Ads dashboard"
              src={studioUrl}
              className="h-[72vh] w-full bg-slate-950"
            />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          Per veure un dashboard incrustat aquí, defineix `NEXT_PUBLIC_GOOGLE_ADS_STUDIO_URL` amb l&apos;URL compartida.
        </section>
      )}

      {status.ready && !report && (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          {reportError
            ? `Google Ads API error: ${reportError}`
            : 'Google Ads API està configurada però no ha retornat dades. Revisa permisos del token, customer ID i account access.'}
        </section>
      )}

      <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 text-sm text-slate-300">
        Nota tècnica: la interfície oficial de Google Ads no permet incrustació directa en iframe. Per això el panell usa API + enllaços operatius.
      </section>
    </div>
  );
}
