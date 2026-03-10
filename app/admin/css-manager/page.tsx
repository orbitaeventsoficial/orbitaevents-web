'use client';

import { useEffect, useState } from 'react';
import { AdminPage } from '../components/AdminPage';
import { fetchWithCsrf } from '@/lib/csrf';

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
    description: 'Gris executiu, molt net',
    surface: '#121417',
    panel: '#1f2329',
    border: '#4f5764',
    text: '#f2f5fb',
    muted: '#b8c0ce',
    primary: '#79a8d8',
    success: '#6fc59a',
    warning: '#d7b36d',
    danger: '#d88787',
  },
  {
    id: 'pastel-warm',
    name: 'Pastel Càlida',
    description: 'Arena + terracota suau',
    surface: '#1e1715',
    panel: '#2f2420',
    border: '#6a5248',
    text: '#fff1e8',
    muted: '#d9c0b2',
    primary: '#df9e7f',
    success: '#8dc59b',
    warning: '#e2b66d',
    danger: '#dc8f8f',
  },
  {
    id: 'pastel-cool',
    name: 'Pastel Freda',
    description: 'Blau gel + acer',
    surface: '#121821',
    panel: '#1d2a38',
    border: '#4c6b89',
    text: '#eef6ff',
    muted: '#b6cadf',
    primary: '#7fb3e5',
    success: '#75c7b0',
    warning: '#d7be7a',
    danger: '#d68fa5',
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
  {
    id: 'ocean-board',
    name: 'Oceà Corporatiu',
    description: 'Blau marí + cian net',
    surface: '#0f1a2a',
    panel: '#15304a',
    border: '#3f6f9b',
    text: '#e9f5ff',
    muted: '#a8c6df',
    primary: '#65b8ff',
    success: '#67c89d',
    warning: '#d9bb6b',
    danger: '#d98b95',
  },
  {
    id: 'forest-ops',
    name: 'Forest Ops',
    description: 'Verd operatiu + sorra',
    surface: '#141d18',
    panel: '#223127',
    border: '#4c6c56',
    text: '#eef8f0',
    muted: '#b8cdbd',
    primary: '#88c7a0',
    success: '#63c48d',
    warning: '#d8b773',
    danger: '#d38f97',
  },
  {
    id: 'graphite-gold',
    name: 'Grafit + Or',
    description: 'Executiva premium',
    surface: '#141416',
    panel: '#232327',
    border: '#5a5b64',
    text: '#f8f4e9',
    muted: '#c9c1a8',
    primary: '#d5b66d',
    success: '#8bc39f',
    warning: '#e0bd68',
    danger: '#d98989',
  },
  {
    id: 'ruby-stone',
    name: 'Rubí + Pedra',
    description: 'Càlida intensa, molt diferent',
    surface: '#201417',
    panel: '#341f25',
    border: '#7a4d57',
    text: '#ffeef1',
    muted: '#d9b8bf',
    primary: '#df8ea2',
    success: '#86c7a2',
    warning: '#e0b775',
    danger: '#e1768e',
  },
  {
    id: 'ink-lime',
    name: 'Tinta + Lima',
    description: 'Moderna, molt contrastada',
    surface: '#121815',
    panel: '#1f2a24',
    border: '#4f6c5e',
    text: '#effaf4',
    muted: '#b8d2c5',
    primary: '#9acb7a',
    success: '#75ce98',
    warning: '#d5bc76',
    danger: '#d68f9f',
  },
  {
    id: 'steel-coral',
    name: 'Acer + Coral',
    description: 'Corporativa amb accent viu',
    surface: '#161b22',
    panel: '#222c38',
    border: '#4f637a',
    text: '#edf4ff',
    muted: '#b6c4d8',
    primary: '#df8f84',
    success: '#79c5a4',
    warning: '#d7b871',
    danger: '#dd7c86',
  },
  {
    id: 'midnight-gold',
    name: 'Mitjanit + Or',
    description: 'Executiva premium, contrast alt',
    surface: '#0f1218',
    panel: '#1b2230',
    border: '#485774',
    text: '#f7f0de',
    muted: '#c7ba98',
    primary: '#d5a84a',
    success: '#65b38f',
    warning: '#e0b35b',
    danger: '#c97b7b',
  },
  {
    id: 'navy-crimson',
    name: 'Navy + Crimson',
    description: 'Corporativa potent, molt diferent',
    surface: '#111827',
    panel: '#1f2937',
    border: '#4b5563',
    text: '#f3f4f6',
    muted: '#c1c7d0',
    primary: '#be123c',
    success: '#16a34a',
    warning: '#ca8a04',
    danger: '#dc2626',
  },
  {
    id: 'petrol-copper',
    name: 'Petroli + Coure',
    description: 'Sèria i tècnica, amb accent càlid',
    surface: '#0f1b22',
    panel: '#172a33',
    border: '#40606f',
    text: '#e9f4f8',
    muted: '#afc7d2',
    primary: '#c57d45',
    success: '#52a982',
    warning: '#cf9f44',
    danger: '#c96d6d',
  },
  {
    id: 'graphite-cobalt',
    name: 'Grafit + Cobalt',
    description: 'Perfil empresa modern, net i contundent',
    surface: '#16181d',
    panel: '#222630',
    border: '#4f596b',
    text: '#eef2fb',
    muted: '#bac3d4',
    primary: '#3563e9',
    success: '#2ca87e',
    warning: '#d49a33',
    danger: '#c95a6e',
  },
  {
    id: 'economic-elegant',
    name: 'Econòmic Elegant',
    description: 'Perfil econòmic, sobri i professional',
    surface: '#171a1f',
    panel: '#232933',
    border: '#4a5568',
    text: '#f1f5f9',
    muted: '#b8c2cf',
    primary: '#4f7ea8',
    success: '#5b9c7c',
    warning: '#c79a53',
    danger: '#b46a76',
  },
];

