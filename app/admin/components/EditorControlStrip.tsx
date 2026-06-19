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

// Canon Òrbita (Cristina): cards de carbó PLA; l'estat viu a l'ACCENT (eyebrow),
// no com a fons tintat. `info` = neutre (mai blau). Abans eren fons Tailwind
// cyan/amber/emerald directes (el tint blau de la triada a blog/faq/etc.).
const PANEL_BASE = 'border-[var(--line)] bg-[var(--panel)]';

function getStatToneClass(_tone: EditorStat['tone']) {
  return PANEL_BASE;
}

function getPanelToneClass(tone: EditorPanel['tone']) {
  if (tone === 'warning') return { panel: PANEL_BASE, accent: 'admin-tone-text-warning' };
  if (tone === 'success') return { panel: PANEL_BASE, accent: 'admin-tone-text-success' };
  return { panel: PANEL_BASE, accent: 'text-[var(--t3)]' };
}

function getActionToneClass(tone: EditorAction['tone']) {
  if (tone === 'warning') return { panel: PANEL_BASE, accent: 'admin-tone-text-warning' };
  return { panel: PANEL_BASE, accent: 'admin-tone-text-success' };
}

function renderPanel(panel: EditorPanel) {
  const toneClass = getPanelToneClass(panel.tone);
  const statsGridClass =
    panel.stats && panel.stats.length <= 2
      ? 'sm:grid-cols-2'
      : 'sm:grid-cols-3';

  return (
    <article className={`rounded-[var(--o-r-md)] border p-5 ${toneClass.panel}`}>
      <p className={`font-[family-name:var(--mono)] text-xs font-semibold uppercase tracking-[0.16em] ${toneClass.accent}`}>{panel.eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold text-[var(--t)]">{panel.title}</h2>
      {panel.description ? <p className="mt-2 text-sm text-[var(--t2)]">{panel.description}</p> : null}
      {panel.stats && panel.stats.length > 0 ? (
        <div className={`mt-4 grid gap-3 ${statsGridClass}`}>
          {panel.stats.map((stat) => (
            <div key={stat.label} className={`rounded-[var(--o-r-md)] border p-3 ${getStatToneClass(stat.tone)}`}>
              <p className="font-[family-name:var(--mono)] text-xs font-semibold uppercase tracking-wide text-[var(--t3)]">{stat.label}</p>
              <p className="mt-1 font-[family-name:var(--display)] text-[22px] font-bold leading-none text-[var(--t)]">{stat.value}</p>
              {stat.hint ? <p className="text-xs text-[var(--t3)]">{stat.hint}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {panel.items && panel.items.length > 0 ? (
        <div className="mt-4 space-y-2 text-sm text-[var(--t2)]">
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
      <article className={`rounded-[var(--o-r-md)] border p-5 ${actionTone.panel}`}>
        <p className={`font-[family-name:var(--mono)] text-xs font-semibold uppercase tracking-[0.16em] ${actionTone.accent}`}>{action.eyebrow}</p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--t)]">{action.title}</h2>
        <p className="mt-2 text-sm text-[var(--t2)]">{action.description}</p>
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
              <span key={pill} className="rounded-[var(--o-r-sm-2)] border border-[var(--line)] bg-[var(--sunk)] px-3 py-2 text-sm text-[var(--t2)]">
                {pill}
              </span>
            ))}
          </div>
        ) : action.secondaryPills && action.secondaryPills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {action.secondaryPills.map((pill) => (
              <span key={pill} className="rounded-[var(--o-r-sm-2)] border border-[var(--line)] bg-[var(--sunk)] px-3 py-2 text-sm text-[var(--t2)]">
                {pill}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
