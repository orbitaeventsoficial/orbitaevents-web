import type { ChannelCredit, LeadJourney, MultiTouchReport } from '@/lib/services/attributionService';
import { formatCurrency, formatDateShort } from '@/lib/constants';

function formatEuro(v: number): string {
  if (v === 0) return '—';
  return formatCurrency(Math.round(v));
}

function formatPct(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function formatMoment(iso: string): string {
  return formatDateShort(iso);
}

function StageStat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  return (
    <div className="ap-card p-2">
      <p className="text-xs font-semibold uppercase tracking-wider opacity-50">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className={`text-lg font-bold ${tone}`}>{value}</p>
        <span className="text-xs admin-cr-meta">{formatPct(value, total)}</span>
      </div>
    </div>
  );
}

function ChannelCard({
  channel,
  maxTouchpoints,
}: {
  channel: ChannelCredit;
  maxTouchpoints: number;
}) {
  const firstShare = channel.totalTouchpoints > 0 ? (channel.firstTouchCount / channel.totalTouchpoints) * 100 : 0;
  const assistShare = channel.totalTouchpoints > 0 ? (channel.assistCount / channel.totalTouchpoints) * 100 : 0;
  const lastShare = channel.totalTouchpoints > 0 ? (channel.lastTouchCount / channel.totalTouchpoints) * 100 : 0;
  const intensity = maxTouchpoints > 0 ? (channel.totalTouchpoints / maxTouchpoints) * 100 : 0;

  return (
    <article className="ap-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{channel.label}</p>
          <p className="mt-1 text-xs admin-cr-meta">
            {channel.totalTouchpoints} touchpoints · {channel.firstTouchCount + channel.lastTouchCount} moments clau
          </p>
        </div>
        <div className="rounded-full border admin-tone-border-cyan admin-tone-bg-cyan px-2.5 py-1 text-xs font-bold admin-tone-text-cyan">
          {formatPct(channel.totalTouchpoints, maxTouchpoints || 1)} del top
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--o-admin-fill-3)]">
        <div className="flex h-full">
          <div className="bg-[var(--o-info)]" style={{ width: `${firstShare}%` }} />
          <div className="bg-[var(--o-warning)]" style={{ width: `${assistShare}%` }} />
          <div className="bg-[var(--o-success)]" style={{ width: `${lastShare}%` }} />
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--o-admin-fill-2)]">
        <div className="h-full rounded-full bg-[var(--ax-line)]" style={{ width: `${Math.max(8, intensity)}%` }} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <StageStat label="Primer touch" value={channel.firstTouchCount} total={channel.totalTouchpoints} tone="admin-tone-text-cyan" />
        <StageStat label="Assists" value={channel.assistCount} total={channel.totalTouchpoints} tone="admin-tone-text-warning" />
        <StageStat label="Últim touch" value={channel.lastTouchCount} total={channel.totalTouchpoints} tone="admin-tone-text-success" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="admin-cr-mini-card admin-cr-card-pad">
          <p className="opacity-45">Ingressos d&apos;entrada</p>
          <p className="mt-1 font-semibold admin-tone-text-cyan">{formatEuro(channel.firstTouchRevenue)}</p>
        </div>
        <div className="admin-cr-mini-card admin-cr-card-pad">
          <p className="opacity-45">Ingressos de tancament</p>
          <p className="mt-1 font-semibold admin-tone-text-success">{formatEuro(channel.lastTouchRevenue)}</p>
        </div>
      </div>
    </article>
  );
}

