// app/api/admin/faq/route.ts
// API per CRUD complet de FAQs
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtenir totes les FAQs
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const faqs = await prisma.fAQ.findMany({
      include: {
        translations: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json({
      ok: true,
      faqs,
    });
  } catch (error) {
    log.error('Error obtenint FAQs:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obtenint FAQs' },
      { status: 500 }
    );
  }
}

// POST - Crear nova FAQ
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    const { slug, category, order, isActive, translations } = body;

    if (!slug || !translations || translations.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Slug i traduccions són requerits' },
        { status: 400 }
      );
    }

    // Verificar que el slug no existeixi
    const existing = await prisma.fAQ.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Ja existeix una FAQ amb aquest slug' },
        { status: 400 }
      );
    }

    // Crear FAQ amb traduccions
    const faq = await prisma.fAQ.create({
      data: {
        slug,
        category: category || 'general',
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        translations: {
          create: translations.map((t: any) => ({
            locale: t.locale,
            question: t.question,
            answer: t.answer,
          })),
        },
      },
      include: {
        translations: true,
      },
    });

    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        entity: 'faq',
        entityId: faq.id,
        details: { slug: faq.slug },
      },
    });

    return NextResponse.json({
      ok: true,
      faq,
    });
  } catch (error) {
    log.error('Error creant FAQ:', error);
    return NextResponse.json(
      { ok: false, error: 'Error creant FAQ' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar FAQ
export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID requerido' },
        { status: 400 }
      );
    }

    await prisma.fAQ.delete({
      where: { id },
    });

    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'faq',
        entityId: id,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    log.error('Error eliminant FAQ:', error);
    return NextResponse.json(
      { ok: false, error: 'Error eliminant FAQ' },
      { status: 500 }
    );
  }
}
