import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { updateCustomerContact, deleteCustomerContact } from '@/lib/services/customerContactService';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; cid: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.format() }, { status: 400 });
  }

  const contact = await updateCustomerContact(params.id, params.cid, {
    ...parsed.data,
    email: parsed.data.email !== undefined ? (parsed.data.email || null) : undefined,
  });

  if (!contact) return NextResponse.json({ error: 'No trobat' }, { status: 404 });
  return NextResponse.json({ ok: true, contact });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; cid: string } }
) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  await deleteCustomerContact(params.id, params.cid);
  return NextResponse.json({ ok: true });
}
