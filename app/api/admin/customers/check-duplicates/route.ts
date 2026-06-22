/**
 * API ROUTE: Check Duplicates (real-time)
 * Comprova duplicats mentre l'admin escriu dades del client
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { findDuplicates } from '@/lib/services/deduplicationService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { name, email, phone, instagram } = body ?? {};

    if (!name && !email && !phone && !instagram) {
      return NextResponse.json({ ok: true, duplicates: [] });
    }

    const duplicates = await findDuplicates({
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      instagram: instagram || undefined,
    });

    return NextResponse.json({
      ok: true,
      duplicates: duplicates.slice(0, 5).map((d) => ({
        id: d.customer.id,
        name: d.customer.name,
        email: d.customer.email,
        phone: d.customer.phone,
        matchScore: d.matchScore,
        matchReasons: d.matchReasons.map((r) => ({
          field: r.field,
          type: r.type,
          score: r.score,
        })),
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, duplicates: [] });
  }
}
