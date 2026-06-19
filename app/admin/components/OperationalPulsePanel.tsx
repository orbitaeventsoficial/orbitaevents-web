import type { OperationalPulse, PulseLevel } from '@/lib/services/operationalPulseService';

const LEVEL_COLOR: Record<PulseLevel, string> = {
  EXCELLENT: 'admin-tone-text-success',
  GOOD: 'admin-tone-text-cyan',
  WARNING: 'admin-tone-text-warning',
  CRITICAL: 'admin-tone-text-danger',
};

const LEVEL_BG: Record<PulseLevel, string> = {
  EXCELLENT: 'admin-tone-bg-success admin-tone-border-success',
  GOOD: 'admin-tone-bg-cyan admin-tone-border-cyan',
  WARNING: 'admin-tone-bg-warning admin-tone-border-warning',
  CRITICAL: 'admin-tone-bg-danger admin-tone-border-danger',
};

const LEVEL_LABEL: Record<PulseLevel, string> = {
  EXCELLENT: 'Excel·lent',
  GOOD: 'Bé',
  WARNING: 'Atenció',
  CRITICAL: 'Crític',
};

const LEVEL_DOT: Record<PulseLevel, string> = {
  EXCELLENT: 'bg-[var(--o-success)]',
  GOOD: 'bg-[var(--o-info)]',
  WARNING: 'bg-[var(--o-warning)]',
  CRITICAL: 'bg-[var(--o-danger)]',
};

export default function OperationalPulsePanel({ pulse }: { pulse: OperationalPulse }) {
  return (
    <section className={`rounded-2xl border p-4 ${LEVEL_BG[pulse.overallLevel]}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${LEVEL_DOT[pulse.overallLevel]} ${pulse.overallLevel === 'CRITICAL' ? 'animate-pulse' : ''}`} />
          <h2 className="text-sm font-semibold">Pols operatiu</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${LEVEL_COLOR[pulse.overallLevel]}`}>
            {pulse.overallScore}/100 · {LEVEL_LABEL[pulse.overallLevel]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
        {pulse.metrics.map((m) => (
          <div
            key={m.key}
            className="ap-card px-2 py-1.5 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 truncate">{m.label}</p>
            <p className={`text-sm font-bold ${LEVEL_COLOR[m.level]}`}>
              {m.value}{m.unit}
            </p>
            <p className="text-xs opacity-30">{m.target}</p>
          </div>
        ))}
      </div>

      {pulse.pipelineDrivers.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--o-warning)]" />
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Què degrada el pipeline</p>
          </div>
          <div className="mt-2 space-y-2">
            {pulse.pipelineDrivers.map((driver) => (
              <a
                key={`${driver.type}:${driver.href}`}
                href={driver.href}
                className="block ap-card px-3 py-2 transition-colors adm-row-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{driver.title}</p>
                    <p className="mt-1 text-xs opacity-70">{driver.detail}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${LEVEL_COLOR[driver.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING']}`}>
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
