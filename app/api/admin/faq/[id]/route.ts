// app/api/admin/faq/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Obtener una FAQ por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;

    const faq = await prisma.fAQ.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!faq) {
      return NextResponse.json(
        { ok: false, error: 'FAQ no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      faq,
    });
  } catch (error) {
    log.error('Error obtenint FAQ:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obtenint FAQ' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar FAQ
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    const body = await req.json();
    const { slug, category, order, isActive, translations } = body;

    // Preparar datos de actualización
    const updateData: any = {};

    if (slug !== undefined) updateData.slug = slug;
    if (category !== undefined) updateData.category = category;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Actualizar traducciones si se proporcionan
    if (translations && Array.isArray(translations)) {
      updateData.translations = {
        deleteMany: {},
        create: translations.map((t: any) => ({
          locale: t.locale,
          question: t.question,
          answer: t.answer,
        })),
      };
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
      },
    });

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
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
    log.error('Error actualitzant FAQ:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualitzant FAQ' },
      { status: 500 }
    );
  }
}
