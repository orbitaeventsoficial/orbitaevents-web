// app/api/admin/faq/route.ts
// API per gestionar FAQs
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const faqSchema = z.object({
  slug: z.string().min(1),
  category: z.string().default('general'),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  translations: z.array(z.object({
    locale: z.string(),
    question: z.string().min(1),
    answer: z.string().min(1),
  })),
});

// GET - Llistar FAQs
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const locale = searchParams.get('locale');

    const faqs = await prisma.fAQ.findMany({
      where: {
        ...(category && { category }),
      },
      include: {
        translations: locale ? { where: { locale } } : true,
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({
      ok: true,
      faqs,
      total: faqs.length,
    });
  } catch (error) {
    log.error('Error obtenint FAQs:', error);
    return NextResponse.json(
      { error: 'Error obtenint FAQs' },
      { status: 500 }
    );
  }
}

// POST - Crear nova FAQ
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const parsed = faqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { translations, ...faqData } = parsed.data;

    // Verificar slug únic
    const existing = await prisma.fAQ.findUnique({
      where: { slug: faqData.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `El slug ${faqData.slug} ja existeix` },
        { status: 409 }
      );
    }

    const faq = await prisma.fAQ.create({
      data: {
        ...faqData,
        translations: {
          create: translations,
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
      { error: 'Error creant FAQ' },
      { status: 500 }
    );
  }
}