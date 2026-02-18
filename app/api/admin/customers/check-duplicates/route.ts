/**
 * API ROUTE: Check Duplicates (real-time)
 * Comprova duplicats mentre l'admin escriu dades del client
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { findDuplicates } from '@/lib/services/deduplicationService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, email, phone, instagram } = body;

    if (!name && !email && !phone && !instagram) {
      return NextResponse.json({ ok: true, duplicates: [] });
    }

    const duplicates = await findDuplicates({
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      instagram: instagram || undefined,
    });

    // Retornar max 5 duplicats amb info resumida
    const mapped = duplicates.slice(0, 5).map((d) => ({
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
    }));

    return NextResponse.json({ ok: true, duplicates: mapped });
  } catch {
    return NextResponse.json({ ok: true, duplicates: [] });
  }
}