function buildPaletteCss(palette: Palette): string {
  return `/* Palette: ${palette.name} */
html.admin-mode .admin-layout-shell {
  --admin-surface: ${palette.surface};
  --admin-panel: ${palette.panel};
  --admin-border: ${palette.border};
  --admin-text: ${palette.text};
  --admin-muted: ${palette.muted};
  --admin-primary: ${palette.primary};
  --admin-success: ${palette.success};
  --admin-warning: ${palette.warning};
  --admin-danger: ${palette.danger};
}

html.admin-mode .admin-layout-body,
html.admin-mode .admin-layout-shell,
html.admin-mode .admin-main,
html.admin-mode .admin-main-shell {
  background: var(--admin-surface) !important;
  color: var(--admin-text) !important;
}

html.admin-mode .admin-layout-shell .admin-sidebar,
html.admin-mode .admin-layout-shell .admin-mobile-header,
html.admin-mode .admin-layout-shell .admin-desktop-header,
html.admin-mode .admin-layout-shell .admin-mobile-sidebar,
html.admin-mode .admin-layout-shell .admin-bottom-nav,
html.admin-mode .admin-layout-shell .admin-sidebar-foot-card,
html.admin-mode .admin-layout-shell .admin-mobile-sidebar-head {
  background: var(--admin-panel) !important;
  border-color: var(--admin-border) !important;
}

html.admin-mode .admin-layout-shell .admin-sidebar :is(a, p, span),
html.admin-mode .admin-layout-shell .admin-desktop-header :is(a, p, span),
html.admin-mode .admin-layout-shell .admin-mobile-header :is(a, p, span) {
  color: var(--admin-text) !important;
}

html.admin-mode .admin-shell .admin-control-room .admin-cr-panel,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card-head,
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card {
  background: var(--admin-panel) !important;
  border-color: var(--admin-border) !important;
}
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card:hover {
  border-color: var(--admin-primary) !important;
}
html.admin-mode .admin-shell .admin-control-room .admin-cr-title,
html.admin-mode .admin-shell .admin-control-room .admin-cr-h2,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card-title { color: var(--admin-text) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-subtitle,
html.admin-mode .admin-shell .admin-control-room .admin-cr-small,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card-subtitle,
html.admin-mode .admin-shell .admin-control-room .admin-cr-meta { color: var(--admin-muted) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-ui-btn--primary { background: var(--admin-primary) !important; border-color: var(--admin-primary) !important; color: var(--admin-surface) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-tone-emerald { color: var(--admin-success) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-tone-amber { color: var(--admin-warning) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-tone-rose { color: var(--admin-danger) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-alert--error { border-color: var(--admin-danger) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-alert--warning { border-color: var(--admin-warning) !important; }
html.admin-mode .admin-shell .admin-control-room .admin-cr-alert--info { border-color: var(--admin-primary) !important; }

/* Dashboard metric cards that had fixed hover colors */
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card--cyan,
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card--sky {
  border-color: color-mix(in oklab, var(--admin-primary) 70%, white 30%) !important;
}
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card--emerald {
  border-color: var(--admin-success) !important;
}
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card--amber {
  border-color: var(--admin-warning) !important;
}
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card--rose,
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card--purple {
  border-color: var(--admin-danger) !important;
}

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

  function applyLiveCss(nextCss: string) {
    if (typeof document === 'undefined') return;
    let style = document.getElementById('admin-custom-css-live') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'admin-custom-css-live';
      document.head.appendChild(style);
    }
    style.textContent = nextCss;
    const globalStyle = document.getElementById('admin-custom-css') as HTMLStyleElement | null;
    if (globalStyle) globalStyle.textContent = nextCss;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithCsrf('/api/admin/css', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          const loadedCss = typeof data?.css === 'string' ? data.css : '';
          setCss(loadedCss);
          applyLiveCss(loadedCss);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading) applyLiveCss(css);
  }, [css, loading]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetchWithCsrf('/api/admin/css', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css }),
      });
      if (!res.ok) throw new Error('No s’ha pogut desar el CSS');
      setMsg('CSS desat i aplicat al panell admin.');
      applyLiveCss(css);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('admin-css-updated', { detail: { css } }));
      }
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error desant CSS');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage title="CSS Manager" subtitle="Editor de CSS del panell admin. S'aplica en viu a tot /admin." className="admin-css-manager-page">

      <section className="admin-css-panel rounded-2xl border p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Custom CSS</p>
          <button
            type="button"
            onClick={() => setCss(EXAMPLE_CSS)}
            className="admin-keep-colors admin-css-btn admin-css-btn--neutral rounded-xl border px-3 py-1.5 text-xs"
          >
            Carregar exemple
          </button>
        </div>
        <textarea
          value={css}
          onChange={(e) => setCss(e.target.value)}
          disabled={loading}
          className="admin-css-editor min-h-[420px] w-full rounded-xl border p-3 font-mono text-xs"
          placeholder="Escriu aquí el teu CSS..."
        />
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">Paletes suggerides (responsives)</p>
          <div className="grid gap-2 md:grid-cols-3">
            {PALETTES.map((palette) => (
              <article key={palette.id} className="admin-css-palette-card rounded-xl border p-3">
                <p className="text-sm font-semibold">{palette.name}</p>
                <p className="text-xs">{palette.description}</p>
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
                  className="admin-keep-colors admin-css-btn admin-css-btn--neutral mt-3 rounded-xl border px-3 py-1.5 text-xs"
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
            className="admin-keep-colors admin-css-btn admin-css-btn--save rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Desant...' : 'Desar CSS'}
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      </section>
    </AdminPage>
  );
}
