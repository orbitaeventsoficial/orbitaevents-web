import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { listTemplates, upsertTemplate } from '@/lib/services/emailTemplateService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const templates = await listTemplates();
  return NextResponse.json({ ok: true, templates });
}

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

  const template = await upsertTemplate({ slug, locale, subject, bodyHtml });
  return NextResponse.json({ ok: true, template });
}