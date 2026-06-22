/**
 * API ROUTE: Process Privacy Request
 * Processar una sol·licitud ARCO específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, verifyBasicAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { processPrivacyRequestById } from '@/lib/services/privacyRequestAdminService';

export const dynamic = 'force-dynamic';

const processSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const auth = verifyBasicAuth(req);
  const adminUser = auth.authenticated ? auth.user || 'admin' : 'admin';

  try {
    const { id } = await params;
    const body = await req.json();

    const validation = processSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Dades invàlides' },
        { status: 400 }
      );
    }

    const result = await processPrivacyRequestById(
      id,
      validation.data.action,
      validation.data.notes,
      adminUser
    );

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
