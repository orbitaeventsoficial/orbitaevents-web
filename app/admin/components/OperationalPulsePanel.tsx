import type { OperationalPulse, PulseLevel } from '@/lib/services/operationalPulseService';

const LEVEL_COLOR: Record<PulseLevel, string> = {
  EXCELLENT: 'text-emerald-300',
  GOOD: 'text-cyan-300',
  WARNING: 'text-amber-300',
  CRITICAL: 'text-rose-300',
};

const LEVEL_BG: Record<PulseLevel, string> = {
  EXCELLENT: 'bg-emerald-500/15 border-emerald-500/30',
  GOOD: 'bg-cyan-500/15 border-cyan-500/30',
  WARNING: 'bg-amber-500/15 border-amber-500/30',
  CRITICAL: 'bg-rose-500/15 border-rose-500/30',
};

const LEVEL_LABEL: Record<PulseLevel, string> = {
  EXCELLENT: 'Excel·lent',
  GOOD: 'Bé',
  WARNING: 'Atenció',
  CRITICAL: 'Crític',
};

const LEVEL_DOT: Record<PulseLevel, string> = {
  EXCELLENT: 'bg-emerald-400',
  GOOD: 'bg-cyan-400',
  WARNING: 'bg-amber-400',
  CRITICAL: 'bg-rose-400',
};

export default function OperationalPulsePanel({ pulse }: { pulse: OperationalPulse }) {
  return (
    <section className={`rounded-2xl border p-4 ${LEVEL_BG[pulse.overallLevel]}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${LEVEL_DOT[pulse.overallLevel]} ${pulse.overallLevel === 'CRITICAL' ? 'animate-pulse' : ''}`} />
          <h2 className="text-sm font-semibold">Pols operatiu</h2>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LEVEL_COLOR[pulse.overallLevel]}`}>
            {pulse.overallScore}/100 · {LEVEL_LABEL[pulse.overallLevel]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
        {pulse.metrics.map((m) => (
          <div
            key={m.key}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center"
          >
            <p className="text-[8px] font-semibold uppercase tracking-wider opacity-50 truncate">{m.label}</p>
            <p className={`text-sm font-bold ${LEVEL_COLOR[m.level]}`}>
              {m.value}{m.unit}
            </p>
            <p className="text-[8px] opacity-30">{m.target}</p>
          </div>
        ))}
      </div>

      {pulse.pipelineDrivers.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Què degrada el pipeline</p>
          </div>
          <div className="mt-2 space-y-2">
            {pulse.pipelineDrivers.map((driver) => (
              <a
                key={`${driver.type}:${driver.href}`}
                href={driver.href}
                className="block rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{driver.title}</p>
                    <p className="mt-1 text-xs opacity-70">{driver.detail}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${LEVEL_COLOR[driver.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING']}`}>
                    {driver.priority}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
