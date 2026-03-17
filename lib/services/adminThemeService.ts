import { prisma } from '@/lib/prisma';

const THEME_KEY = 'theme.colors';
const ADMIN_CSS_KEY = 'admin.css.custom';
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textLight: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  primary: '#f97316',
  secondary: '#fb923c',
  accent: '#f43f5e',
  background: '#ffffff',
  text: '#0f172a',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export function buildAdminCssFromTheme(colors: ThemeColors): string {
  return `/* Auto-generated from /admin/theme */
html.admin-mode .admin-layout-body,
html.admin-mode .admin-layout-shell {
  background: ${colors.background} !important;
  color: ${colors.text} !important;
}

html.admin-mode .admin-sidebar,
html.admin-mode .admin-mobile-header,
html.admin-mode .admin-desktop-header,
html.admin-mode .admin-bottom-nav {
  background: ${colors.secondary} !important;
  border-color: ${colors.border} !important;
}

html.admin-mode .admin-main-shell,
html.admin-mode .admin-shell > :is(section, article, aside, .panel, .card, .rounded-xl, .rounded-2xl, .rounded-3xl),
html.admin-mode .admin-shell .admin-control-room .admin-cr-panel,
html.admin-mode .admin-shell .admin-control-room .admin-ui-card,
html.admin-mode .admin-shell .admin-control-room .admin-ui-metric-card {
  background: ${colors.primary} !important;
  border-color: ${colors.border} !important;
}

html.admin-mode .admin-shell :is(h1, h2, h3, p, label, td, th, li, span),
html.admin-mode .admin-shell .admin-cr-title,
html.admin-mode .admin-shell .admin-cr-h2,
html.admin-mode .admin-shell .admin-ui-card-title {
  color: ${colors.text} !important;
}

html.admin-mode .admin-shell :is(.admin-cr-subtitle, .admin-cr-small, .admin-cr-meta, .admin-ui-card-subtitle, .text-slate-400, .text-slate-500, .text-slate-600) {
  color: ${colors.textLight} !important;
}

html.admin-mode .admin-shell :is(button, [role='button'], a.inline-flex):not(.admin-keep-colors) {
  background: ${colors.accent} !important;
  border-color: ${colors.border} !important;
  color: ${colors.background} !important;
}

html.admin-mode .admin-shell .admin-ui-btn--primary {
  background: ${colors.accent} !important;
  border-color: ${colors.accent} !important;
  color: ${colors.background} !important;
}

html.admin-mode .admin-shell .admin-tone-success,
html.admin-mode .admin-shell .admin-cr-tone-emerald {
  color: ${colors.success} !important;
  border-color: ${colors.success} !important;
}

html.admin-mode .admin-shell .admin-tone-warning,
html.admin-mode .admin-shell .admin-cr-tone-amber {
  color: ${colors.warning} !important;
  border-color: ${colors.warning} !important;
}

html.admin-mode .admin-shell .admin-tone-danger,
html.admin-mode .admin-shell .admin-cr-tone-rose {
  color: ${colors.error} !important;
  border-color: ${colors.error} !important;
}

html.admin-mode .admin-shell .admin-cr-alert--error { border-color: ${colors.error} !important; }
html.admin-mode .admin-shell .admin-cr-alert--warning { border-color: ${colors.warning} !important; }
html.admin-mode .admin-shell .admin-cr-alert--info { border-color: ${colors.accent} !important; }
`;
}

export function parseThemeColors(input: unknown): ThemeColors {
  if (!input || typeof input !== 'object') return DEFAULT_THEME_COLORS;

  const candidate = input as Partial<Record<keyof ThemeColors, unknown>>;
  const next: ThemeColors = { ...DEFAULT_THEME_COLORS };

  for (const key of Object.keys(DEFAULT_THEME_COLORS) as Array<keyof ThemeColors>) {
    const value = candidate[key];
    if (typeof value === 'string' && HEX_COLOR_REGEX.test(value)) {
      next[key] = value;
    }
  }

  return next;
}

export function validateThemeColors(input: unknown): { ok: true; colors: ThemeColors } | { ok: false; invalidKey: string; invalidValue: unknown } {
  if (!input || typeof input !== 'object') {
    return { ok: false, invalidKey: 'colors', invalidValue: input };
  }

  const candidate = input as Record<string, unknown>;
  for (const [key, value] of Object.entries(candidate)) {
    if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value)) {
      return { ok: false, invalidKey: key, invalidValue: value };
    }
  }

  return { ok: true, colors: parseThemeColors(candidate) };
}

export async function getAdminThemeColors(): Promise<ThemeColors> {
  const setting = await prisma.setting.findUnique({ where: { key: THEME_KEY } });
  if (!setting?.value) return DEFAULT_THEME_COLORS;

  try {
    return parseThemeColors(JSON.parse(setting.value));
  } catch {
    return DEFAULT_THEME_COLORS;
  }
}

export async function saveAdminThemeColors(input: ThemeColors, meta: { label: string; description: string }): Promise<ThemeColors> {
  const colors = parseThemeColors(input);
  const adminCss = buildAdminCssFromTheme(colors);

  await prisma.setting.upsert({
    where: { key: THEME_KEY },
    create: {
      key: THEME_KEY,
      value: JSON.stringify(colors),
      type: 'JSON',
      category: 'config',
      label: meta.label,
      description: meta.description,
    },
    update: {
      value: JSON.stringify(colors),
    },
  });

  await prisma.setting.upsert({
    where: { key: ADMIN_CSS_KEY },
    create: {
      key: ADMIN_CSS_KEY,
      value: adminCss,
      type: 'STRING',
      category: 'config',
      label: 'Custom CSS admin',
      description: 'CSS custom aplicat només al panell admin',
    },
    update: {
      value: adminCss,
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'theme',
      entityId: THEME_KEY,
      details: { action: 'save' },
    },
  });

  return colors;
}

export async function resetAdminThemeColors(meta: { label: string; description: string }): Promise<ThemeColors> {
  const colors = await saveAdminThemeColors(DEFAULT_THEME_COLORS, meta);

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'theme',
      entityId: THEME_KEY,
      details: { action: 'reset' },
    },
  }).catch(() => undefined);

  return colors;
}
