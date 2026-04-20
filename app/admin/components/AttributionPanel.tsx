import type { ChannelCredit, LeadJourney, MultiTouchReport } from '@/lib/services/attributionService';

function formatEuro(v: number): string {
  if (v === 0) return '—';
  return `${Math.round(v).toLocaleString('ca-ES')}€`;
}

function formatPct(value: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
  });
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
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className={`text-lg font-black ${tone}`}>{value}</p>
        <span className="text-[10px] text-white/45">{formatPct(value, total)}</span>
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
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/90">{channel.label}</p>
          <p className="mt-1 text-[11px] text-white/45">
            {channel.totalTouchpoints} touchpoints · {channel.firstTouchCount + channel.lastTouchCount} moments clau
          </p>
        </div>
        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/[0.10] px-2.5 py-1 text-[10px] font-bold text-cyan-200">
          {formatPct(channel.totalTouchpoints, maxTouchpoints || 1)} del top
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="flex h-full">
          <div className="bg-cyan-400/80" style={{ width: `${firstShare}%` }} />
          <div className="bg-amber-400/80" style={{ width: `${assistShare}%` }} />
          <div className="bg-emerald-400/80" style={{ width: `${lastShare}%` }} />
        </div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.04]">
        <div className="h-full rounded-full bg-white/30" style={{ width: `${Math.max(8, intensity)}%` }} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <StageStat label="Primer touch" value={channel.firstTouchCount} total={channel.totalTouchpoints} tone="text-cyan-300" />
        <StageStat label="Assists" value={channel.assistCount} total={channel.totalTouchpoints} tone="text-amber-300" />
        <StageStat label="Últim touch" value={channel.lastTouchCount} total={channel.totalTouchpoints} tone="text-emerald-300" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-white/10 bg-black/10 p-2">
          <p className="opacity-45">Ingressos d&apos;entrada</p>
          <p className="mt-1 font-semibold text-cyan-200">{formatEuro(channel.firstTouchRevenue)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/10 p-2">
          <p className="opacity-45">Ingressos de tancament</p>
          <p className="mt-1 font-semibold text-emerald-200">{formatEuro(channel.lastTouchRevenue)}</p>
        </div>
      </div>
    </article>
  );
}

function JourneyCard({ journey }: { journey: LeadJourney }) {
  const timeline = [
    { label: 'Entrada', channel: journey.firstTouch.label, tone: 'border-cyan-500/30 bg-cyan-500/[0.07] text-cyan-100' },
    ...journey.assists.map((assist, index) => ({
      label: `Assist ${index + 1}`,
      channel: assist.label,
      tone: 'border-amber-500/30 bg-amber-500/[0.07] text-amber-100',
    })),
    ...(journey.lastTouch ? [{ label: 'Tancament', channel: journey.lastTouch.label, tone: 'border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-100' }] : []),
  ];

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/90">Lead {journey.leadId.slice(0, 8)}</p>
          <p className="mt-1 text-[11px] text-white/45">
            {journey.touchpointCount} touchpoints · {journey.status} · {formatMoment(journey.firstTouch.timestamp)}
          </p>
        </div>
        <div className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70">
          {formatEuro(journey.revenue)}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {timeline.map((step, index) => (
          <div key={`${step.label}-${step.channel}-${index}`} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${step.tone}`}>
            <span className="opacity-65">{step.label}:</span> {step.channel}
          </div>
        ))}
      </div>
    </article>
  );
}

function EmptyState({ hasLeads }: { hasLeads: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/65">
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
    <section className="rounded-2xl border border-white/10 p-5 admin-card-glass space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">🧭 Atribució multi-touch</h2>
          <p className="mt-1 max-w-2xl text-xs opacity-70">
            Llegeix quin canal obre el lead, quin el manté viu i quin acaba tancant la venda als últims {report.windowDays} dies.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/65">
          {report.totalLeads} leads analitzats · {report.wonLeads} guanyats
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-55">Canal que porta</p>
          <p className="mt-1 text-lg font-black text-cyan-200">{topFirst?.label ?? '—'}</p>
          <p className="mt-1 text-[11px] opacity-55">{topFirst ? `${topFirst.firstTouchCount} primers contactes` : 'Sense dades'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-55">Canal que acompanya</p>
          <p className="mt-1 text-lg font-black text-amber-200">{topAssist?.label ?? '—'}</p>
          <p className="mt-1 text-[11px] opacity-55">{topAssist ? `${topAssist.assistCount} assists` : 'Sense assists registrats'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-55">Canal que tanca</p>
          <p className="mt-1 text-lg font-black text-emerald-200">{topLast?.label ?? '—'}</p>
          <p className="mt-1 text-[11px] opacity-55">{topLast ? `${topLast.lastTouchCount} últims contactes` : 'Sense tancaments registrats'}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-55">Journey mitjà</p>
          <p className="mt-1 text-lg font-black text-white">{avgJourneyTouches > 0 ? avgJourneyTouches : '—'}</p>
          <p className="mt-1 text-[11px] opacity-55">{hasWins ? 'touchpoints per venda guanyada' : 'pendent de conversions'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] p-4 text-sm leading-relaxed text-white/75">
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
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Mapa de crèdit</p>
                  <h3 className="mt-1 text-base font-semibold text-white/90">Qui obre, qui escalfa i qui tanca</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/[0.10] px-2 py-1 text-cyan-200">First touch</span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.10] px-2 py-1 text-amber-200">Assist</span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.10] px-2 py-1 text-emerald-200">Last touch</span>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {report.byChannel.map((channel) => (
                  <ChannelCard key={channel.channel} channel={channel} maxTouchpoints={maxTouchpoints} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Lectures clau</p>
                <div className="mt-3 space-y-2">
                  {(report.insights.length > 0 ? report.insights : ['Encara no hi ha prou varietat de touchpoints per extreure una lectura més fina.']).map((insight) => (
                    <div key={insight} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Snapshot ràpid</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Canals actius</p>
                    <p className="mt-1 text-2xl font-black">{report.byChannel.length}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Touchpoints totals</p>
                    <p className="mt-1 text-2xl font-black">{report.byChannel.reduce((sum, channel) => sum + channel.totalTouchpoints, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Ingressos first touch</p>
                    <p className="mt-1 text-xl font-black text-cyan-200">
                      {formatEuro(report.byChannel.reduce((sum, channel) => sum + channel.firstTouchRevenue, 0))}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Ingressos last touch</p>
                    <p className="mt-1 text-xl font-black text-emerald-200">
                      {formatEuro(report.byChannel.reduce((sum, channel) => sum + channel.lastTouchRevenue, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Journeys recents</p>
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
