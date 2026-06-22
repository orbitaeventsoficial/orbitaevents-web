import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { createAdminFaq, deleteAdminFaq, listAdminFaqs } from '@/lib/services/faqAdminService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const result = await listAdminFaqs();
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint FAQs:', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint FAQs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await createAdminFaq(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant FAQ:', error);
    return NextResponse.json({ ok: false, error: 'Error creant FAQ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const { searchParams } = new URL(req.url);
    const result = await deleteAdminFaq(searchParams.get('id'));
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant FAQ:', error);
    return NextResponse.json({ ok: false, error: 'Error eliminant FAQ' }, { status: 500 });
  }
}
