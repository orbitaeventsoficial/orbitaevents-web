import Link from 'next/link';

type EditorStat = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'success' | 'warning';
};

type EditorPanel = {
  eyebrow: string;
  title: string;
  description?: string;
  items?: string[];
  stats?: EditorStat[];
  tone?: 'default' | 'info' | 'warning' | 'success';
};

type EditorAction = {
  eyebrow: string;
  title: string;
  description: string;
  tone?: 'info' | 'warning' | 'success';
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  secondaryPills?: string[];
};

function getStatToneClass(tone: EditorStat['tone']) {
  if (tone === 'success') return 'border-emerald-500/20 bg-emerald-500/[0.05]';
  if (tone === 'warning') return 'border-amber-500/20 bg-amber-500/[0.05]';
  return 'border-white/10 bg-white/[0.03]';
}

function getPanelToneClass(tone: EditorPanel['tone']) {
  if (tone === 'info') return { panel: 'border-cyan-500/25 bg-cyan-500/[0.06]', accent: 'text-cyan-200/80' };
  if (tone === 'warning') return { panel: 'border-amber-500/25 bg-amber-500/[0.06]', accent: 'text-amber-200/80' };
  if (tone === 'success') return { panel: 'border-emerald-500/25 bg-emerald-500/[0.06]', accent: 'text-emerald-200/80' };
  return { panel: 'admin-card-glass', accent: 'text-white/55' };
}

function getActionToneClass(tone: EditorAction['tone']) {
  if (tone === 'warning') return { panel: 'border-amber-500/25 bg-amber-500/[0.06]', accent: 'text-amber-200/80' };
  if (tone === 'info') return { panel: 'border-cyan-500/25 bg-cyan-500/[0.06]', accent: 'text-cyan-200/80' };
  return { panel: 'border-emerald-500/25 bg-emerald-500/[0.06]', accent: 'text-emerald-200/80' };
}

function renderPanel(panel: EditorPanel) {
  const toneClass = getPanelToneClass(panel.tone);
  const statsGridClass =
    panel.stats && panel.stats.length <= 2
      ? 'sm:grid-cols-2'
      : 'sm:grid-cols-3';

  return (
    <article className={`rounded-2xl border p-5 ${toneClass.panel}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass.accent}`}>{panel.eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold text-white/90">{panel.title}</h2>
      {panel.description ? <p className="mt-2 text-sm text-white/75">{panel.description}</p> : null}
      {panel.stats && panel.stats.length > 0 ? (
        <div className={`mt-4 grid gap-3 ${statsGridClass}`}>
          {panel.stats.map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-3 ${getStatToneClass(stat.tone)}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
              {stat.hint ? <p className="text-xs text-white/60">{stat.hint}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {panel.items && panel.items.length > 0 ? (
        <div className="mt-4 space-y-2 text-sm text-white/75">
          {panel.items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function EditorControlStrip({
  overview,
  status,
  action,
  className = '',
}: {
  overview: EditorPanel;
  status: EditorPanel;
  action: EditorAction;
  className?: string;
}) {
  const actionTone = getActionToneClass(action.tone);
  return (
    <section className={`grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr] ${className}`}>
      {renderPanel(overview)}
      {renderPanel(status)}
      <article className={`rounded-2xl border p-5 ${actionTone.panel}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${actionTone.accent}`}>{action.eyebrow}</p>
        <h2 className="mt-2 text-lg font-semibold text-white">{action.title}</h2>
        <p className="mt-2 text-sm text-white/75">{action.description}</p>
        {action.primaryAction ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={action.primaryAction.href} className="ap-btn ap-btn--primary text-sm">
              {action.primaryAction.label}
            </Link>
            {action.secondaryAction ? (
              <Link href={action.secondaryAction.href} className="ap-btn ap-btn--secondary text-sm">
                {action.secondaryAction.label}
              </Link>
            ) : null}
            {action.secondaryPills?.map((pill) => (
              <span key={pill} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80">
                {pill}
              </span>
            ))}
          </div>
        ) : action.secondaryPills && action.secondaryPills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {action.secondaryPills.map((pill) => (
              <span key={pill} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80">
                {pill}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
