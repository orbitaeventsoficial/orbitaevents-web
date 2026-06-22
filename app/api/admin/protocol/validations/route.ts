import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminRole, requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import {
  loadCanviValidations,
  recordCanviValidation,
  removeCanviValidation,
} from '@/lib/services/protocolValidationsService';

export const dynamic = 'force-dynamic';

const recordSchema = z.object({
  canviN: z.number().int().positive(),
  notes: z.string().trim().max(500).optional(),
});

const deleteSchema = z.object({
  canviN: z.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const map = await loadCanviValidations();
  return NextResponse.json({ ok: true, validations: Array.from(map.values()) });
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid-body', issues: parsed.error.flatten() }, { status: 400 });
  }

  const validatedBy = getAdminRole(req);

  const validation = await recordCanviValidation({
    canviN: parsed.data.canviN,
    validatedBy,
    notes: parsed.data.notes,
  });

  return NextResponse.json({ ok: true, validation });
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid-body', issues: parsed.error.flatten() }, { status: 400 });
  }

  const removed = await removeCanviValidation(parsed.data.canviN);
  return NextResponse.json({ ok: true, removed });
}
