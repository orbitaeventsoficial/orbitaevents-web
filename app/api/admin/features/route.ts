// app/api/admin/features/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Definició de funcionalitats disponibles
const AVAILABLE_FEATURES = [
  {
    key: 'features.reviews_enabled',
    label: 'Ressenyes públiques',
    description: 'Mostrar la secció de ressenyes i Google Reviews al web',
    icon: '⭐',
  },
  {
    key: 'features.calendar_enabled',
    label: 'Calendari de disponibilitat',
    description: 'Mostrar calendari amb dates disponibles/ocupades',
    icon: '📅',
  },
  {
    key: 'features.offers_enabled',
    label: 'Ofertes especials',
    description: 'Mostrar secció d’ofertes i promocions',
    icon: '🎁',
  },
  {
    key: 'features.livechat_enabled',
    label: 'Live Chat',
    description: 'Activar xat en viu per a suport immediat',
    icon: '💬',
  },
  {
    key: 'features.blog_enabled',
    label: 'Blog',
    description: 'Mostrar secció de blog i articles',
    icon: '📝',
  },
  {
    key: 'features.configurator_enabled',
    label: 'Configurador d’esdeveniments',
    description: 'Activar configurador interactiu d’esdeveniments',
    icon: '🎛️',
  },
];

// GET - Obtenir estat de totes les funcionalitats
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    // Obtenir valors actuals de la BD
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: AVAILABLE_FEATURES.map((f) => f.key),
        },
      },
    });

    // Crear mapa de valors
    const settingsMap = new Map(settings.map((s) => [s.key, s.value === 'true']));

    // Construir llista de funcionalitats amb el seu estat
    const features = AVAILABLE_FEATURES.map((feature) => ({
      key: feature.key,
      label: feature.label,
      description: feature.description,
      icon: feature.icon,
      enabled: settingsMap.get(feature.key) ?? true, // Per defecte true
    }));

    return NextResponse.json({
      ok: true,
      features,
    });
  } catch (error) {
    log.error('Error obtenint funcionalitats:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obtenint funcionalitats' },
      { status: 500 }
    );
  }
}

// POST - Actualitzar l'estat d'una funcionalitat
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { key, enabled } = body;

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'Key i enabled són obligatoris' },
        { status: 400 }
      );
    }

    // Verificar que la funcionalitat existeix
    const featureExists = AVAILABLE_FEATURES.some((f) => f.key === key);
    if (!featureExists) {
      return NextResponse.json(
        { ok: false, error: 'Funcionalitat no vàlida' },
        { status: 400 }
      );
    }

    // Actualitzar o crear la configuració
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

    // Log del canvi
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
      message: 'Funcionalitat actualitzada correctament',
    });
  } catch (error) {
    log.error('Error actualitzant funcionalitat:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualitzant funcionalitat' },
      { status: 500 }
    );
  }
}