function JourneyCard({ journey }: { journey: LeadJourney }) {
  const timeline = [
    { label: 'Entrada', channel: journey.firstTouch.label, tone: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan' },
    ...journey.assists.map((assist, index) => ({
      label: `Assist ${index + 1}`,
      channel: assist.label,
      tone: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
    })),
    ...(journey.lastTouch ? [{ label: 'Tancament', channel: journey.lastTouch.label, tone: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success' }] : []),
  ];

  return (
    <article className="ap-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Lead {journey.leadId.slice(0, 8)}</p>
          <p className="mt-1 text-xs admin-cr-meta">
            {journey.touchpointCount} touchpoints · {journey.status} · {formatMoment(journey.firstTouch.timestamp)}
          </p>
        </div>
        <div className="admin-cr-chip">
          {formatEuro(journey.revenue)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {timeline.map((step, index) => (
          <div key={`${step.label}-${step.channel}-${index}`} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${step.tone}`}>
            <span className="opacity-65">{step.label}:</span> {step.channel}
          </div>
        ))}
      </div>
    </article>
  );
}

function EmptyState({ hasLeads }: { hasLeads: boolean }) {
  return (
    <div className="ap-card p-4 text-sm text-white/65">
      {hasLeads
        ? 'Hi ha leads al període, però encara no hi ha conversions guanyades per construir el journey multi-touch.'
        : 'Sense leads al període. Quan entrin conversions, aquí es veurà quin canal obre, acompanya i tanca cada venda.'}
    </div>
  );
}

export default function AttributionPanel({ report }: { report: MultiTouchReport }) {
  const hasWins = report.wonLeads > 0;
  const maxTouchpoints = report.byChannel[0]?.totalTouchpoints ?? 0;
  const avgJourneyTouches = hasWins
    ? Math.round((report.journeys.reduce((sum, journey) => sum + journey.touchpointCount, 0) / report.journeys.length) * 10) / 10
    : 0;
  const topFirst = report.byChannel.reduce<ChannelCredit | null>((best, channel) => (
    !best || channel.firstTouchCount > best.firstTouchCount ? channel : best
  ), null);
  const topAssist = report.byChannel.reduce<ChannelCredit | null>((best, channel) => (
    !best || channel.assistCount > best.assistCount ? channel : best
  ), null);
  const topLast = report.byChannel.reduce<ChannelCredit | null>((best, channel) => (
    !best || channel.lastTouchCount > best.lastTouchCount ? channel : best
  ), null);

  return (
    <section className="admin-cr-panel admin-cr-attribution-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Atribució multi-touch</h2>
          <p className="mt-1 max-w-2xl text-xs opacity-70">
            Llegeix quin canal obre el lead, quin el manté viu i quin acaba tancant la venda als últims {report.windowDays} dies.
          </p>
        </div>
        <div className="ap-card px-3 py-2 text-xs text-white/65">
          {report.totalLeads} leads analitzats · {report.wonLeads} guanyats
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="ap-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-55">Canal que porta</p>
          <p className="mt-1 text-lg font-bold admin-tone-text-cyan">{topFirst?.label ?? '—'}</p>
          <p className="mt-1 text-xs opacity-55">{topFirst ? `${topFirst.firstTouchCount} primers contactes` : 'Sense dades'}</p>
        </div>
        <div className="ap-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-55">Canal que acompanya</p>
          <p className="mt-1 text-lg font-bold admin-tone-text-warning">{topAssist?.label ?? '—'}</p>
          <p className="mt-1 text-xs opacity-55">{topAssist ? `${topAssist.assistCount} assists` : 'Sense assists registrats'}</p>
        </div>
        <div className="ap-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-55">Canal que tanca</p>
          <p className="mt-1 text-lg font-bold admin-tone-text-success">{topLast?.label ?? '—'}</p>
          <p className="mt-1 text-xs opacity-55">{topLast ? `${topLast.lastTouchCount} últims contactes` : 'Sense tancaments registrats'}</p>
        </div>
        <div className="ap-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-55">Journey mitjà</p>
          <p className="mt-1 text-lg font-bold text-white">{avgJourneyTouches > 0 ? avgJourneyTouches : '—'}</p>
          <p className="mt-1 text-xs opacity-55">{hasWins ? 'touchpoints per venda guanyada' : 'pendent de conversions'}</p>
        </div>
      </div>

      <div className="rounded-xl border admin-tone-border-cyan admin-tone-bg-cyan p-4 text-sm leading-relaxed text-white/75">
        <span className="font-semibold text-white/95">Veredicte:</span> {report.verdict}
      </div>

      {!hasWins ? (
        <EmptyState hasLeads={report.totalLeads > 0} />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Mapa de crèdit</p>
                  <h3 className="mt-1 text-base font-semibold text-white/90">Qui obre, qui escalfa i qui tanca</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border admin-tone-border-cyan admin-tone-bg-cyan px-2 py-1 admin-tone-text-cyan">First touch</span>
                  <span className="rounded-full border admin-tone-border-warning admin-tone-bg-warning px-2 py-1 admin-tone-text-warning">Assist</span>
                  <span className="rounded-full border admin-tone-border-success admin-tone-bg-success px-2 py-1 admin-tone-text-success">Last touch</span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {report.byChannel.map((channel) => (
                  <ChannelCard key={channel.channel} channel={channel} maxTouchpoints={maxTouchpoints} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="ap-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Lectures clau</p>
                <div className="mt-3 space-y-2">
                  {(report.insights.length > 0 ? report.insights : ['Encara no hi ha prou varietat de touchpoints per extreure una lectura més fina.']).map((insight) => (
                    <div key={insight} className="ap-card px-3 py-2 text-sm text-white/75">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              <div className="ap-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Snapshot ràpid</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="admin-cr-mini-card admin-cr-card-pad">
                    <p className="text-xs uppercase tracking-wider opacity-50">Canals actius</p>
                    <p className="mt-1 text-2xl font-bold">{report.byChannel.length}</p>
                  </div>
                  <div className="admin-cr-mini-card admin-cr-card-pad">
                    <p className="text-xs uppercase tracking-wider opacity-50">Touchpoints totals</p>
                    <p className="mt-1 text-2xl font-bold">{report.byChannel.reduce((sum, channel) => sum + channel.totalTouchpoints, 0)}</p>
                  </div>
                  <div className="admin-cr-mini-card admin-cr-card-pad">
                    <p className="text-xs uppercase tracking-wider opacity-50">Ingressos first touch</p>
                    <p className="mt-1 text-xl font-bold admin-tone-text-cyan">
                      {formatEuro(report.byChannel.reduce((sum, channel) => sum + channel.firstTouchRevenue, 0))}
                    </p>
                  </div>
                  <div className="admin-cr-mini-card admin-cr-card-pad">
                    <p className="text-xs uppercase tracking-wider opacity-50">Ingressos last touch</p>
                    <p className="mt-1 text-xl font-bold admin-tone-text-success">
                      {formatEuro(report.byChannel.reduce((sum, channel) => sum + channel.lastTouchRevenue, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Journeys recents</p>
              <h3 className="mt-1 text-base font-semibold text-white/90">Mostra curta de vendes guanyades</h3>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {report.journeys.slice(0, 4).map((journey) => (
                <JourneyCard key={journey.leadId} journey={journey} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
