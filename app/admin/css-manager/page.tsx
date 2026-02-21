'use client';

import { useEffect, useState } from 'react';

const EXAMPLE_CSS = `/* Exemple: admin pastel i semàfors */
html.admin-mode .admin-layout-shell {
  --tone-surface: #1e2228;
}

.admin-cr-alert--error { background: #3b2027 !important; border-color: #b85a74 !important; }
.admin-cr-alert--warning { background: #3a2c1d !important; border-color: #c19a57 !important; }
.admin-cr-alert--info { background: #253244 !important; border-color: #5d87b5 !important; }`;

type Palette = {
  id: string;
  name: string;
  description: string;
  surface: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
};

const PALETTES: Palette[] = [
  {
    id: 'corporate-neutral',
    name: 'Corporativa Neutra',
    description: 'Sobria, legible y estable',
    surface: '#1f2124',
    panel: '#2b2e34',
    border: '#4a4f59',
    text: '#edf0f5',
    muted: '#b7beca',
    primary: '#98adc8',
    success: '#92c8a2',
    warning: '#d1bb8a',
    danger: '#cf9baa',
  },
  {
    id: 'pastel-warm',
    name: 'Pastel Càlida',
    description: 'Suave, humana, sin estridencias',
    surface: '#231f20',
    panel: '#322b2d',
    border: '#5a4d50',
    text: '#f5efee',
    muted: '#cabebd',
    primary: '#d1a99d',
    success: '#9ac7a2',
    warning: '#d7be8d',
    danger: '#d4a1ad',
  },
  {
    id: 'pastel-cool',
    name: 'Pastel Freda',
    description: 'Fría limpia, sin neón ni lila',
    surface: '#1f2327',
    panel: '#2a3137',
    border: '#4a5863',
    text: '#edf3f7',
    muted: '#b8c4cd',
    primary: '#9db8c6',
    success: '#94c7b6',
    warning: '#d1c090',
    danger: '#cfa1af',
  },
  {
    id: 'olive-sand',
    name: 'Oliva + Arena',
    description: 'Empresarial, càlida i neta',
    surface: '#1f2220',
    panel: '#2b2f2d',
    border: '#49524d',
    text: '#eef2ee',
    muted: '#b9c3bc',
    primary: '#8bbf9a',
    success: '#7fcf98',
    warning: '#d6b67f',
    danger: '#d08a9b',
  },
  {
    id: 'slate-mint',
    name: 'Pissarra + Menta',
    description: 'Sòlida i moderna sense neó',
    surface: '#1d2128',
    panel: '#2a2f38',
    border: '#465061',
    text: '#edf2fa',
    muted: '#b4bfd3',
    primary: '#82bcae',
    success: '#7ed0a8',
    warning: '#d8ba86',
    danger: '#d18fa1',
  },
  {
    id: 'charcoal-peach',
    name: 'Carbó + Préssec',
    description: 'Pastel amable amb contrast alt',
    surface: '#201f23',
    panel: '#2c2a31',
    border: '#4f4a57',
    text: '#f3f0f8',
    muted: '#c2bbcf',
    primary: '#c7a98f',
    success: '#90caa0',
    warning: '#d7b37d',
    danger: '#d39aa9',
  },
];

function buildPaletteCss(palette: Palette): string {
  return `/* Palette: ${palette.name} */
html.admin-mode .admin-layout-body { background: ${palette.surface} !important; color: ${palette.text} !important; }
html.admin-mode .admin-sidebar,
html.admin-mode .admin-mobile-header,
html.admin-mode .admin-desktop-header,
html.admin-mode .admin-bottom-nav { background: ${palette.panel} !important; border-color: ${palette.border} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-panel,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card,
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card { background: ${palette.panel} !important; border-color: ${palette.border} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-title,
html.admin-mode .admin-shell .admin-control-room .admin-cr-h2,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card-title { color: ${palette.text} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-subtitle,
html.admin-mode .admin-shell .admin-control-room .admin-cr-small,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card-subtitle,
html.admin-mode .admin-shell .admin-control-room .admin-cr-meta { color: ${palette.muted} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-ui-btn--primary { background: ${palette.primary} !important; border-color: ${palette.primary} !important; color: ${palette.surface} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-tone-emerald { color: ${palette.success} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-tone-amber { color: ${palette.warning} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-tone-rose { color: ${palette.danger} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-alert--error { border-color: ${palette.danger} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-alert--warning { border-color: ${palette.warning} !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-alert--info { border-color: ${palette.primary} !important; }

/* Responsive tweak: más aire visual en móvil */
@media (max-width: 768px) {
  html.admin-mode .admin-main-shell { padding: 0.6rem !important; }
  html.admin-mode .admin-shell .admin-control-room .admin-cr-panel { border-radius: 0.8rem !important; }
}`;
}

export default function AdminCssManagerPage() {
  const [css, setCss] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/css', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setCss(typeof data?.css === 'string' ? data.css : '');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/css', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css }),
      });
      if (!res.ok) throw new Error('No s’ha pogut desar el CSS');
      setMsg('CSS desat i aplicat al panell admin.');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error desant CSS');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
        <h1 className="text-2xl font-semibold text-slate-100">CSS PRO</h1>
        <p className="mt-1 text-sm text-slate-400">
          Editor de CSS del panell admin. S&apos;aplica en viu a tot `/admin`.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">Custom CSS</p>
          <button
            type="button"
            onClick={() => setCss(EXAMPLE_CSS)}
            className="rounded-lg border border-slate-600/50 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/70"
          >
            Carregar exemple
          </button>
        </div>
        <textarea
          value={css}
          onChange={(e) => setCss(e.target.value)}
          disabled={loading}
          className="min-h-[420px] w-full rounded-xl border border-slate-700/60 bg-slate-900/70 p-3 font-mono text-xs text-slate-100"
          placeholder="Escriu aquí el teu CSS..."
        />
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-slate-200">Paletes suggerides (responsives)</p>
          <div className="grid gap-2 md:grid-cols-3">
            {PALETTES.map((palette) => (
              <article key={palette.id} className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-3">
                <p className="text-sm font-semibold text-slate-100">{palette.name}</p>
                <p className="text-xs text-slate-400">{palette.description}</p>
                <div className="mt-2 flex gap-1">
                  <span className="h-5 w-5 rounded" style={{ background: palette.surface }} />
                  <span className="h-5 w-5 rounded" style={{ background: palette.panel }} />
                  <span className="h-5 w-5 rounded" style={{ background: palette.primary }} />
                  <span className="h-5 w-5 rounded" style={{ background: palette.success }} />
                  <span className="h-5 w-5 rounded" style={{ background: palette.warning }} />
                  <span className="h-5 w-5 rounded" style={{ background: palette.danger }} />
                </div>
                <button
                  type="button"
                  onClick={() => setCss(buildPaletteCss(palette))}
                  className="mt-3 rounded-lg border border-slate-600/50 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/70"
                >
                  Aplicar paleta
                </button>
              </article>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-60"
          >
            {saving ? 'Desant...' : 'Desar CSS'}
          </button>
          {msg && <p className="text-sm text-slate-300">{msg}</p>}
        </div>
      </section>
    </div>
  );
}
