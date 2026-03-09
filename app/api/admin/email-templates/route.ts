import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { listTemplates, TEMPLATE_VARIABLES, type TemplateSlug } from '@/lib/services/emailTemplateService';

export const dynamic = 'force-dynamic';

// GET - Llistar totes les plantilles
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const templates = await listTemplates();
  return NextResponse.json({ ok: true, templates });
}

// POST - Crear o actualitzar una plantilla
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const { slug, locale, subject, bodyHtml } = body;

  if (!slug || !locale || !subject) {
    return NextResponse.json({ error: 'Cal slug, locale i subject' }, { status: 400 });
  }

  const variables = TEMPLATE_VARIABLES[slug as TemplateSlug] || [];

  const template = await prisma.emailTemplate.upsert({
    where: { slug_locale: { slug, locale } },
    update: {
      subject,
      bodyHtml: bodyHtml || '',
      variables: JSON.stringify(variables),
      isActive: true,
    },
    create: {
      slug,
      locale,
      subject,
      bodyHtml: bodyHtml || '',
      variables: JSON.stringify(variables),
      description: null,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, template });
}
