import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { getAdminRole, requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { indexProtocolCanvisByNumber, parseProtocolCanvis } from '@/lib/services/protocolCanvisService';
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

async function protocolCanviExists(canviN: number): Promise<boolean> {
  const markdown = await readFile(path.join(process.cwd(), 'docs', 'admin-protocol.md'), 'utf-8');
  const index = indexProtocolCanvisByNumber(parseProtocolCanvis(markdown));
  return index.has(canviN);
}

async function ensureKnownCanvi(canviN: number): Promise<Response | null> {
  if (await protocolCanviExists(canviN)) return null;
  return NextResponse.json({ ok: false, error: 'unknown-canvi' }, { status: 404 });
}

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

  const unknownCanviError = await ensureKnownCanvi(parsed.data.canviN);
  if (unknownCanviError) return unknownCanviError;

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

  const unknownCanviError = await ensureKnownCanvi(parsed.data.canviN);
  if (unknownCanviError) return unknownCanviError;

  const removed = await removeCanviValidation(parsed.data.canviN);
  return NextResponse.json({ ok: true, removed });
}
