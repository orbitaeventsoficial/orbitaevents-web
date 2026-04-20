import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { addCustomerTags, removeCustomerTags, setCustomerTags } from '@/lib/services/customerSegmentationService';

export const dynamic = 'force-dynamic';

const tagsSchema = z.object({
  action: z.enum(['add', 'remove', 'set']),
  tags: z.array(z.string().min(1).max(50)).min(1).max(20),
});

/**
 * PATCH /api/admin/customers/[id]/tags
 * Afegir, treure o substituir tags d'un client.
 * Body: { action: 'add'|'remove'|'set', tags: string[] }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authError = requireAuth(request);
  if (authError) return authError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const parsed = tagsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { action, tags } = parsed.data;
    let customer;

    switch (action) {
      case 'add':
        customer = await addCustomerTags(params.id, tags);
        break;
      case 'remove':
        customer = await removeCustomerTags(params.id, tags);
        break;
      case 'set':
        customer = await setCustomerTags(params.id, tags);
        break;
    }

    return NextResponse.json({ ok: true, tags: customer.tags });
  } catch (error) {
    log.error('Error actualitzant tags client', error);
    return NextResponse.json({ ok: false, error: 'Error actualitzant tags' }, { status: 500 });
  }
}
