import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { z } from 'zod';
import { listCustomerContacts, createCustomerContact } from '@/lib/services/customerContactService';

export const dynamic = 'force-dynamic';

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const contacts = await listCustomerContacts(params.id);
  return NextResponse.json({ ok: true, contacts });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.format() }, { status: 400 });
  }

  const contact = await createCustomerContact(params.id, {
    ...parsed.data,
    email: parsed.data.email || null,
  });

  return NextResponse.json({ ok: true, contact });
}
