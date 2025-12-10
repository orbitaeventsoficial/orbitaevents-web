// app/api/admin/settings/route.ts
// API per gestionar configuracions globals
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtenir totes les configuracions o per categoria
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const settings = await prisma.setting.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Transformar a objecte per fàcil accés
    const settingsMap = settings.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = {};

      // Parsejar valor segons tipus
      let value: string | number | boolean | object = s.value;
      if (s.type === 'NUMBER') value = parseFloat(s.value);
      if (s.type === 'BOOLEAN') value = s.value === 'true';
      if (s.type === 'JSON') {
        try { value = JSON.parse(s.value); } catch { /* mantenir string */ }
      }

      acc[s.category][s.key] = value;
      return acc;
    }, {} as Record<string, Record<string, unknown>>);

    return NextResponse.json({
      ok: true,
      settings: category ? settingsMap[category] || {} : settingsMap,
      raw: settings,
    });
  } catch (error) {
    console.error('Error obtenint settings:', error);
    return NextResponse.json(
      { error: 'Error obtenint configuracions' },
      { status: 500 }
    );
  }
}

// PUT - Actualitzar una o més configuracions
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body as { settings: { key: string; value: string | number | boolean }[] };

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Format invàlid' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      settings.map(async ({ key, value }) => {
        const stringValue = typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

        return prisma.setting.update({
          where: { key },
          data: { value: stringValue },
        });
      })
    );

    // Log d'administració
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'setting',
        details: { keys: settings.map(s => s.key) },
      },
    });

    return NextResponse.json({
      ok: true,
      updated: results.length,
    });
  } catch (error) {
    console.error('Error actualitzant settings:', error);
    return NextResponse.json(
      { error: 'Error actualitzant configuracions' },
      { status: 500 }
    );
  }
}

// POST - Crear nova configuració
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, type, category, label, description } = body;

    if (!key || !category) {
      return NextResponse.json(
        { error: 'key i category són obligatoris' },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.create({
      data: {
        key,
        value: String(value || ''),
        type: type || 'STRING',
        category,
        label,
        description,
      },
    });

    return NextResponse.json({
      ok: true,
      setting,
    });
  } catch (error) {
    console.error('Error creant setting:', error);
    return NextResponse.json(
      { error: 'Error creant configuració' },
      { status: 500 }
    );
  }
}
