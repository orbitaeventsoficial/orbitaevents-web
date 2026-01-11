// app/api/admin/features/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Definición de features disponibles
const AVAILABLE_FEATURES = [
  {
    key: 'features.reviews_enabled',
    label: 'Reviews Públicas',
    description: 'Mostrar sección de reseñas y Google Reviews en la web',
    icon: '⭐',
  },
  {
    key: 'features.calendar_enabled',
    label: 'Calendario de Disponibilidad',
    description: 'Mostrar calendario con fechas disponibles/ocupadas',
    icon: '📅',
  },
  {
    key: 'features.offers_enabled',
    label: 'Ofertas Especiales',
    description: 'Mostrar sección de ofertas y promociones',
    icon: '🎁',
  },
  {
    key: 'features.livechat_enabled',
    label: 'Live Chat',
    description: 'Activar chat en vivo para soporte inmediato',
    icon: '💬',
  },
  {
    key: 'features.blog_enabled',
    label: 'Blog',
    description: 'Mostrar sección de blog y artículos',
    icon: '📝',
  },
  {
    key: 'features.configurator_enabled',
    label: 'Configurador de Eventos',
    description: 'Activar configurador interactivo de eventos',
    icon: '🎛️',
  },
];

// GET - Obtener estado de todas las features
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    // Obtener valores actuales de la BD
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: AVAILABLE_FEATURES.map((f) => f.key),
        },
      },
    });

    // Crear mapa de valores
    const settingsMap = new Map(settings.map((s) => [s.key, s.value === 'true']));

    // Construir lista de features con su estado
    const features = AVAILABLE_FEATURES.map((feature) => ({
      key: feature.key,
      label: feature.label,
      description: feature.description,
      icon: feature.icon,
      enabled: settingsMap.get(feature.key) ?? true, // Por defecto true
    }));

    return NextResponse.json({
      ok: true,
      features,
    });
  } catch (error) {
    log.error('Error obteniendo features:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obteniendo features' },
      { status: 500 }
    );
  }
}

// POST - Actualizar estado de una feature
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { key, enabled } = body;

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'Key y enabled son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la feature existe
    const featureExists = AVAILABLE_FEATURES.some((f) => f.key === key);
    if (!featureExists) {
      return NextResponse.json(
        { ok: false, error: 'Feature no válida' },
        { status: 400 }
      );
    }

    // Actualizar o crear el setting
    await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: enabled.toString(),
        type: 'BOOLEAN',
        category: 'config',
        label: AVAILABLE_FEATURES.find((f) => f.key === key)?.label,
        description: AVAILABLE_FEATURES.find((f) => f.key === key)?.description,
      },
      update: {
        value: enabled.toString(),
      },
    });

    // Log del cambio
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'feature',
        entityId: key,
        details: { enabled },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Feature actualizada correctamente',
    });
  } catch (error) {
    log.error('Error actualizando feature:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualizando feature' },
      { status: 500 }
    );
  }
}
