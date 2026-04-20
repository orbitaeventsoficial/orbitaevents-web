import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { updateCustomerPreferences } from '@/lib/services/customerSegmentationService';

export const dynamic = 'force-dynamic';

const preferencesSchema = z.object({
  musicStyles: z.array(z.string()).optional(),
  preferredVenues: z.array(z.string()).optional(),
  specialNeeds: z.string().max(500).optional(),
  dietaryRestrictions: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * PATCH /api/admin/customers/[id]/preferences
 * Actualitzar preferències del client.
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
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const customer = await updateCustomerPreferences(params.id, parsed.data);
    return NextResponse.json({ ok: true, preferences: customer.preferences });
  } catch (error) {
    log.error('Error actualitzant preferències client', error);
    return NextResponse.json({ ok: false, error: 'Error actualitzant preferències' }, { status: 500 });
  }
}
