import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CSS_KEY = 'admin.css.custom';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const setting = await prisma.setting.findUnique({
    where: { key: CSS_KEY },
    select: { value: true },
  });

  return NextResponse.json({
    ok: true,
    css: setting?.value || '',
  });
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const body = await req.json().catch(() => null) as { css?: string } | null;
  const css = typeof body?.css === 'string' ? body.css : '';

  await prisma.setting.upsert({
    where: { key: CSS_KEY },
    update: {
      value: css,
      type: 'STRING',
      category: 'config',
      label: 'Custom CSS admin',
      description: 'CSS custom aplicat només al panell admin',
    },
    create: {
      key: CSS_KEY,
      value: css,
      type: 'STRING',
      category: 'config',
      label: 'Custom CSS admin',
      description: 'CSS custom aplicat només al panell admin',
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'setting',
      entityId: CSS_KEY,
      details: { key: CSS_KEY, size: css.length },
    },
  });

  return NextResponse.json({ ok: true });
}

