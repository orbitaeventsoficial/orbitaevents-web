// app/api/admin/theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'theme.colors';

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

// GET - Obtener colores del tema
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let colors: ThemeColors = DEFAULT_COLORS;

    if (setting) {
      try {
        colors = JSON.parse(setting.value);
      } catch (error) {
        log.error('Error parseando colores del tema:', error);
      }
    }

    return NextResponse.json({
      ok: true,
      colors,
    });
  } catch (error) {
    log.error('Error obteniendo tema:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obteniendo tema' },
      { status: 500 }
    );
  }
}

// POST - Guardar o resetear tema
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { action, colors } = body;

    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'Action es requerido' },
        { status: 400 }
      );
    }

    let finalColors: ThemeColors = DEFAULT_COLORS;

    switch (action) {
      case 'save': {
        if (!colors) {
          return NextResponse.json(
            { ok: false, error: 'Colors es requerido' },
            { status: 400 }
          );
        }

        // Validar que todos los colores sean válidos (formato HEX)
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        for (const [key, value] of Object.entries(colors)) {
          if (typeof value !== 'string' || !hexColorRegex.test(value)) {
            return NextResponse.json(
              { ok: false, error: `Color inválido para ${key}: ${value}` },
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
          { ok: false, error: 'Acción no válida' },
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
        label: 'Colores del Tema',
        description: 'Paleta de colores personalizada de Órbita Events',
      },
      update: {
        value: JSON.stringify(finalColors),
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
      message: action === 'reset' ? 'Tema reseteado correctamente' : 'Tema guardado correctamente',
      colors: finalColors,
    });
  } catch (error) {
    log.error('Error actualizando tema:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualizando tema' },
      { status: 500 }
    );
  }
}
