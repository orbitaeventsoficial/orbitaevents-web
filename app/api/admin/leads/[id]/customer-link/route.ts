import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import {
  linkLeadToCustomer,
  previewLeadCustomerLink,
} from '@/lib/services/leads/leadCustomerLinkService';

interface Params {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const preview = await previewLeadCustomerLink(params.id);
    if (preview.kind === 'lead-not-found') {
      return NextResponse.json({ ok: false, error: 'Lead no trobat' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    log.error('Error obtenint preview lead→client', error, {
      context: { endpoint: 'GET /api/admin/leads/[id]/customer-link', leadId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error obtenint preview del client' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body invàlid' }, { status: 400 });
  }

  const action =
    typeof body === 'object' && body !== null && 'action' in body
      ? (body as { action?: unknown }).action
      : null;
  const rawCustomerId =
    typeof body === 'object' && body !== null && 'customerId' in body
      ? (body as { customerId?: unknown }).customerId
      : null;
  const customerId = typeof rawCustomerId === 'string' ? rawCustomerId : undefined;

  if (action !== 'link' && action !== 'create') {
    return NextResponse.json(
      { ok: false, error: 'Acció invàlida (link|create)' },
      { status: 400 },
    );
  }

  try {
    const result = await linkLeadToCustomer({
      leadId: params.id,
      action,
      customerId,
      actor: 'Admin',
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      customerId: result.customerId,
      created: result.created,
      alreadyLinked: result.alreadyLinked,
    });
  } catch (error) {
    log.error('Error vinculant lead a client', error, {
      context: { endpoint: 'POST /api/admin/leads/[id]/customer-link', leadId: params.id },
    });
    return NextResponse.json(
      { ok: false, error: 'Error vinculant lead a client' },
      { status: 500 },
    );
  }
}
