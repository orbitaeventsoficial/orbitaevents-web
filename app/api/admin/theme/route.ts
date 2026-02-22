// app/api/admin/theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'theme.colors';
const ADMIN_CSS_KEY = 'admin.css.custom';
type Locale = 'ca' | 'es' | 'en';
const MESSAGES: Record<Locale, Record<string, string>> = {
  ca: {
    parsingTheme: 'Error interpretant colors del tema:',
    gettingTheme: 'Error obtenint el tema',
    actionRequired: 'Action és obligatori',
    colorsRequired: 'Colors és obligatori',
    invalidColor: 'Color no vàlid per a',
    invalidAction: 'Acció no vàlida',
    messageReset: 'Tema restablert correctament',
    messageSaved: 'Tema desat correctament',
    updatingTheme: 'Error actualitzant el tema',
    label: 'Colors del tema',
    description: 'Paleta de colors personalitzada d’Òrbita Events',
  },
  es: {
    parsingTheme: 'Error parseando colores del tema:',
    gettingTheme: 'Error obteniendo tema',
    actionRequired: 'Action es requerido',
    colorsRequired: 'Colors es requerido',
    invalidColor: 'Color inválido para',
    invalidAction: 'Acción no válida',
    messageReset: 'Tema reseteado correctamente',
    messageSaved: 'Tema guardado correctamente',
    updatingTheme: 'Error actualizando tema',
    label: 'Colores del Tema',
    description: 'Paleta de colores personalizada de Òrbita Events',
  },
  en: {
    parsingTheme: 'Error parsing theme colors:',
    gettingTheme: 'Error fetching theme',
    actionRequired: 'Action is required',
    colorsRequired: 'Colors are required',
    invalidColor: 'Invalid color for',
    invalidAction: 'Invalid action',
    messageReset: 'Theme reset successfully',
    messageSaved: 'Theme saved successfully',
    updatingTheme: 'Error updating theme',
    label: 'Theme Colors',
    description: 'Custom color palette for Òrbita Events',
  },
};

function resolveLocale(req: NextRequest): Locale {
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

interface ThemeColors {
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

const DEFAULT_COLORS: ThemeColors = {
  primary: '#f97316',      // orange-500
  secondary: '#fb923c',    // orange-400
  accent: '#f43f5e',       // rose-500
  background: '#ffffff',   // white
  text: '#0f172a',         // slate-900
  textLight: '#64748b',    // slate-500
  border: '#e2e8f0',       // slate-200
  success: '#10b981',      // green-500
  warning: '#f59e0b',      // amber-500
  error: '#ef4444',        // red-500
};

function buildAdminCssFromTheme(colors: ThemeColors): string {
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

// GET - Obtener colores del tema
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let colors: ThemeColors = DEFAULT_COLORS;

    if (setting) {
      try {
        colors = JSON.parse(setting.value);
      } catch (error) {
        log.error(t.parsingTheme, error);
      }
    }

    return NextResponse.json({
      ok: true,
      colors,
    });
  } catch (error) {
    log.error(t.gettingTheme + ':', error);
    return NextResponse.json(
      { ok: false, error: t.gettingTheme },
      { status: 500 }
    );
  }
}

// POST - Guardar o resetear tema
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const body = await req.json();
    const { action, colors } = body;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: t.actionRequired },
        { status: 400 }
      );
    }

    let finalColors: ThemeColors = DEFAULT_COLORS;

    switch (action) {
      case 'save': {
        if (!colors) {
          return NextResponse.json(
            { ok: false, error: t.colorsRequired },
            { status: 400 }
          );
        }

        // Validar que todos los colores sean válidos (formato HEX)
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        for (const [key, value] of Object.entries(colors)) {
          if (typeof value !== 'string' || !hexColorRegex.test(value)) {
            return NextResponse.json(
              { ok: false, error: `${t.invalidColor} ${key}: ${value}` },
              { status: 400 }
            );
          }
        }

        finalColors = colors;
        break;
      }

      case 'reset': {
        finalColors = DEFAULT_COLORS;
        break;
      }

      default:
        return NextResponse.json(
          { ok: false, error: t.invalidAction },
          { status: 400 }
        );
    }

    // Guardar en BD
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(finalColors),
        type: 'JSON',
        category: 'config',
        label: t.label,
        description: t.description,
      },
      update: {
        value: JSON.stringify(finalColors),
      },
    });

    // Sincronitzar amb el CSS real del panell admin perquè s'apliqui immediatament.
    await prisma.setting.upsert({
      where: { key: ADMIN_CSS_KEY },
      create: {
        key: ADMIN_CSS_KEY,
        value: buildAdminCssFromTheme(finalColors),
        type: 'STRING',
        category: 'config',
        label: 'Custom CSS admin',
        description: 'CSS custom aplicat només al panell admin',
      },
      update: {
        value: buildAdminCssFromTheme(finalColors),
      },
    });

    // Log del cambio
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'theme',
        entityId: SETTING_KEY,
        details: { action },
      },
    });

    return NextResponse.json({
      ok: true,
      message: action === 'reset' ? t.messageReset : t.messageSaved,
      colors: finalColors,
    });
  } catch (error) {
    log.error(t.updatingTheme + ':', error);
    return NextResponse.json(
      { ok: false, error: t.updatingTheme },
      { status: 500 }
    );
  }
}
