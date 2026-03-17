// app/api/admin/theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import {
  DEFAULT_THEME_COLORS,
  getAdminThemeColors,
  resetAdminThemeColors,
  saveAdminThemeColors,
  validateThemeColors,
} from '@/lib/services/adminThemeService';

export const dynamic = 'force-dynamic';

type Locale = 'ca' | 'es' | 'en';
const MESSAGES: Record<Locale, Record<string, string>> = {
  ca: {
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

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const colors = await getAdminThemeColors();
    return NextResponse.json({ ok: true, colors });
  } catch (error) {
    log.error(t.gettingTheme + ':', error);
    return NextResponse.json({ ok: false, error: t.gettingTheme }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const body = await req.json();
    const { action, colors } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: t.actionRequired }, { status: 400 });
    }

    let finalColors = DEFAULT_THEME_COLORS;

    switch (action) {
      case 'save': {
        if (!colors) {
          return NextResponse.json({ ok: false, error: t.colorsRequired }, { status: 400 });
        }

        const validation = validateThemeColors(colors);
        if (!validation.ok) {
          return NextResponse.json({ ok: false, error: `${t.invalidColor} ${validation.invalidKey}: ${validation.invalidValue}` }, { status: 400 });
        }

        finalColors = await saveAdminThemeColors(validation.colors, {
          label: t.label,
          description: t.description,
        });
        break;
      }
      case 'reset': {
        finalColors = await resetAdminThemeColors({
          label: t.label,
          description: t.description,
        });
        break;
      }
      default:
        return NextResponse.json({ ok: false, error: t.invalidAction }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: action === 'reset' ? t.messageReset : t.messageSaved,
      colors: finalColors,
    });
  } catch (error) {
    log.error(t.updatingTheme + ':', error);
    return NextResponse.json({ ok: false, error: t.updatingTheme }, { status: 500 });
  }
}
