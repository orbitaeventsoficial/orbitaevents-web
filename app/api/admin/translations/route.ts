// app/api/admin/translations/route.ts
// API per gestionar traduccions del web
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Obtenir traduccions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const namespace = searchParams.get('namespace');
    const locale = searchParams.get('locale');

    const translations = await prisma.translation.findMany({
      where: {
        ...(namespace && { namespace }),
        ...(locale && { locale }),
      },
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
    });

    // Agrupar per namespace i locale per fàcil ús
    const grouped = translations.reduce((acc, t) => {
      if (!acc[t.namespace]) acc[t.namespace] = {};
      if (!acc[t.namespace][t.locale]) acc[t.namespace][t.locale] = {};
      acc[t.namespace][t.locale][t.key] = t.value;
      return acc;
    }, {} as Record<string, Record<string, Record<string, string>>>);

    return NextResponse.json({
      ok: true,
      translations: grouped,
      raw: translations,
    });
  } catch (error) {
    log.error('Error obtenint traduccions:', error);
    return NextResponse.json(
      { error: 'Error obtenint traduccions' },
      { status: 500 }
    );
  }
}

// PUT - Actualitzar una o més traduccions
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { translations } = body as {
      translations: { namespace: string; key: string; locale: string; value: string }[]
    };

    if (!translations || !Array.isArray(translations)) {
      return NextResponse.json(
        { error: 'Format invàlid' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      translations.map(async ({ namespace, key, locale, value }) => {
        return prisma.translation.upsert({
          where: { namespace_key_locale: { namespace, key, locale } },
          create: {
            namespace,
            key,
            locale,
            value,
            isAutoTranslated: false,
          },
          update: {
            value,
            isAutoTranslated: false,
            lastManualEdit: new Date(),
          },
        });
      })
    );

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'translation',
        details: { count: translations.length },
      },
    });

    return NextResponse.json({
      ok: true,
      updated: results.length,
    });
  } catch (error) {
    log.error('Error actualitzant traduccions:', error);
    return NextResponse.json(
      { error: 'Error actualitzant traduccions' },
      { status: 500 }
    );
  }
}

// POST - Crear nova traducció
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { namespace, key, translations } = body as {
      namespace: string;
      key: string;
      translations: { locale: string; value: string }[];
    };

    if (!namespace || !key || !translations) {
      return NextResponse.json(
        { error: 'namespace, key i translations són obligatoris' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      translations.map(async ({ locale, value }) => {
        return prisma.translation.create({
          data: {
            namespace,
            key,
            locale,
            value,
          },
        });
      })
    );

    return NextResponse.json({
      ok: true,
      created: results.length,
    });
  } catch (error) {
    log.error('Error creant traducció:', error);
    return NextResponse.json(
      { error: 'Error creant traducció' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar traducció
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const namespace = searchParams.get('namespace');
    const key = searchParams.get('key');
    const locale = searchParams.get('locale');

    if (!namespace || !key) {
      return NextResponse.json(
        { error: 'namespace i key són obligatoris' },
        { status: 400 }
      );
    }

    if (locale) {
      // Eliminar traducció específica
      await prisma.translation.delete({
        where: { namespace_key_locale: { namespace, key, locale } },
      });
    } else {
      // Eliminar totes les traduccions d'aquesta clau
      await prisma.translation.deleteMany({
        where: { namespace, key },
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    log.error('Error eliminant traducció:', error);
    return NextResponse.json(
      { error: 'Error eliminant traducció' },
      { status: 500 }
    );
  }
}
